AI Orchestrator (FastAPI)

This service orchestrates LLM calls, embeddings, ingestion pipelines and exposes endpoints for `/ingest` and `/chat`.

Quick start (development):

1. Create a virtualenv and install requirements:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Run the app:

```bash
uvicorn app.main:app --reload --port 8080
```

Notes:
- This is a scaffold. Implement the LLM adapters and ingestion pipeline next.
- Use environment variables to set OpenAI key, HUGGINGFACE_API_KEY, QDRANT url, and JWKS URL.

Notes on OCR dependencies:
- The OCR fallback uses Tesseract via `pytesseract`. On local machines or CI you must install the Tesseract binary:
  - Windows: install from https://github.com/tesseract-ocr/tesseract
  - Linux/macOS: install via package manager (apt, brew)
- If Tesseract is not installed, the image OCR tests are skipped by default and the adapter will raise a RuntimeError when called.

Environment variables (examples):

- OPENAI_API_KEY=...
- HUGGINGFACE_API_KEY=...
- HF_DEFAULT_MODEL=gpt2
- HF_EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
- QDRANT_URL=http://localhost:6333
- JWKS_URL=http://auth-service/.well-known/jwks.json

Chat streaming:
- POST /api/chat/stream {"query": "text"} returns a streaming response (text/event-stream). Use fetch and read the response body as a stream to receive incremental 'data:' events.

