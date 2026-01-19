import pytest
import asyncio

from app.adapters.openai_adapter import OpenAIAdapter


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
async def test_openai_adapter_returns_text(monkeypatch):
    expected = {"choices": [{"message": {"content": "Hello from LLM"}}]}
    dummy_resp = DummyResponse(expected)

    def dummy_client(*args, **kwargs):
        return DummyClient(dummy_resp)

    monkeypatch.setattr("httpx.AsyncClient", dummy_client)

    adapter = OpenAIAdapter(api_key="test-key", model="test-model")
    res = await adapter.generate("Say hi")

    assert "Hello from LLM" in res
