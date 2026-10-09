import { useEffect, useRef, useState } from "react";

function AITutor({ topic, onBack }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: topic
        ? `Hi! 👋 I'm your StudyPilot AI Tutor. I can help you understand ${topic}. Ask me anything about this topic.`
        : "Hi! 👋 I'm your StudyPilot AI Tutor. Ask me anything about your studies.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Send question to FastAPI backend
  const sendToAI = async (userQuestion) => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: userQuestion,
            topic: topic || "General Studies",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(
          data.error
            ? JSON.stringify(data.error)
            : "AI request failed"
        );
      }

      return (
        data.answer ||
        "Sorry, I could not generate an answer right now."
      );
    } catch (error) {
      console.error("AI Tutor Error:", error);

      return `⚠️ I couldn't connect to the AI backend.

Please make sure your FastAPI backend is running at:

http://127.0.0.1:8000

Then try your question again.

Technical error: ${error.message}`;
    }
  };

  // Send question
  const sendQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    // Add user's message immediately
    const userMessage = {
      sender: "user",
      text: trimmedQuestion,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    setQuestion("");
    setLoading(true);

    // Get real AI response
    const aiResponse = await sendToAI(
      trimmedQuestion
    );

    const aiMessage = {
      sender: "ai",
      text: aiResponse,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      aiMessage,
    ]);

    setLoading(false);
  };

  // Enter key support
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendQuestion();
    }
  };

  // Quick question
  const askQuickQuestion = (quickQuestion) => {
    setQuestion(quickQuestion);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ================= HEADER ================= */}

      <div
        style={{
          background: "#ffffff",
          borderBottom:
            "1px solid #e2e8f0",
          padding: "28px 34px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "12px",
            border:
              "1px solid #dbe2ea",
            background: "#ffffff",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ←
        </button>

        <div
          style={{
            fontSize: "40px",
          }}
        >
          🤖
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 750,
              color: "#172554",
            }}
          >
            StudyPilot AI Tutor
          </h1>

          <p
            style={{
              margin:
                "5px 0 0",
              color: "#7b8ba5",
              fontSize: "14px",
            }}
          >
            Learning:{" "}
            {topic || "General Studies"}
          </p>
        </div>
      </div>

      {/* ================= CHAT AREA ================= */}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding:
            "35px 20px 150px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {/* Messages */}

          {messages.map(
            (message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    message.sender ===
                    "user"
                      ? "flex-end"
                      : "flex-start",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    maxWidth:
                      message.sender ===
                      "user"
                        ? "65%"
                        : "75%",
                    padding:
                      "18px 20px",
                    borderRadius:
                      message.sender ===
                      "user"
                        ? "18px 18px 5px 18px"
                        : "18px 18px 18px 5px",
                    background:
                      message.sender ===
                      "user"
                        ? "#635bff"
                        : "#ffffff",
                    color:
                      message.sender ===
                      "user"
                        ? "#ffffff"
                        : "#263858",
                    border:
                      message.sender ===
                      "user"
                        ? "none"
                        : "1px solid #e1e7ef",
                    boxShadow:
                      message.sender ===
                      "user"
                        ? "0 5px 15px rgba(99,91,255,0.18)"
                        : "0 3px 12px rgba(15,23,42,0.04)",
                    fontSize: "17px",
                    lineHeight: "1.7",
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {message.text}
                </div>
              </div>
            )
          )}

          {/* Loading */}

          {loading && (
            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-start",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  background:
                    "#ffffff",
                  border:
                    "1px solid #e1e7ef",
                  borderRadius:
                    "18px 18px 18px 5px",
                  padding:
                    "18px 22px",
                  color: "#718096",
                  boxShadow:
                    "0 3px 12px rgba(15,23,42,0.04)",
                }}
              >
                <span>
                  🤖 StudyPilot is thinking
                </span>

                <span
                  style={{
                    marginLeft: "8px",
                  }}
                >
                  •••
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ================= QUICK QUESTIONS ================= */}

      <div
        style={{
          position: "fixed",
          bottom: "108px",
          left: 0,
          right: 0,
          pointerEvents:
            "none",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding:
              "0 20px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            pointerEvents:
              "auto",
          }}
        >
          <button
            onClick={() =>
              askQuickQuestion(
                `Explain ${topic || "this topic"} in simple words`
              )
            }
            style={{
              border:
                "1px solid #dbe2ea",
              background:
                "#ffffff",
              borderRadius: "20px",
              padding:
                "8px 14px",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            💡 Explain simply
          </button>

          <button
            onClick={() =>
              askQuickQuestion(
                `Give me an example of ${topic || "this topic"}`
              )
            }
            style={{
              border:
                "1px solid #dbe2ea",
              background:
                "#ffffff",
              borderRadius: "20px",
              padding:
                "8px 14px",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            📚 Give example
          </button>

          <button
            onClick={() =>
              askQuickQuestion(
                `Give me important exam questions about ${topic || "this topic"}`
              )
            }
            style={{
              border:
                "1px solid #dbe2ea",
              background:
                "#ffffff",
              borderRadius: "20px",
              padding:
                "8px 14px",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            📝 Exam questions
          </button>

          <button
            onClick={() =>
              askQuickQuestion(
                `Explain ${topic || "this topic"} step by step`
              )
            }
            style={{
              border:
                "1px solid #dbe2ea",
              background:
                "#ffffff",
              borderRadius: "20px",
              padding:
                "8px 14px",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            🔍 Step by step
          </button>
        </div>
      </div>

      {/* ================= INPUT ================= */}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background:
            "rgba(245,247,251,0.96)",
          backdropFilter:
            "blur(10px)",
          borderTop:
            "1px solid #e2e8f0",
          padding:
            "18px 20px",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            background:
              "#ffffff",
            border:
              "1px solid #dbe2ea",
            borderRadius: "16px",
            padding:
              "8px 10px 8px 18px",
            display: "flex",
            alignItems:
              "center",
            gap: "10px",
            boxShadow:
              "0 4px 20px rgba(15,23,42,0.05)",
          }}
        >
          <input
            type="text"
            value={question}
            onChange={(event) =>
              setQuestion(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            disabled={loading}
            placeholder={
              topic
                ? `Ask about ${topic}...`
                : "Ask about your studies..."
            }
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "16px",
              color: "#1e293b",
              background:
                "transparent",
              padding:
                "14px 0",
            }}
          />

          <button
            onClick={
              sendQuestion
            }
            disabled={
              loading ||
              !question.trim()
            }
            style={{
              width: "52px",
              height: "52px",
              border: "none",
              borderRadius:
                "13px",
              background:
                loading ||
                !question.trim()
                  ? "#cbd5e1"
                  : "#635bff",
              color:
                "#ffffff",
              fontSize:
                "22px",
              cursor:
                loading ||
                !question.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default AITutor;