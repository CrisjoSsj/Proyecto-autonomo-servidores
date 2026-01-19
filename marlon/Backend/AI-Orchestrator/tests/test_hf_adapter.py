import pytest
import asyncio

from app.adapters.hf_adapter import HFAdapter


class DummyResponse:
    def __init__(self, json_data):
        self._json = json_data

    def json(self):
        return self._json

    def raise_for_status(self):
        return None


class DummyClient:
    def __init__(self, resp):
        self._resp = resp

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json=None, headers=None):
        return self._resp


@pytest.mark.asyncio
async def test_hf_generate_remote(monkeypatch):
    expected = [{"generated_text": "HF says hello"}]
    dummy_resp = DummyResponse(expected)

    def dummy_client(*args, **kwargs):
        return DummyClient(dummy_resp)

    monkeypatch.setattr("httpx.AsyncClient", dummy_client)

    adapter = HFAdapter(api_key="test-key", default_model="test-model")
    res = await adapter.generate("Hello")

    assert "HF says hello" in res


@pytest.mark.asyncio
async def test_hf_embed_remote(monkeypatch):
    expected = [[0.1, 0.2, 0.3]]
    dummy_resp = DummyResponse(expected)

    def dummy_client(*args, **kwargs):
        return DummyClient(dummy_resp)

    monkeypatch.setattr("httpx.AsyncClient", dummy_client)

    adapter = HFAdapter(api_key="test-key", embedding_model="test-embed")
    res = await adapter.embed(["hi"])

    assert isinstance(res, list)
    assert len(res) == 1
    assert len(res[0]) >= 1
