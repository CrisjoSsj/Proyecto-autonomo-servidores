"""
Interface base para LLM Providers
Patrón Strategy - Define el contrato para todos los adapters de IA
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List, Dict, Any


@dataclass
class ToolCall:
    """Llamada a herramienta solicitada por el LLM"""
    tool_name: str
    arguments: Dict[str, Any]
    call_id: str


@dataclass
class LLMResponse:
    """Respuesta normalizada del LLM"""
    content: str
    tool_calls: Optional[List[ToolCall]] = None
    finish_reason: str = "stop"
    usage: Optional[Dict[str, int]] = None


class LLMProvider(ABC):
    """
    Interface abstracta para proveedores de LLM
    
    Implementa el patrón Strategy para poder intercambiar
    proveedores (Groq, OpenAI, etc.) sin cambiar la lógica.
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Nombre del proveedor"""
        pass
    
    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """
        Genera una respuesta del modelo
        
        Args:
            messages: Lista de mensajes [{role, content}]
            tools: Definiciones de herramientas MCP
            temperature: Creatividad (0-1)
            
        Returns:
            LLMResponse con contenido y posibles tool calls
        """
        pass
    
    @abstractmethod
    async def analyze_image(
        self,
        image_base64: str,
        prompt: str
    ) -> str:
        """
        Analiza una imagen con visión
        
        Args:
            image_base64: Imagen en base64
            prompt: Instrucción para el análisis
            
        Returns:
            Descripción/análisis de la imagen
        """
        pass
    
    async def get_embedding(self, text: str) -> List[float]:
        """
        Obtiene embedding de un texto (opcional)
        """
        raise NotImplementedError("Embeddings no soportados por este provider")
