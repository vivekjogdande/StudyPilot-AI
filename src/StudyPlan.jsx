
import { useEffect, useState } from "react";
import "./StudyPlan.css";

const topics = [
  { name: "Database Fundamentals", duration: 30, difficulty: "Easy" },
  { name: "ER Model", duration: 40, difficulty: "Easy" },
  { name: "Normalization", duration: 45, difficulty: "Medium" },
  { name: "Transactions", duration: 40, difficulty: "Medium" },
  { name: "SQL Queries", duration: 35, difficulty: "Hard" },
];

function StudyPlan({ onBack, onNavigate }) {
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("studypilot_completed_topics") || "[]"
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "studypilot_completed_topics",
        JSON.stringify(completed)
      );
    } catch {
      // The page still works if local storage is unavailable.
    }
  }, [completed]);

  const completedCount = topics.filter((topic) =>
    completed.includes(topic.name)
  ).length;

  const progress = Math.round((completedCount / topics.length) * 100);

  function toggleTopic(name) {
    setCompleted((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name]
    );
  }

  function navigate(page, topicName) {
    if (typeof onNavigate === "function") {
      onNavigate(page, topicName);
    }
  }

  return (
    <main className="study-page">
      <header className="study-header">
        <div>
          <h1>📚 Study Plan</h1>
          <p>Your personalized DBMS learning journey.</p>
        </div>

        <button
          className="study-back"
          onClick={() => {
            if (typeof onBack === "function") {
              onBack();
            } else {
              navigate("dashboard");
            }
          }}
        >
          ← Dashboard
        </button>
      </header>

      <section className="study-summary">
        <div className="study-summary-top">
          <div>
            <h2>DBMS Study Plan</h2>
            <p>Exam: 25 October 2026</p>
          </div>
          <strong>{progress}% Complete</strong>
        </div>

        <div
          className="study-progress-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="study-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="study-progress-labels">
          <span>{completedCount} of {topics.length} completed</span>
          <span>{topics.length - completedCount} remaining</span>
        </div>
      </section>

      <section className="study-topics">
        <div className="study-section-heading">
          <h2>Your Learning Roadmap</h2>
          <span>{topics.length} Topics</span>
        </div>

        {topics.map((topic, index) => {
          const isDone = completed.includes(topic.name);

          return (
            <article
              className={`study-topic ${isDone ? "is-complete" : ""}`}
              key={topic.name}
            >
              <button
                className={`study-check ${isDone ? "checked" : ""}`}
                onClick={() => toggleTopic(topic.name)}
                aria-label={`Mark ${topic.name} ${
                  isDone ? "incomplete" : "complete"
                }`}
                aria-pressed={isDone}
              >
                {isDone ? "✓" : ""}
              </button>

              <div className="study-topic-number">{index + 1}</div>

              <div className="study-topic-info">
                <h3>{topic.name}</h3>
                <p>◷ {topic.duration} min</p>
              </div>

              <span
                className={`study-difficulty difficulty-${topic.difficulty.toLowerCase()}`}
              >
                {topic.difficulty}
              </span>

              <div className="study-topic-actions">
                <button
                  className="study-ai-button"
                  onClick={() => navigate("ai-tutor", topic.name)}
                >
                  ✨ Ask AI
                </button>

                <button
                  className="study-quiz-button"
                  onClick={() => navigate("quiz", topic.name)}
                >
                  Practice Quiz
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="study-tip">
        <div className="study-tip-icon">💡</div>
        <div>
          <h3>Keep up the momentum!</h3>
          <p>
            Complete topics, ask AI for explanations, and practise
            with quizzes to prepare for your exam.
          </p>
          <button
            className="study-upload-button"
            onClick={() => navigate("upload")}
          >
            + Upload Syllabus
          </button>
        </div>
      </section>
    </main>
  );
}

export default StudyPlan;
