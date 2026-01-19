from typing import List, Any
import httpx
import asyncio

from app.config import settings


class HFAdapter:
    def __init__(self, api_key: str | None = None, default_model: str | None = None, embedding_model: str | None = None):
        self.api_key = api_key or settings.HUGGINGFACE_API_KEY
        self.default_model = default_model or settings.HF_DEFAULT_MODEL
        self.embedding_model = embedding_model or settings.HF_EMBEDDING_MODEL

    async def generate(self, prompt: str, model: str | None = None, stream: bool = False) -> str:
        """Generate text using Hugging Face Inference Providers API (router.huggingface.co).

        Uses the OpenAI-compatible chat completions endpoint.
        If HF API key is not configured and HF_USE_LOCAL is True, try local fallback (transformers).
        """
        model = model or self.default_model

        # prefer remote HF Inference Providers API
        if self.api_key:
            # Use the new router API (OpenAI-compatible)
            url = "https://router.huggingface.co/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Format as chat completions (OpenAI-compatible)
            payload = {
                "model": model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 512,
                "temperature": 0.7,
                "stream": False
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                
                # Handle common errors
                if resp.status_code == 503:
                    # Model loading, retry once
                    await asyncio.sleep(5)
                    resp = await client.post(url, json=payload, headers=headers)
                
                if resp.status_code == 404:
                    return f"[Modelo {model} no encontrado. Verifique HF_DEFAULT_MODEL]"
                
                if resp.status_code in (401, 403):
                    return "[Error de autenticación con HuggingFace. Verifique su HUGGINGFACE_API_KEY]"
                
                if resp.status_code == 422:
                    # Try fallback to old API format for non-chat models
                    return await self._generate_legacy(prompt, model)
                
                resp.raise_for_status()
                data = resp.json()

            # OpenAI-compatible response format
            if "choices" in data and len(data["choices"]) > 0:
                choice = data["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    return choice["message"]["content"]
                if "text" in choice:
                    return choice["text"]
            
            # Fallback: stringify response
            return str(data)

        # Local fallback (best-effort)
        if settings.HF_USE_LOCAL and settings.HF_LOCAL_MODEL:
            try:
                from transformers import pipeline

                pipe = pipeline("text-generation", model=settings.HF_LOCAL_MODEL, device_map="auto")
                out = pipe(prompt, max_new_tokens=256)
                if isinstance(out, list) and len(out) > 0 and "generated_text" in out[0]:
                    return out[0]["generated_text"]
                return str(out)
            except Exception as e:
                raise RuntimeError("HF local generation failed: " + str(e))

        raise RuntimeError("No HF API key configured and no local model available for generation")

    async def _generate_legacy(self, prompt: str, model: str) -> str:
        """Fallback to legacy Inference API for non-chat models."""
        url = f"https://api-inference.huggingface.co/models/{model}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "inputs": prompt,
            "parameters": {"max_new_tokens": 256},
            "options": {"wait_for_model": True}
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 410:
                return f"[Modelo {model} no disponible en HuggingFace]"
            resp.raise_for_status()
            data = resp.json()
        
        if isinstance(data, list) and len(data) > 0:
            r = data[0]
            if isinstance(r, dict) and "generated_text" in r:
                return r["generated_text"]
        if isinstance(data, dict) and "generated_text" in data:
            return data["generated_text"]
        return str(data)

    async def embed(self, texts: List[str], model: str | None = None) -> List[List[float]]:
        """Create embeddings using HF Inference API feature-extraction or local sentence-transformers.

        Batches requests to avoid overly large payloads.
        """
        model = model or self.embedding_model
        if self.api_key:
            url = f"https://api-inference.huggingface.co/models/{model}"
            headers = {"Authorization": f"Bearer {self.api_key}"}

            async def embed_one(text: str):
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(url, json={"inputs": text, "options": {"wait_for_model": True}}, headers=headers)
                    resp.raise_for_status()
                    data = resp.json()
                    # HF returns nested lists for feature-extraction
                    if isinstance(data, list):
                        # if data is list of token vectors, aggregate by mean
                        import numpy as np

                        arr = np.array(data)
                        if len(arr.shape) == 2:
                            vec = arr.mean(axis=0).tolist()
                            return vec
                        # sometimes returns nested shape, attempt flatten
                        return np.array(data).reshape(-1).tolist()
                    # other types
                    return data

            tasks = [embed_one(t) for t in texts]
            res = await asyncio.gather(*tasks)
            return res

        # local fallback: sentence-transformers
        if settings.HF_USE_LOCAL and settings.HF_LOCAL_MODEL:
            try:
                from sentence_transformers import SentenceTransformer

                model_local = SentenceTransformer(settings.HF_LOCAL_MODEL)
                embeddings = model_local.encode(texts, show_progress_bar=False)
                # embeddings may be numpy array
                return [list(map(float, e)) for e in embeddings]
            except Exception as e:
                raise RuntimeError("HF local embedding failed: " + str(e))

        raise RuntimeError("No HF API key configured and no local embedding model available")
