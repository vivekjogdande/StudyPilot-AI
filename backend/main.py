
import json
import os
import re

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import the OCR-enabled extractor.
# Do NOT define extract_pdf_text again in this file.
from pdf_extractor import extract_pdf_text


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
OLLAMA_URL = "https://ollama.com/api/chat"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:cloud")


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="StudyPilot AI Backend",
    description="AI-powered adaptive learning backend",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATA MODELS
# =========================================================

class ChatRequest(BaseModel):
    question: str
    topic: str | None = None


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "StudyPilot AI Backend is running 🚀",
        "service": "StudyPilot AI",
        "version": "1.0.0",
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy",
        "service": "StudyPilot AI Backend",
        "ai_provider": "Ollama",
        "model": OLLAMA_MODEL,
        "ollama_key_configured": bool(OLLAMA_API_KEY),
    }


# =========================================================
# CLEAN TEXT
# =========================================================

def clean_text(text: str) -> str:
    """Normalize whitespace without removing syllabus content."""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]*\n(?:[ \t]*\n)+", "\n\n", text)
    return text.strip()


# =========================================================
# BASIC TOPIC EXTRACTION - FALLBACK
# =========================================================

def extract_basic_topics(text: str) -> list[str]:
    """Extract heading-like syllabus topics if AI is unavailable."""
    topics = []

    ignored_words = [
        "department",
        "institute",
        "college",
        "academic year",
        "course code",
        "prepared by",
        "submitted by",
    ]

    for line in text.splitlines():
        line = line.strip()

        if not line or len(line) < 3 or len(line) > 120:
            continue

        if any(word in line.lower() for word in ignored_words):
            continue

        cleaned = re.sub(
            r"^(?:(?:unit|module|chapter)\s*)?"
            r"(?:[-:.)]?\s*\d+[-:.)]?\s*)",
            "",
            line,
            flags=re.IGNORECASE,
        ).strip()

        if len(cleaned) < 3:
            continue

        if (
            line.isupper()
            or re.match(
                r"^(unit|module|chapter)\b",
                line,
                flags=re.IGNORECASE,
            )
        ):
            if cleaned not in topics:
                topics.append(cleaned)

    return topics[:30]


# =========================================================
# OLLAMA REQUEST
# =========================================================

def ask_ollama(prompt: str) -> dict:
    """Send a request to Ollama Cloud."""
    if not OLLAMA_API_KEY:
        raise RuntimeError(
            "OLLAMA_API_KEY is missing from backend/.env"
        )

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {
                "role": "system",
                "content": """
You are StudyPilot AI, an academic learning assistant.

Always return valid JSON in this format:
{
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}

Extract actual academic topics from the supplied content.
Keep topics concise, preserve syllabus terminology,
exclude college names and faculty names, and return
at most 30 topics.
""",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "stream": False,
        "format": "json",
    }

    headers = {
        "Authorization": f"Bearer {OLLAMA_API_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        OLLAMA_URL,
        headers=headers,
        json=payload,
        timeout=120,
    )
    response.raise_for_status()

    return response.json()


# =========================================================
# AI TOPIC EXTRACTION
# =========================================================

def extract_ai_topics(text: str) -> list[str]:
    """Use Ollama to identify syllabus topics."""
    prompt = f"""
Analyze the following college syllabus.

Extract important subjects, units, chapters, and subtopics
that a student should study.

Return JSON only, with a "topics" array containing
at most 30 concise topic names.

SYLLABUS:
{text[:30000]}
"""

    response = ask_ollama(prompt)
    content = response.get("message", {}).get("content", "")

    if not content:
        raise RuntimeError("Ollama returned an empty response.")

    try:
        result = json.loads(content)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Ollama returned invalid JSON for syllabus topics."
        ) from exc

    topics = result.get("topics", [])

    if not isinstance(topics, list):
        return []

    cleaned_topics = []

    for topic in topics:
        if not isinstance(topic, str):
            continue

        topic = topic.strip()

        if topic and topic not in cleaned_topics:
            cleaned_topics.append(topic)

    return cleaned_topics[:30]


# =========================================================
# UPLOAD SYLLABUS
# =========================================================

