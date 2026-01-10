"""
Adapters de LLM Providers
Patrón Strategy para intercambiar proveedores de IA
"""
from .base import LLMProvider, LLMResponse
from .groq_adapter import GroqAdapter
from .mock_adapter import MockLLMAdapter

__all__ = ["LLMProvider", "LLMResponse", "GroqAdapter", "MockLLMAdapter"]
