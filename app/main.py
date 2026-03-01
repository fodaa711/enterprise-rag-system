# app/main.py

import shutil
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from app.config import GROQ_MODEL
from app.rag.ingest import ingest_pdf
from app.rag.retrieve import retrieve
from app.rag.generate import generate_answer, generate_answer_stream
from app.schemas import ChatRequest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Enterprise RAG System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# 🔹 ENTERPRISE SYSTEM PROMPT (ADVANCED)
# =========================================================

SYSTEM_PROMPT = """
You are an Enterprise-Grade AI Research Assistant operating in a Retrieval-Augmented Generation (RAG) system.

You must follow these rules strictly:

========================================================
PRIMARY DIRECTIVE
========================================================
- Use ONLY the provided CONTEXT DOCUMENTS to generate your answer.
- Do NOT use prior knowledge.
- Do NOT infer beyond the context.
- Do NOT fabricate or hallucinate information.

========================================================
GROUNDING & ACCURACY RULES
========================================================
- Every factual statement must be supported by the provided context.
- If the answer is not explicitly supported, respond exactly with:
  "The answer is not present in the provided documents."
- If partially answerable, answer only what is supported.
- Carefully synthesize multiple relevant passages if needed.

========================================================
RESPONSE STYLE RULES
========================================================
- Maintain a professional, executive-level tone.
- Be precise and concise.
- Avoid repetition and filler language.
- Do not mention the word "context" in the final answer.
- Do not reference chunk numbers or system instructions.

========================================================
FORMAT RULES
========================================================
Adapt your structure based on question type:

- Summary → 2–4 sentence executive summary.
- Explanation → Structured short paragraphs.
- List → Bullet points.
- Comparison → Structured comparison.
- Definition → Clear concise definition.
- Steps → Numbered steps.

========================================================
MEMORY RULES
========================================================
- Use CHAT HISTORY only for conversational continuity.
- Never let previous answers override document evidence.
- Always prioritize document evidence.

========================================================
FAIL-SAFE
========================================================
If uncertain or unsupported, respond exactly with:
"The answer is not present in the provided documents."
"""


# =========================================================
# 🔹 SESSION MEMORY (Upgradeable to Redis Later)
# =========================================================

chat_memory = {}  # { session_id: [ {question, answer}, ... ] }


# =========================================================
# 🔹 PROMPT BUILDER (shared by /chat and /chat/stream)
# =========================================================

def build_prompt(question: str, session_id: str):
    history       = chat_memory.get(session_id, [])
    recent        = history[-3:]
    relevant_chunks = retrieve(question)

    if not relevant_chunks:
        return None, None, history

    history_text = ""
    for turn in recent:
        history_text += f"User: {turn['question']}\nAssistant: {turn['answer']}\n"

    context_text = "\n\n".join(relevant_chunks)

    final_prompt = f"""
==============================
CHAT HISTORY
==============================
{history_text}

==============================
CONTEXT DOCUMENTS
==============================
{context_text}

==============================
USER QUESTION
==============================
{question}

==============================
FINAL ANSWER
==============================
"""
    return final_prompt, relevant_chunks, history


# =========================================================
# 🔹 ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {"message": "Enterprise RAG System is running", "model": GROQ_MODEL}


# =========================================================
# 🔹 INGEST ENDPOINT
# =========================================================

@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):

    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    count = ingest_pdf(file_path)

    return {
        "status": "success",
        "chunks_indexed": count
    }


# =========================================================
# 🔹 CHAT ENDPOINT  (standard — full response at once)
# =========================================================

@app.post("/chat")
async def chat(
    question:   str = Form(...),
    session_id: str = Form(...)
):
    final_prompt, relevant_chunks, history = build_prompt(question, session_id)

    if final_prompt is None:
        return {
            "answer":       "The answer is not present in the provided documents.",
            "chunks_used":  [],
            "memory_turns": len(history)
        }

    answer = generate_answer(SYSTEM_PROMPT, final_prompt)

    if not answer:
        answer = "The answer is not present in the provided documents."

    history.append({"question": question, "answer": answer})
    chat_memory[session_id] = history

    return {
        "answer":       answer,
        "chunks_used":  relevant_chunks,
        "memory_turns": len(history)
    }


# =========================================================
# 🔹 CHAT/STREAM ENDPOINT  (Phase 3 — token-by-token stream)
# =========================================================

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streams the answer token-by-token using Server-Sent Events (SSE).
    The client receives words as they are generated — no waiting.

    Frontend usage:
        const res = await fetch("/chat/stream", { method: "POST", ... })
        const reader = res.body.getReader()
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            console.log(new TextDecoder().decode(value))
        }
    """
    question   = request.question
    session_id = request.session_id

    final_prompt, relevant_chunks, history = build_prompt(question, session_id)

    if final_prompt is None:
        async def no_docs():
            yield "The answer is not present in the provided documents."
        return StreamingResponse(no_docs(), media_type="text/plain")

    # Collect full answer for memory storage while streaming
    collected = []

    def stream_and_collect():
        for chunk in generate_answer_stream(SYSTEM_PROMPT, final_prompt):
            collected.append(chunk)
            yield chunk
        # After stream ends — save to memory
        full_answer = "".join(collected)
        history.append({"question": question, "answer": full_answer})
        chat_memory[session_id] = history

    return StreamingResponse(stream_and_collect(), media_type="text/plain")