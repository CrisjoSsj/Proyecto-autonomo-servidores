from typing import Protocol, Dict, Any, AsyncIterator

from app.adapters.openai_adapter import OpenAIAdapter as OpenAIAdapterImpl
from app.adapters.hf_adapter import HFAdapter as HFAdapterImpl
from app.config import settings


class LLMAdapter(Protocol):
    async def generate(self, prompt: str, stream: bool = False) -> Any:  # could be str or AsyncIterator
        ...


class OpenAIAdapter:
    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini"):
        # wrapper that instantiates the concrete adapter implementation
        self._impl = OpenAIAdapterImpl(api_key=api_key, model=model)

    async def generate(self, prompt: str, stream: bool = False):
        return await self._impl.generate(prompt=prompt, stream=stream)


class HuggingFaceAdapter:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self._impl = HFAdapterImpl(api_key=api_key, default_model=model)

    async def generate(self, prompt: str, stream: bool = False):
        return await self._impl.generate(prompt=prompt, stream=stream)


def get_default_adapter():
    # choose adapter based on configured env vars: prefer HF if key present, else OpenAI
    if settings.HUGGINGFACE_API_KEY:
        return HuggingFaceAdapter(api_key=settings.HUGGINGFACE_API_KEY, model=settings.HF_DEFAULT_MODEL)
    return OpenAIAdapter(api_key=settings.OPENAI_API_KEY)


