# app/schemas.py

from pydantic import BaseModel


class ChatRequest(BaseModel):
    question:   str
    session_id: str


class IngestResponse(BaseModel):
    status:         str
    chunks_indexed: int