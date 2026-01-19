from typing import List
from pathlib import Path
from app.adapters.hf_adapter import HFAdapter
from app.qdrant_client import upsert_embeddings

# Placeholder utilities for document ingestion: extraction, chunking, embedding, and vector upsert.
# Implement concrete logic using PyMuPDF/pdfplumber, pytesseract for OCR, and qdrant-client for vector DB.


def extract_text_from_pdf(path: Path) -> str:
    """Extract text from a PDF file path using PyMuPDF (fitz).

    Falls back to pdfplumber when available. Returns all extracted text concatenated.
    """
    try:
        import fitz  # PyMuPDF
    except Exception:
        fitz = None

    text = ""
    if fitz:
        doc = fitz.open(str(path))
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    # fallback to pdfplumber if fitz not available
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            for p in pdf.pages:
                text += p.extract_text() or ""
        return text
    except Exception:
        return ""  # no extractor available


def extract_text_from_image(path: Path) -> str:
    """Extract text from an image using pytesseract (Tesseract must be installed on system).

    If pytesseract is not available, raises RuntimeError.
    """
    try:
        from PIL import Image
    except Exception as e:
        raise RuntimeError("Pillow is required for image processing: " + str(e))

    try:
        import pytesseract
    except Exception:
        raise RuntimeError("pytesseract is not installed or tesseract binary not available")

    img = Image.open(path)
    text = pytesseract.image_to_string(img)
    return text


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200, page: int | None = None) -> List[dict]:
    """Chunk text into overlapping pieces with provenance metadata.

    Returns list of dicts: {"text": str, "page": int|None, "start_token_est": int, "end_token_est": int}
    Uses a rough token estimate heuristic (1 token ~ 4 chars). Replace with tokenizer for accuracy later.
    """
    def estimate_tokens(s: str) -> int:
        return max(1, len(s) // 4)

    chunks: List[dict] = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk_text = text[start:end]
        start_token_est = estimate_tokens(text[:start])
        end_token_est = start_token_est + estimate_tokens(chunk_text)
        chunks.append({
            "text": chunk_text,
            "page": page,
            "start_token_est": start_token_est,
            "end_token_est": end_token_est,
        })
        start = end - overlap if end - overlap > start else end
    return chunks


async def create_embeddings_for_chunks(chunks: List[dict]) -> List[List[float]]:
    """Create embeddings for a list of chunk dicts using HF adapter."""
    hf = HFAdapter()
    texts = [c["text"] for c in chunks]
    embeddings = await hf.embed(texts)
    return embeddings


async def upsert_to_qdrant(points: List[dict], collection_name: str = "documents"):
    """Upsert vector points to Qdrant collection using the client wrapper."""
    ids = [p["id"] for p in points]
    vectors = [p["vector"] for p in points]
    payloads = [p["payload"] for p in points]
    upsert_embeddings(collection_name=collection_name, ids=ids, vectors=vectors, payloads=payloads)


def extract_text_pages(path: Path) -> List[tuple]:
    """Return list of (page_number, text) tuples for a PDF. Page numbers are 1-based."""
    try:
        import fitz
    except Exception:
        fitz = None

    pages: List[tuple] = []
    if fitz:
        doc = fitz.open(str(path))
        for i, page in enumerate(doc):
            pages.append((i + 1, page.get_text()))
        doc.close()
        return pages

    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            for i, p in enumerate(pdf.pages):
                pages.append((i + 1, p.extract_text() or ""))
        return pages
    except Exception:
        return []


async def ingest_document(path: Path, collection_name: str = "documents"):
    # Basic ingestion flow supporting plain text and PDF files
    chunks: List[dict] = []
    if path.suffix.lower() == ".txt":
        text = path.read_text(encoding="utf-8")
        chunks = chunk_text(text)
    elif path.suffix.lower() == ".pdf":
        pages = extract_text_pages(path)
        for page_num, page_text in pages:
            page_chunks = chunk_text(page_text or "", page=page_num)
            chunks.extend(page_chunks)
    else:
        # fallback to general extractor
        text = extract_text_from_pdf(path)
        chunks = chunk_text(text)

    if not chunks:
        return {"status": "no_content", "chunks": 0}

    embeddings = await create_embeddings_for_chunks(chunks)

    points = []
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        page = chunk.get("page")
        points.append({
            "id": f"{path.name}-p{page or 0}-{i}",
            "vector": emb,
            "payload": {
                "text": chunk["text"],
                "doc": str(path),
                "page": page,
                "start_token_est": chunk.get("start_token_est"),
                "end_token_est": chunk.get("end_token_est"),
            },
        })

    await upsert_to_qdrant(points, collection_name=collection_name)
    return {"status": "ok", "chunks": len(chunks)}
