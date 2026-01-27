"""
Groq Adapter - Integración con Groq LLM
Ultra-rápido con modelos Llama
"""
from typing import Optional, List, Dict, Any
from groq import Groq

from .base import LLMProvider, LLMResponse, ToolCall
from config import get_settings

settings = get_settings()


class GroqAdapter(LLMProvider):
    """
    Adapter para Groq
    
    Groq ofrece inferencia ultra-rápida para modelos como:
    - mixtral-8x7b-32768 (recomendado, chat general y visión)
    - llama-3-8b-8192 (modelos más pequeños, más rápido)
    - llama3-70b-8192 (si tienes acceso)
    """
    
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
        self.vision_model = settings.groq_vision_model
    
    @property
    def provider_name(self) -> str:
        return "groq"
    
    async def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """Genera respuesta usando Groq"""
        
        try:
            # Preparar parámetros
            params = {
                "messages": messages,
                "model": self.model,
                "temperature": temperature,
                "max_tokens": 2048
            }
            
            # Agregar tools si existen
            if tools:
                params["tools"] = tools
                params["tool_choice"] = "auto"
            
            # Llamar a Groq
            response = self.client.chat.completions.create(**params)
            
            choice = response.choices[0]
            message = choice.message
            
            # Extraer tool calls si existen
            tool_calls = None
            if hasattr(message, 'tool_calls') and message.tool_calls:
                tool_calls = [
                    ToolCall(
                        tool_name=tc.function.name,
                        arguments=eval(tc.function.arguments) if tc.function.arguments else {},
                        call_id=tc.id
                    )
                    for tc in message.tool_calls
                ]
            
            return LLMResponse(
                content=message.content or "",
                tool_calls=tool_calls,
                finish_reason=choice.finish_reason,
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                } if response.usage else None
            )
            
        except Exception as e:
            return LLMResponse(
                content=f"Error al procesar con Groq: {str(e)}",
                finish_reason="error"
            )
    
    async def analyze_image(
        self,
        image_base64: str,
        prompt: str
    ) -> str:
        """Analiza imagen usando modelo de visión de Groq"""
        
        try:
            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                model=self.vision_model,
                max_tokens=1024
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Error analizando imagen: {str(e)}"
