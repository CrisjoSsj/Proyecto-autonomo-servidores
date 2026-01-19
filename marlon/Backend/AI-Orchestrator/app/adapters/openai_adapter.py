from typing import AsyncIterator, Any
import httpx
from app.config import settings


class OpenAIAdapter:
    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model

    async def generate(self, prompt: str, stream: bool = False) -> Any:
        """Call OpenAI Chat Completions endpoint (simple, non-streaming).

        For streaming support implement Server-sent events or websocket logic.
        """
        if not self.api_key:
            raise RuntimeError("OpenAI API key is not configured")

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512,
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        # simple extraction
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["message"]["content"]

        return ""
