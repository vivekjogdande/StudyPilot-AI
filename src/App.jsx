
import { useState } from "react";

import Dashboard from "./Dashboard";
import StudyPlan from "./StudyPlan";
import SyllabusUpload from "./SyllabusUpload";
import AITutor from "./AITutor";
import Quiz from "./Quiz";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedTopic, setSelectedTopic] = useState("");

  const navigate = (page, topic = "") => {
    setActivePage(page);

    if (topic) {
      setSelectedTopic(topic);
    }
  };

  return (
    <div className="app">
      {activePage === "dashboard" && (
        <Dashboard onNavigate={navigate} />
      )}

      {activePage === "study-plan" && (
        <StudyPlan
          onBack={() => navigate("dashboard")}
          onNavigate={navigate}
        />
      )}

      {activePage === "upload" && (
        <SyllabusUpload
          onBack={() => navigate("dashboard")}
          onNavigate={navigate}
        />
      )}

      {activePage === "ai-tutor" && (
        <AITutor
          topic={selectedTopic}
          onBack={() => navigate("dashboard")}
        />
      )}

      {activePage === "quiz" && (
        <Quiz
          topic={selectedTopic || "Database Fundamentals"}
          onBack={() => navigate("dashboard")}
          onNavigate={navigate}
        />
      )}

      {activePage === "analytics" && (
        <div className="simple-page">
          <h1>📊 Analytics</h1>
          <p>Your learning analytics will appear here.</p>
          <button onClick={() => navigate("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