@app.post("/api/syllabus/upload")
async def upload_syllabus(file: UploadFile = File(...)):
    """Extract syllabus text using PDF extraction plus OCR."""

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="PDF must be smaller than 10 MB.",
        )

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF is empty.",
        )

    # IMPORTANT: this calls the OCR-enabled function
    # imported from pdf_extractor.py.
    try:
        extracted_text = extract_pdf_text(file_bytes)
        extracted_text = clean_text(extracted_text)

    except Exception as error:
        print("PDF extraction error:", repr(error))
        raise HTTPException(
            status_code=500,
            detail=f"Could not extract PDF text: {error}",
        ) from error

    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail=(
                "No readable text was found, even after OCR. "
                "Check PDF quality and OCR language settings."
            ),
        )

    print(
        f"PDF extracted successfully: {file.filename}; "
        f"{len(extracted_text)} characters"
    )

    # Try AI topic extraction, then use the fallback.
    ai_used = False

    try:
        topics = extract_ai_topics(extracted_text)
        ai_used = True

    except Exception as error:
        print("AI topic extraction failed:", repr(error))
        topics = extract_basic_topics(extracted_text)

    return {
        "success": True,
        "message": "Syllabus analyzed successfully.",
        "filename": file.filename,
        "text": extracted_text,
        "text_length": len(extracted_text),
        "topics": topics,
        "topic_count": len(topics),
        "ai_used": ai_used,
        "model": OLLAMA_MODEL if ai_used else None,
    }


# =========================================================
# AI TUTOR
# =========================================================

def ask_ai_tutor(question: str, topic: str) -> str:
    """Generate a study-focused answer using Ollama Cloud."""

    if not OLLAMA_API_KEY:
        raise RuntimeError(
            "OLLAMA_API_KEY is missing from backend/.env"
        )

    system_prompt = f"""
You are StudyPilot AI Tutor helping a college student.

Current study topic: {topic}

Explain concepts in simple language.
Use examples and step-by-step explanations.
For numerical problems, show the calculation steps.
For programming questions, provide correct code.
For exam questions, provide exam-oriented answers.
Use bullet points and tables where useful.
Stay focused on the student's question.
"""

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": question,
            },
        ],
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {OLLAMA_API_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        OLLAMA_URL,
        headers=headers,
        json=payload,
        timeout=120,
    )
    response.raise_for_status()

    answer = response.json().get("message", {}).get("content", "")

    if not answer:
        raise RuntimeError("Ollama returned an empty answer.")

    return answer


# =========================================================
# CHAT API
# =========================================================

@app.post("/api/chat")
def chat(request: ChatRequest):
    topic = request.topic or "General Studies"
    question = request.question.strip()

    if not question:
        return {
            "success": False,
            "answer": "Please enter a question.",
        }

    try:
        answer = ask_ai_tutor(question, topic)

        return {
            "success": True,
            "answer": answer,
            "topic": topic,
            "provider": "Ollama",
            "model": OLLAMA_MODEL,
        }

    except requests.exceptions.HTTPError as error:
        try:
            details = error.response.json() if error.response else str(error)
        except Exception:
            details = str(error)

        print("Ollama HTTP error:", details)

        return {
            "success": False,
            "answer": "StudyPilot AI could not process your question.",
            "error": details,
        }

    except requests.exceptions.RequestException as error:
        print("Ollama connection error:", repr(error))

        return {
            "success": False,
            "answer": "Could not connect to Ollama.",
            "error": str(error),
        }

    except Exception as error:
        print("AI Tutor error:", repr(error))

        return {
            "success": False,
            "answer": "StudyPilot AI encountered an error.",
            "error": str(error),
        }


# =========================================================
# TEST AI
# =========================================================

@app.get("/api/test-ai")
def test_ai():
    if not OLLAMA_API_KEY:
        return {
            "success": False,
            "message": "OLLAMA_API_KEY is not configured.",
        }

    try:
        answer = ask_ai_tutor(
            "Explain DBMS in one simple sentence.",
            "Database Fundamentals",
        )

        return {
            "success": True,
            "message": "Ollama connection working.",
            "answer": answer,
            "model": OLLAMA_MODEL,
        }

    except Exception as error:
        print("Ollama test failed:", repr(error))

        return {
            "success": False,
            "message": "Ollama test failed.",
            "error": str(error),
        }


# =========================================================
# STARTUP MESSAGE
# =========================================================

print(
    """
====================================================
        StudyPilot AI Backend
====================================================

🚀 FastAPI server ready

📄 PDF Upload:
POST /api/syllabus/upload

🤖 AI Tutor:
POST /api/chat

❤️ Health:
GET /health

🧪 AI Test:
GET /api/test-ai

====================================================
"""
)
