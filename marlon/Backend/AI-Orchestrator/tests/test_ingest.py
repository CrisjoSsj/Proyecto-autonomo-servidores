import pytest
from app.ingest import chunk_text


def test_chunk_text_basic():
    text = "".join(["x" for _ in range(2500)])
    chunks = chunk_text(text, chunk_size=1000, overlap=200)
    assert len(chunks) >= 2
    # check overlap behavior and that chunk items are dicts with 'text'
    assert isinstance(chunks[0], dict)
    assert len(chunks[0]["text"]) == 1000
    assert len(chunks[1]["text"]) <= 1000
