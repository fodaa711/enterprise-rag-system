# app/rag/ingest.py

from pypdf import PdfReader
from uuid import uuid4
from qdrant_client.models import PointStruct          # ← fix: was raw dict before
from app.config import embedding_model
from app.rag.retrieve import client, COLLECTION_NAME, ensure_collection_exists


def chunk_text(text, chunk_size=1000, overlap=200):

    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    chunks = []
    current_chunk = ""

    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) < chunk_size:
            current_chunk += " " + paragraph
        else:
            chunks.append(current_chunk.strip())
            current_chunk = current_chunk[-overlap:] + " " + paragraph

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


def ingest_pdf(file_path):

    ensure_collection_exists()

    reader    = PdfReader(file_path)
    full_text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            full_text += "\n" + page_text

    if not full_text.strip():
        raise ValueError("No extractable text found in PDF.")

    chunks     = chunk_text(full_text)
    embeddings = embedding_model.encode(chunks, show_progress_bar=False)

    points = [
        PointStruct(                                  # ← fix: correct Qdrant type
            id=str(uuid4()),
            vector=vector.tolist(),
            payload={"text": chunk}
        )
        for chunk, vector in zip(chunks, embeddings)
    ]

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )

    return len(points)