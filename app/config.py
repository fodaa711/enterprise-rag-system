import os
from dotenv import load_dotenv
from groq import Groq
from sentence_transformers import SentenceTransformer, CrossEncoder
# load .env automatically
load_dotenv()

# ── Groq LLM client (free tier — https://console.groq.com) ──
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not set in environment variables.")

groq_client = Groq(api_key=GROQ_API_KEY)
GROQ_MODEL  = "llama-3.3-70b-versatile"

# ── Embedding model (bi-encoder)
embedding_model = SentenceTransformer("BAAI/bge-base-en-v1.5")
VECTOR_SIZE = embedding_model.get_sentence_embedding_dimension()  

# ── Cross-encoder reranker
reranker_model  = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")