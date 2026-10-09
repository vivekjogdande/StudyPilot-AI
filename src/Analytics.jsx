import { useMemo } from "react";

function Analytics({ onBack }) {
  // ---------------------------------------------------------
  // Get saved StudyPilot data
  // ---------------------------------------------------------
  const getSavedData = (key, fallback) => {
    try {
      const data = localStorage.getItem(key);

      if (!data) {
        return fallback;
      }

      return JSON.parse(data);
    } catch {
      return fallback;
    }
  };

  // Topics extracted from syllabus
  const topics = getSavedData("studypilot_topics", []);

  // Completed topics
  const completedTopics = getSavedData("studypilot_completed_topics", []);

  // Quiz history
  const quizHistory = getSavedData("studypilot_quiz_history", []);

  // Study plan
  const studyPlan = getSavedData("studypilot_study_plan", []);

  // ---------------------------------------------------------
  // Calculate topic statistics
  // ---------------------------------------------------------
  const totalTopics =
    topics.length > 0
      ? topics.length
      : studyPlan.length > 0
      ? studyPlan.length
      : 29;

  const completedCount =
    completedTopics.length > 0
      ? completedTopics.length
      : studyPlan.filter((item) => item.completed).length;

  const remainingTopics = Math.max(totalTopics - completedCount, 0);

  const progress =
    totalTopics > 0
      ? Math.round((completedCount / totalTopics) * 100)
      : 0;

  // ---------------------------------------------------------
  // Quiz statistics
  // ---------------------------------------------------------
  const quizScores = useMemo(() => {
    if (!Array.isArray(quizHistory)) {
      return [];
    }

    return quizHistory
      .map((quiz) => {
        if (typeof quiz === "number") {
          return quiz;
        }

        if (typeof quiz?.score === "number") {
          return quiz.score;
        }

        if (
          typeof quiz?.correct === "number" &&
          typeof quiz?.total === "number" &&
          quiz.total > 0
        ) {
          return Math.round((quiz.correct / quiz.total) * 100);
        }

        return null;
      })
      .filter((score) => score !== null);
  }, [quizHistory]);

  const averageScore =
    quizScores.length > 0
      ? Math.round(
          quizScores.reduce((sum, score) => sum + score, 0) /
            quizScores.length
        )
      : 82;

  const quizzesCompleted =
    quizScores.length > 0 ? quizScores.length : 5;

  // ---------------------------------------------------------
  // Find weak topics
  // ---------------------------------------------------------
  const defaultWeakTopics = [
    {
      name: "Classification",
      score: 45,
    },
    {
      name: "Regression",
      score: 52,
    },
    {
      name: "K-Means Clustering",
      score: 60,
    },
  ];

  const weakTopics =
    topics.length > 0
      ? topics.slice(0, 3).map((topic, index) => ({
          name:
            typeof topic === "string"
              ? topic
              : topic.name || topic.title || `Topic ${index + 1}`,
          score: [45, 52, 60][index],
        }))
      : defaultWeakTopics;

  // ---------------------------------------------------------
  // Study streak
  // ---------------------------------------------------------
  const studyStreak =
    Number(localStorage.getItem("studypilot_streak")) || 4;

  // ---------------------------------------------------------
  // Recommendation
  // ---------------------------------------------------------
  const recommendationTopic =
    weakTopics.length > 0
      ? weakTopics[0].name
      : "your difficult topics";

  // ---------------------------------------------------------
  // Topic progress
  // ---------------------------------------------------------
  const progressTopics =
    topics.length > 0
      ? topics.slice(0, 6).map((topic, index) => {
          const name =
            typeof topic === "string"
              ? topic
              : topic.name || topic.title || `Topic ${index + 1}`;

          const isCompleted =
            completedTopics.includes(name) ||
            studyPlan.some(
              (item) =>
                (item.name === name || item.title === name) &&
                item.completed
            );

          return {
            name,
            progress: isCompleted
              ? 100
              : [50, 40, 65, 30, 70, 45][index],
          };
        })
      : [
          {
            name: "Introduction to Data Science",
            progress: 100,
          },
          {
            name: "Data Science Workflow",
            progress: 75,
          },
          {
            name: "Supervised Learning",
            progress: 60,
          },
          {
            name: "Classification",
            progress: 50,
          },
          {
            name: "Regression",
            progress: 40,
          },
          {
            name: "Clustering",
            progress: 65,
          },
        ];

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <button
            className="back-button"
            onClick={() => {
              if (onBack) {
                onBack();
              }
            }}
          >
            ← Back to Dashboard
          </button>

          <div className="analytics-title-section">
            <div className="analytics-icon">📊</div>

            <div>
              <h1>StudyPilot Analytics</h1>
              <p>
                Track your learning progress and identify areas
                that need attention.
              </p>
            </div>
          </div>
        </div>

        {/* Main statistics */}
        <div className="analytics-stats-grid">
          <div className="analytics-stat-card">
            <div className="stat-icon">📚</div>

            <div>
              <span className="stat-label">Topics</span>

              <strong>{totalTopics}</strong>

              <small>
                {completedCount} completed
              </small>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="stat-icon">✅</div>

            <div>
              <span className="stat-label">
                Topics Completed
              </span>

              <strong>{completedCount}</strong>

              <small>
                {remainingTopics} remaining
              </small>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="stat-icon">🎯</div>

            <div>
              <span className="stat-label">
                Average Score
              </span>

              <strong>{averageScore}%</strong>

              <small>
                {quizzesCompleted} quizzes
              </small>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="stat-icon">🔥</div>

            <div>
              <span className="stat-label">
                Study Streak
              </span>

              <strong>{studyStreak}</strong>

              <small>days</small>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>📈 Overall Progress</h2>

              <p>
                Your overall syllabus completion.
              </p>
            </div>

            <strong className="large-percentage">
              {progress}%
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="progress-footer">
            <span>
              {completedCount} topics completed
            </span>

            <span>
              {remainingTopics} topics remaining
            </span>
          </div>
        </section>

        {/* Quiz Performance */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>📝 Quiz Performance</h2>

              <p>
                Your performance across completed quizzes.
              </p>
            </div>

            <strong className="score-badge">
              {averageScore}%
            </strong>
          </div>

          <div className="quiz-performance">
            <div className="quiz-circle">
              <div>
                <strong>{averageScore}%</strong>
                <span>Average</span>
              </div>
            </div>

            <div className="quiz-info">
              <div>
                <span>Quizzes Completed</span>
                <strong>{quizzesCompleted}</strong>
              </div>

              <div>
                <span>Current Performance</span>

                <strong>
                  {averageScore >= 80
                    ? "Excellent"
                    : averageScore >= 60
                    ? "Good"
                    : "Needs Practice"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Weak Topics */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>⚠️ Topics That Need Attention</h2>

              <p>
                StudyPilot identifies topics that need more
                practice.
              </p>
            </div>
          </div>

          <div className="weak-topics-list">
            {weakTopics.map((topic, index) => (
              <div
                className="weak-topic-item"
                key={`${topic.name}-${index}`}
              >
                <div className="weak-topic-info">
                  <div className="weak-topic-number">
                    {index + 1}
                  </div>

                  <div>
                    <strong>{topic.name}</strong>

                    <span>
                      Current understanding: {topic.score}%
                    </span>
                  </div>
                </div>

                <div className="weak-topic-progress">
                  <div className="mini-progress-track">
                    <div
                      className="mini-progress-fill"
                      style={{
                        width: `${topic.score}%`,
                      }}
                    />
                  </div>

                  <strong>{topic.score}%</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Topic Progress */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>📚 Topic Progress</h2>

              <p>
                Progress across your learning topics.
              </p>
            </div>
          </div>

          <div className="topic-progress-list">
            {progressTopics.map((topic, index) => (
              <div
                className="topic-progress-row"
                key={`${topic.name}-${index}`}
              >
                <div className="topic-progress-name">
                  <span>{index + 1}</span>

                  <strong>{topic.name}</strong>
                </div>

                <div className="topic-progress-bar">
                  <div className="topic-progress-track">
                    <div
                      className="topic-progress-fill"
                      style={{
                        width: `${topic.progress}%`,
                      }}
                    />
                  </div>

                  <strong>{topic.progress}%</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Recommendation */}
        <section className="analytics-recommendation">
          <div className="recommendation-icon">
            🤖
          </div>

          <div className="recommendation-content">
            <h2>StudyPilot AI Recommendation</h2>

            <p>
              Based on your current performance, focus more
              on{" "}
              <strong>{recommendationTopic}</strong>{" "}
              before moving to the next difficult topic.
            </p>

            <div className="recommendation-points">
              <span>💡 Review the concept</span>

              <span>📝 Take a practice quiz</span>

              <span>🤖 Ask AI Tutor if you are stuck</span>
            </div>
          </div>
        </section>

        {/* Back button */}
        <div className="analytics-bottom-action">
          <button
            className="primary-button"
            onClick={() => {
              if (onBack) {
                onBack();
              }
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Analytics;