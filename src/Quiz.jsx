
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeTopics(syllabus) {
  if (!Array.isArray(syllabus?.topics)) return [];

  return syllabus.topics
    .map((topic) =>
      typeof topic === "string"
        ? topic
        : topic?.topic || topic?.name || ""
    )
    .map((topic) => topic.trim())
    .filter(Boolean);
}

function parseQuestions(answer, requestedCount) {
  const cleaned = answer.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end <= start) {
    throw new Error("The AI did not return a valid question list. Please try again.");
  }

  let questions;

  try {
    questions = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("The AI response was not valid JSON. Please try again.");
  }

  if (!Array.isArray(questions)) {
    throw new Error("The AI response did not contain a question array.");
  }

  const letters = ["A", "B", "C", "D"];

  const valid = questions
    .map((item) => {
      const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option).trim())
        : [];

      const answer = String(
        item.answer ?? item.correctAnswer ?? ""
      ).trim();

      const answerIndex = letters.indexOf(answer.toUpperCase());

      return {
        question: String(item.question || "").trim(),
        options,
        answer:
          answerIndex >= 0 && answerIndex < options.length
            ? options[answerIndex]
            : answer,
        explanation: String(item.explanation || "").trim(),
      };
    })
    .filter(
      (item) =>
        item.question &&
        item.options.length === 4 &&
        item.options.every(Boolean) &&
        item.options.includes(item.answer)
    );

  if (valid.length < requestedCount) {
    throw new Error(
      `The AI generated only ${valid.length} valid questions out of ${requestedCount}. Please try again.`
    );
  }

  return valid.slice(0, requestedCount);
}

