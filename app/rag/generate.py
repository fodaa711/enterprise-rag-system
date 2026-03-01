# app/rag/generate.py

from app.config import groq_client, GROQ_MODEL


def generate_answer(system_prompt: str, final_prompt: str) -> str:
    """Standard (non-streaming) generation via Groq."""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system",  "content": system_prompt},
            {"role": "user",    "content": final_prompt},
        ],
        temperature=0.2,
        max_tokens=1024,
    )

    return response.choices[0].message.content.strip()


def generate_answer_stream(system_prompt: str, final_prompt: str):
    """
    Streaming generation via Groq.
    Yields text chunks as they arrive — use with StreamingResponse.
    """

    stream = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": final_prompt},
        ],
        temperature=0.2,
        max_tokens=1024,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta