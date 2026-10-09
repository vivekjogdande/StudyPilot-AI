
import { useEffect, useMemo, useState } from "react";

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getTopicName = (item, index) => {
  if (typeof item === "string") return item;
  return item?.topic || item?.name || `Topic ${index + 1}`;
};

function Dashboard({ onNavigate }) {
  const [syllabus, setSyllabus] = useState(() =>
    readStorage("studypilot_syllabus", null)
  );

  const [quizResults, setQuizResults] = useState(() =>
    readStorage("studypilot_quiz_results", [])
  );

  const [completedTasks, setCompletedTasks] = useState(() =>
    readStorage("studypilot_completed_tasks", {})
  );

  // Refresh saved information when the dashboard is revisited
  // or another component updates localStorage in this tab.
  useEffect(() => {
    const refreshData = () => {
      setSyllabus(readStorage("studypilot_syllabus", null));
      setQuizResults(readStorage("studypilot_quiz_results", []));
      setCompletedTasks(readStorage("studypilot_completed_tasks", {}));
    };

    window.addEventListener("focus", refreshData);
    window.addEventListener("storage", refreshData);
    window.addEventListener("studypilot-data-updated", refreshData);

    return () => {
      window.removeEventListener("focus", refreshData);
      window.removeEventListener("storage", refreshData);
      window.removeEventListener(
        "studypilot-data-updated",
        refreshData
      );
    };
  }, []);

  const topics = useMemo(() => {
    const rawTopics = Array.isArray(syllabus?.topics)
      ? syllabus.topics
      : [];

    return rawTopics
      .map((item, index) => ({
        name: getTopicName(item, index).trim(),
        index,
      }))
      .filter((item) => item.name);
  }, [syllabus]);

  const validResults = useMemo(() => {
    return (Array.isArray(quizResults) ? quizResults : [])
      .filter(
        (result) =>
          Number.isFinite(Number(result.percentage)) &&
          result.totalQuestions > 0
      )
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() -
          new Date(a.date || 0).getTime()
      );
  }, [quizResults]);

  const quizCount = validResults.length;

  const averageScore = quizCount
    ? Math.round(
        validResults.reduce(
          (sum, result) => sum + Number(result.percentage),
          0
        ) / quizCount
      )
    : null;

  const topicScores = useMemo(() => {
    const grouped = {};

    validResults.forEach((result) => {
      const name = String(result.topic || "General Studies").trim();
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(Number(result.percentage));
    });

    return Object.entries(grouped)
      .map(([name, scores]) => ({
        name,
        score: Math.round(
          scores.reduce((sum, score) => sum + score, 0) /
            scores.length
        ),
        attempts: scores.length,
      }))
      .sort((a, b) => a.score - b.score);
  }, [validResults]);

  const tasks = useMemo(() => {
    if (topics.length) {
      return topics.slice(0, 3).map((topic, index) => ({
        id: `topic-${topic.name}`,
        title: topic.name,
        duration: index === 0 ? "30 minutes" : "20 minutes",
        difficulty: index === 0 ? "Start here" : "Practice",
        actionTopic: topic.name,
      }));
    }

    if (validResults.length) {
      return validResults.slice(0, 3).map((result, index) => ({
        id: `review-${result.id || result.date || index}`,
        title: `Review ${result.topic || "your last quiz"}`,
        duration: "20 minutes",
        difficulty: "Review",
        actionTopic: result.topic || "General Studies",
      }));
    }

    return [];
  }, [topics, validResults]);

  const completedCount = tasks.filter(
    (task) => completedTasks[task.id]
  ).length;

  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const toggleTask = (taskId) => {
    setCompletedTasks((previous) => {
      const updated = {
        ...previous,
        [taskId]: !previous[taskId],
      };

      try {
        localStorage.setItem(
          "studypilot_completed_tasks",
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error("Unable to save task progress:", error);
      }

      return updated;
    });
  };

  const practiceTopic =
    topicScores[0]?.name ||
    topics[0]?.name ||
    validResults[0]?.topic ||
    "";

  const openTutor = (topic = "") => {
    onNavigate("ai-tutor", topic);
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">🎓</div>
          <div>
            <h2>StudyPilot</h2>
            <p>AI Learning Companion</p>
          </div>
        </div>

        <nav className="navigation">
          <button
            className="nav-item active"
            onClick={() => onNavigate("dashboard")}
          >
            <span className="nav-icon">🏠</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => onNavigate("study-plan")}
          >
            <span className="nav-icon">📚</span>
            Study Plan
          </button>

          <button
            className="nav-item"
            onClick={() => onNavigate("upload")}
          >
            <span className="nav-icon">📄</span>
            Upload Syllabus
          </button>

          <button
            className="nav-item"
            onClick={() => onNavigate("quiz")}
          >
            <span className="nav-icon">📝</span>
            Quiz
          </button>

          <button
            className="nav-item"
            onClick={() => onNavigate("analytics")}
          >
            <span className="nav-icon">📊</span>
            Analytics
          </button>

          <button
            className="nav-item"
            onClick={() => onNavigate("ai-tutor")}
          >
            <span className="nav-icon">🤖</span>
            AI Tutor
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="student-card">
            <div className="student-avatar">V</div>
            <div>
              <strong>Vivek</strong>
              <span>Student</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, Vivek 👋</h1>
            <p>Let's continue your learning journey.</p>
          </div>
          <div className="header-profile">
            <div className="header-avatar">V</div>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-title">Syllabus Topics</span>
              <div className="stat-icon">📚</div>
            </div>
            <div className="stat-value">{topics.length}</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-title">Quizzes Completed</span>
              <div className="stat-icon">📝</div>
            </div>
            <div className="stat-value">{quizCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-title">Average Score</span>
              <div className="stat-icon">🎯</div>
            </div>
            <div className="stat-value">
              {averageScore === null ? "—" : `${averageScore}%`}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-title">Latest Quiz</span>
              <div className="stat-icon">🔥</div>
            </div>
            <div
              className="stat-value"
              style={{ fontSize: "18px", overflowWrap: "anywhere" }}
            >
              {validResults[0]?.topic || "Not attempted"}
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h2>Today's Study Tasks</h2>
                <p>
                  Tasks are based on your uploaded syllabus or quiz history.
                </p>
              </div>
              <span>{tasks.length} Tasks</span>
            </div>

            {tasks.length ? (
              <div className="task-list">
                {tasks.map((task) => (
                  <div className="task-item" key={task.id}>
                    <button
                      className="task-check"
                      aria-label={`Mark ${task.title} ${
                        completedTasks[task.id] ? "incomplete" : "complete"
                      }`}
                      aria-pressed={Boolean(completedTasks[task.id])}
                      onClick={() => toggleTask(task.id)}
                    >
                      {completedTasks[task.id] ? "✓" : ""}
                    </button>

                    <div className="task-info">
                      <div className="task-name">{task.title}</div>
                      <div className="task-meta">{task.duration}</div>
                    </div>

                    <button
                      className="task-difficulty"
                      onClick={() => onNavigate("quiz", task.actionTopic)}
                      title={`Practice ${task.actionTopic}`}
                    >
                      {task.difficulty}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p>
                  No syllabus or quiz history yet. Upload a PDF to build
                  your personalized study dashboard.
                </p>
                <button
                  className="recommendation-button"
                  onClick={() => onNavigate("upload")}
                >
                  📄 Upload Syllabus →
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h2>Study Progress</h2>
                <p>Completion of your current dashboard tasks.</p>
              </div>
            </div>

            <div className="progress-wrapper">
              <div className="progress-label">
                <span>Task completion</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              {tasks.length === 0
                ? "Upload a syllabus to get started."
                : progress === 100
                ? "All listed tasks completed. Great work! 🚀"
                : `${completedCount} of ${tasks.length} tasks completed. Keep going! 💪`}
            </div>
          </div>
        </section>

        <div className="dashboard-card" style={{ marginTop: "20px" }}>
          <div className="card-header">
            <div>
              <h2>Topics That Need Attention</h2>
              <p>
                Based on your saved quiz results. Topics without quiz results
                are not assigned a made-up score.
              </p>
            </div>

            {practiceTopic && (
              <button
                className="recommendation-button"
                onClick={() => openTutor(practiceTopic)}
              >
                Practice Now →
              </button>
            )}
          </div>

          {topicScores.length ? (
            <div className="attention-list">
              {topicScores.slice(0, 5).map((item) => (
                <div className="attention-item" key={item.name}>
                  <div className="attention-row">
                    <span className="attention-name">{item.name}</span>
                    <span className="attention-score">{item.score}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.max(0, Math.min(100, item.score))}%`,
                      }}
                    />
                  </div>
                  <small>
                    {item.attempts} quiz attempt
                    {item.attempts === 1 ? "" : "s"}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p>
              Complete a quiz to see which topics need more practice.
            </p>
          )}

          <div className="recommendation-card">
            <h3>🤖 StudyPilot Learning Recommendation</h3>
            <p>
              {topicScores.length
                ? `Your lowest recorded quiz average is ${topicScores[0].score}% for ${topicScores[0].name}. Review the topic and try another quiz.`
                : topics.length
                ? `You have ${topics.length} syllabus topics saved. Start with ${topics[0].name} and complete a quiz to build your performance insights.`
                : "Upload your syllabus and complete quizzes to receive personalized learning recommendations."}
            </p>

            <button
              className="recommendation-button"
              onClick={() =>
                practiceTopic
                  ? openTutor(practiceTopic)
                  : onNavigate("upload")
              }
            >
              {practiceTopic ? "Ask AI Tutor →" : "Upload Syllabus →"}
            </button>
          </div>
        </div>

        {syllabus?.fileName && (
          <p
            style={{
              color: "#64748b",
              fontSize: "13px",
              marginTop: "16px",
            }}
          >
            Current syllabus: {syllabus.fileName}
          </p>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