function Quiz({ onNavigate }) {
  const [topics, setTopics] = useState(() =>
    normalizeTopics(readStorage("studypilot_syllabus", null))
  );

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(null);

  useEffect(() => {
    const refreshTopics = () => {
      const storedTopics = normalizeTopics(
        readStorage("studypilot_syllabus", null)
      );

      setTopics(storedTopics);
      setTopic((current) =>
        storedTopics.includes(current) ? current : storedTopics[0] || ""
      );
    };

    refreshTopics();

    window.addEventListener("focus", refreshTopics);
    window.addEventListener("storage", refreshTopics);
    window.addEventListener("studypilot-data-updated", refreshTopics);

    return () => {
      window.removeEventListener("focus", refreshTopics);
      window.removeEventListener("storage", refreshTopics);
      window.removeEventListener("studypilot-data-updated", refreshTopics);
    };
  }, []);

  const currentQuestion = questions[currentIndex];

  const score = useMemo(() => {
    if (!submitted) return 0;

    return questions.reduce(
      (total, question, index) =>
        total + (answers[index] === question.answer ? 1 : 0),
      0
    );
  }, [submitted, questions, answers]);

  const percentage = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  async function generateQuiz() {
    if (!topic.trim()) {
      setError("Upload a syllabus first, or select a study topic.");
      return;
    }

    const count = Number(questionCount);

    if (![5, 10, 15, 20, 30].includes(count)) {
      setError("Please select 5, 10, 15, 20, or 30 questions.");
      return;
    }

    setLoading(true);
    setError("");
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);

    const prompt = `
Generate exactly ${count} multiple-choice quiz questions for a college student.

Topic: ${topic}
Difficulty: ${difficulty}
Required number of questions: ${count}

Requirements:
- Return exactly ${count} distinct questions.
- Focus only on the selected topic.
- Make questions clear, accurate, and suitable for the selected difficulty.
- Give exactly four options per question.
- Provide one correct answer using the exact text of its option.
- Include a short explanation for each answer.
- Do not repeat questions.
- Return ONLY a valid JSON array with no introduction or Markdown.
- Use this structure for each item:
{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Exact text of the correct option",
  "explanation": "Why the answer is correct"
}
`;

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, topic }),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed (${response.status}).`);
      }

      const data = await response.json();

      if (!data.success || !data.answer) {
        throw new Error(
          data.error
            ? JSON.stringify(data.error)
            : data.answer || "The AI could not generate questions."
        );
      }

      const generatedQuestions = parseQuestions(data.answer, count);

      setQuestions(generatedQuestions);
      setStartedAt(Date.now());
    } catch (err) {
      setError(
        `${err.message || "Unable to generate the quiz."} Make sure the backend is running at ${API_URL}.`
      );
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(answer) {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [currentIndex]: answer,
    }));
  }

  function finishQuiz() {
    if (!questions.length || submitted) return;

    const finalScore = questions.reduce(
      (total, question, index) =>
        total + (answers[index] === question.answer ? 1 : 0),
      0
    );

    const finalPercentage = Math.round(
      (finalScore / questions.length) * 100
    );

    const result = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}`,
      topic,
      difficulty,
      score: finalScore,
      totalQuestions: questions.length,
      percentage: finalPercentage,
      date: new Date().toISOString(),
      durationSeconds: startedAt
        ? Math.round((Date.now() - startedAt) / 1000)
        : 0,
    };

    const oldResults = readStorage("studypilot_quiz_results", []);
    const results = Array.isArray(oldResults) ? oldResults : [];

    try {
      localStorage.setItem(
        "studypilot_quiz_results",
        JSON.stringify([...results, result])
      );
      window.dispatchEvent(new Event("studypilot-data-updated"));
    } catch {
      setError("Your quiz finished, but the result could not be saved.");
    }

    setSubmitted(true);
  }

  function resetQuiz() {
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setError("");
    setStartedAt(null);
  }

  if (submitted) {
    return (
      <main className="quiz-page">
        <section className="quiz-result-card">
          <div className="result-emoji">
            {percentage >= 80 ? "🏆" : percentage >= 50 ? "💪" : "📚"}
          </div>

          <h1>{percentage}%</h1>
          <p>
            You answered {score} out of {questions.length} questions correctly.
          </p>

          <div className="result-analysis">
            <h2>🤖 StudyPilot AI Analysis</h2>
            <p>
              {percentage >= 80
                ? `Excellent work! You have a strong understanding of ${topic}.`
                : percentage >= 50
                  ? `You have a developing understanding of ${topic}. Review the incorrect answers and practise again.`
                  : `Spend more time reviewing ${topic}, then try another quiz.`}
            </p>
          </div>

          <div className="quiz-actions">
            <button className="primary-button" onClick={resetQuiz}>
              🔄 Try Again
            </button>
            <button
              className="secondary-button"
              onClick={() => onNavigate?.("ai-tutor", topic)}
            >
              🤖 Ask AI Tutor
            </button>
          </div>
        </section>

        <section className="question-review">
          <h2>Question Review</h2>
          <p>Review your answers and explanations.</p>

          {questions.map((question, index) => {
            const correct = answers[index] === question.answer;

            return (
              <article
                className="review-item"
                key={`${index}-${question.question}`}
              >
                <div className="review-icon">{correct ? "✓" : "✕"}</div>
                <div>
                  <h3>
                    Q{index + 1}. {question.question}
                  </h3>
                  <p>
                    Your answer:{" "}
                    <strong>{answers[index] || "Not answered"}</strong>
                  </p>
                  <p>
                    Correct answer:{" "}
                    <strong className="correct-answer">
                      {question.answer}
                    </strong>
                  </p>
                  {question.explanation && (
                    <p className="answer-explanation">
                      💡 {question.explanation}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>
    );
  }

  if (!questions.length) {
    return (
      <main className="quiz-page">
        <section className="quiz-setup-card">
          <div className="quiz-heading">
            <span className="quiz-heading-icon">📝</span>
            <div>
              <h1>AI Quiz Generator</h1>
              <p>
                Create a quiz from your uploaded syllabus using StudyPilot AI.
              </p>
            </div>
          </div>

          {error && <div className="quiz-error">{error}</div>}

          {topics.length === 0 && (
            <div className="quiz-notice">
              No syllabus topics were found. Open Upload Syllabus and upload a
              PDF before creating a topic-based quiz.
            </div>
          )}

          <div className="quiz-form">
            <label htmlFor="quiz-topic">Select Topic</label>
            <select
              id="quiz-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            >
              <option value="">Choose a topic</option>
              {topics.map((item, index) => (
                <option value={item} key={`${index}-${item}`}>
                  {item}
                </option>
              ))}
            </select>

            <label htmlFor="quiz-difficulty">Difficulty</label>
            <select
              id="quiz-difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <label htmlFor="quiz-count">Number of Questions</label>
            <select
              id="quiz-count"
              value={questionCount}
              onChange={(event) => setQuestionCount(event.target.value)}
            >
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
              <option value="15">15 Questions</option>
              <option value="20">20 Questions</option>
              <option value="30">30 Questions</option>
            </select>

            <button
              className="primary-button generate-quiz-button"
              onClick={generateQuiz}
              disabled={loading || !topics.length}
            >
              {loading ? "🤖 Generating with AI..." : "✨ Generate Quiz"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="quiz-page">
      <section className="quiz-question-card">
        <div className="quiz-progress-heading">
          <div>
            <span className="quiz-topic-label">{topic}</span>
            <h1>{difficulty} Quiz</h1>
          </div>
          <strong>
            Question {currentIndex + 1} of {questions.length}
          </strong>
        </div>

        <div className="quiz-progress-bar">
          <div
            className="quiz-progress-fill"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <h2>{currentQuestion.question}</h2>

        <div className="quiz-options">
          {currentQuestion.options.map((option, index) => (
            <button
              className={`quiz-option ${
                answers[currentIndex] === option ? "selected" : ""
              }`}
              key={`${index}-${option}`}
              onClick={() => selectAnswer(option)}
              aria-pressed={answers[currentIndex] === option}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          ))}
        </div>

        {error && <div className="quiz-error">{error}</div>}

        <div className="quiz-actions">
          <button
            className="secondary-button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => index - 1)}
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              className="primary-button"
              onClick={() => setCurrentIndex((index) => index + 1)}
            >
              Next →
            </button>
          ) : (
            <button className="primary-button" onClick={finishQuiz}>
              Submit Quiz
            </button>
          )}
        </div>

        <p className="quiz-answered-count">
          {Object.keys(answers).length} of {questions.length} answered
        </p>
      </section>
    </main>
  );
}

export default Quiz;
