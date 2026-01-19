import pytest
import asyncio
from pathlib import Path
from unittest.mock import patch, AsyncMock

from app.ingest import chunk_text, ingest_document


def test_chunk_text_overlap():
    text = "a" * 2500
    chunks = chunk_text(text, chunk_size=1000, overlap=200)
    assert len(chunks) >= 2
    assert isinstance(chunks[0], dict)
    assert len(chunks[0]["text"]) == 1000


@pytest.mark.asyncio
async def test_ingest_document_calls_embed_and_upsert(tmp_path, monkeypatch):
    p = tmp_path / "sample.txt"
    p.write_text("hello world " * 200)

    async def fake_embed(chunks):
        return [[0.1] * 3 for _ in chunks]

    def fake_upsert(collection_name, ids, vectors, payloads):
        assert collection_name == "documents"
        assert len(ids) == len(vectors) == len(payloads)
        return None

    # Patch the embed method used by ingest and the upsert function referenced by ingest
    monkeypatch.setattr("app.ingest.HFAdapter.embed", AsyncMock(side_effect=fake_embed))
    monkeypatch.setattr("app.ingest.upsert_embeddings", fake_upsert)

    res = await ingest_document(p, collection_name="documents")
    assert res["status"] == "ok"
    assert res["chunks"] > 0


@pytest.mark.asyncio
async def test_ingest_pdf_page_provenance(tmp_path, monkeypatch):
    p = tmp_path / "mul.pdf"
    # create a 2-page PDF
    from reportlab.pdfgen import canvas

    c = canvas.Canvas(str(p))
    c.drawString(100, 750, "Page One Text")
    c.showPage()
    c.drawString(100, 750, "Page Two Text")
    c.save()

    async def fake_embed(chunks):
        return [[0.1] * 3 for _ in chunks]

    def fake_upsert(collection_name, ids, vectors, payloads):
        assert collection_name == "documents"
        assert len(ids) == len(vectors) == len(payloads)
        pages = set(p.get("page") for p in payloads)
        assert pages.issubset({1, 2})
        return None

    monkeypatch.setattr("app.ingest.HFAdapter.embed", AsyncMock(side_effect=fake_embed))
    monkeypatch.setattr("app.ingest.upsert_embeddings", fake_upsert)

    res = await ingest_document(p, collection_name="documents")
    assert res["status"] == "ok"
    assert res["chunks"] > 0
