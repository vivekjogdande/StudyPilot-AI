import { useRef, useState } from "react";

function SyllabusUpload({ onBack, onNavigate }) {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [topics, setTopics] = useState([]);

  const handleFileSelect = (selectedFile) => {
    setError("");
    setMessage("");
    setTopics([]);

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("PDF size must be less than 10 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    handleFileSelect(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const droppedFile = event.dataTransfer.files?.[0];

    handleFileSelect(droppedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const uploadSyllabus = async () => {
    if (!file) {
      setError("Please select a PDF syllabus first.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    setTopics([]);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/api/syllabus/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.detail ||
            data.error ||
            "Unable to process the syllabus."
        );
      }

      const extractedTopics =
        data.topics || [];

      setTopics(extractedTopics);

      setMessage(
        "🎉 Syllabus analyzed successfully!"
      );

      // Save extracted syllabus information
      localStorage.setItem(
        "studypilot_syllabus",
        JSON.stringify({
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          topics: extractedTopics,
          text: data.text || "",
        })
      );
    } catch (err) {
      console.error(
        "Syllabus upload error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the StudyPilot backend."
      );
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setTopics([]);
    setMessage("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openStudyPlan = () => {
    if (onNavigate) {
      onNavigate("study-plan");
    }
  };

  return (
    <div className="page-container">
      {/* HEADER */}

      <div
        className="page-top"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>📄 Upload Syllabus</h1>

          <p>
            Upload your syllabus and let StudyPilot
            create your personalized learning journey.
          </p>
        </div>

        {onBack && (
          <button
            className="back-button"
            onClick={onBack}
          >
            ← Back
          </button>
        )}
      </div>

      {/* HOW IT WORKS */}

      <div className="dashboard-card">
        <h2>🚀 How StudyPilot Works</h2>

        <p
          style={{
            color: "#718096",
            marginTop: "6px",
          }}
        >
          Your syllabus becomes the starting point
          for your personalized AI learning plan.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginTop: "25px",
          }}
        >
          <div
            style={{
              padding: "20px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "35px" }}>
              📄
            </div>

            <h3>1. Upload</h3>

            <p
              style={{
                color: "#718096",
                fontSize: "14px",
              }}
            >
              Upload your syllabus PDF.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "35px" }}>
              🤖
            </div>

            <h3>2. Analyze</h3>

            <p
              style={{
                color: "#718096",
                fontSize: "14px",
              }}
            >
              AI identifies subjects and topics.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "35px" }}>
              🧠
            </div>

            <h3>3. Personalize</h3>

            <p
              style={{
                color: "#718096",
                fontSize: "14px",
              }}
            >
              StudyPilot creates your learning path.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "35px" }}>
              📚
            </div>

            <h3>4. Learn</h3>

            <p
              style={{
                color: "#718096",
                fontSize: "14px",
              }}
            >
              Study, practice and improve.
            </p>
          </div>
        </div>
      </div>

      {/* UPLOAD */}

      <div className="dashboard-card">
        <h2>📤 Choose Your Syllabus</h2>

        <p
          style={{
            color: "#718096",
            marginTop: "5px",
            marginBottom: "22px",
          }}
        >
          Supported format: PDF • Maximum size: 10
          MB
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() =>
            fileInputRef.current?.click()
          }
          style={{
            border: "2px dashed #cbd5e1",
            borderRadius: "18px",
            padding: "55px 25px",
            textAlign: "center",
            cursor: "pointer",
            background: "#fafbff",
          }}
        >
          <div
            style={{
              fontSize: "55px",
              marginBottom: "12px",
            }}
          >
            📄
          </div>

          <h3>
            Drag & Drop your syllabus here
          </h3>

          <p
            style={{
              color: "#718096",
            }}
          >
            or click here to browse your computer
          </p>

          <button
            type="button"
            className="recommendation-button"
            style={{
              marginTop: "10px",
            }}
          >
            📁 Choose PDF
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            style={{
              display: "none",
            }}
          />
        </div>
      </div>

      {/* SELECTED FILE */}

      {file && (
        <div className="dashboard-card">
          <h2>📎 Selected File</h2>

          <div
            style={{
              marginTop: "18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              padding: "18px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                }}
              >
                📕
              </div>

              <div>
                <strong>
                  {file.name}
                </strong>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#718096",
                    fontSize: "13px",
                  }}
                >
                  {(file.size / 1024 / 1024).toFixed(
                    2
                  )}{" "}
                  MB
                </p>
              </div>
            </div>

            <button
              onClick={removeFile}
              className="back-button"
              disabled={uploading}
            >
              ✕ Remove
            </button>
          </div>

          <button
            onClick={uploadSyllabus}
            disabled={uploading}
            className="recommendation-button"
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "15px",
              fontSize: "16px",
            }}
          >
            {uploading
              ? "🤖 StudyPilot is analyzing..."
              : "🚀 Analyze Syllabus with AI"}
          </button>
        </div>
      )}

      {/* SUCCESS */}

      {message && (
        <div
          className="recommendation-card"
          style={{
            marginTop: "20px",
          }}
        >
          <h3>🎉 Success</h3>

          <p>{message}</p>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "18px",
            borderRadius: "14px",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#be123c",
          }}
        >
          <strong>
            ⚠️ Something went wrong
          </strong>

          <p
            style={{
              margin: "7px 0 0",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* AI TOPICS */}

      {topics.length > 0 && (
        <div
          className="dashboard-card"
          style={{
            marginTop: "20px",
          }}
        >
          <h2>
            🧠 Topics Found by StudyPilot
          </h2>

          <p
            style={{
              color: "#718096",
              marginTop: "5px",
            }}
          >
            These topics were extracted from your
            uploaded syllabus.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            {topics.map((item, index) => {
              const topicName =
                typeof item === "string"
                  ? item
                  : item.topic ||
                    item.name ||
                    `Topic ${index + 1}`;

              return (
                <div
                  key={index}
                  style={{
                    padding: "17px",
                    borderRadius: "12px",
                    border:
                      "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: "#eef2ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      color: "#635bff",
                    }}
                  >
                    {index + 1}
                  </span>

                  <strong>
                    {topicName}
                  </strong>
                </div>
              );
            })}
          </div>

          <button
            onClick={openStudyPlan}
            className="recommendation-button"
            style={{
              marginTop: "25px",
            }}
          >
            📚 Create Study Plan →
          </button>
        </div>
      )}
    </div>
  );
}

export default SyllabusUpload;