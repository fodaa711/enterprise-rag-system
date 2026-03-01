# app/rag/retrieve.py


from qdrant_client.models import VectorParams, Distance
from app.config import embedding_model, reranker_model
import os
from qdrant_client import QdrantClient

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)
COLLECTION_NAME = "documents"
VECTOR_SIZE     = 768


def ensure_collection_exists():
    try:
        client.get_collection(COLLECTION_NAME)
    except Exception:
        print("Creating Qdrant collection...")
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        )


def retrieve(query, top_k=10, final_k=5):

    ensure_collection_exists()

    # Step 1: Vector Search
    query_vector = embedding_model.encode(query).tolist()

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=top_k,
        with_payload=True
    )

    if not results.points:
        return []

    chunks = [point.payload.get("text", "") for point in results.points]

    # Step 2: Cross-Encoder Re-Ranking
    pairs  = [[query, chunk] for chunk in chunks]
    scores = reranker_model.predict(pairs)

    ranked = sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)

    reranked_chunks = [chunk for chunk, score in ranked[:final_k]]

    return reranked_chunks