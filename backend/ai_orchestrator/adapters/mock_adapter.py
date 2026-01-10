"""
Mock LLM Adapter - Para desarrollo y pruebas
"""
import json
import random
from typing import Optional, List, Dict, Any

from .base import LLMProvider, LLMResponse, ToolCall


class MockLLMAdapter(LLMProvider):
    """
    Adapter mock para desarrollo
    
    Simula respuestas de un LLM sin hacer llamadas reales.
    Útil para testing y desarrollo sin consumir API.
    """
    
    @property
    def provider_name(self) -> str:
        return "mock"
    
    async def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """Genera respuesta simulada"""
        
        # Obtener último mensaje del usuario
        last_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_message = msg.get("content", "").lower()
                break
        
        # Detectar si debe usar una herramienta
        if tools and any(keyword in last_message for keyword in [
            "buscar", "plato", "menu", "reserva", "cliente", "ventas", "reporte"
        ]):
            # Simular tool call
            tool_name = self._detect_tool(last_message, tools)
            if tool_name:
                return LLMResponse(
                    content="",
                    tool_calls=[
                        ToolCall(
                            tool_name=tool_name,
                            arguments=self._generate_mock_args(tool_name, last_message),
                            call_id=f"call_{random.randint(1000, 9999)}"
                        )
                    ],
                    finish_reason="tool_calls"
                )
        
        # Respuestas simuladas
        responses = [
            "¡Hola! Soy el asistente de Chuwue Grill. ¿En qué puedo ayudarte?",
            "Claro, puedo ayudarte con eso. ¿Podrías darme más detalles?",
            "Entendido. Déjame buscar esa información para ti.",
            "¡Excelente elección! Nuestro menú tiene opciones deliciosas.",
            "Para hacer una reserva, necesito saber la fecha, hora y número de personas.",
        ]
        
        # Respuesta contextual
        if "hola" in last_message or "buenos" in last_message:
            response = "¡Hola! Bienvenido a Chuwue Grill. ¿En qué puedo ayudarte hoy?"
        elif "menu" in last_message:
            response = "Tenemos deliciosas alitas, hamburguesas y parrilladas. ¿Qué te gustaría probar?"
        elif "reserva" in last_message:
            response = "Para hacer una reserva, dime la fecha, hora y número de personas."
        else:
            response = random.choice(responses)
        
        return LLMResponse(
            content=response,
            finish_reason="stop",
            usage={"prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80}
        )
    
    def _detect_tool(self, message: str, tools: List[Dict]) -> Optional[str]:
        """Detecta qué herramienta usar"""
        tool_keywords = {
            "buscar_platos": ["buscar", "plato", "menu", "comida"],
            "ver_reserva": ["ver reserva", "mi reserva", "consultar reserva"],
            "crear_reserva": ["reservar", "hacer reserva", "crear reserva"],
            "registrar_cliente": ["registrar", "nuevo cliente", "agregar cliente"],
            "resumen_ventas": ["ventas", "reporte", "estadisticas", "resumen"]
        }
        
        for tool_name, keywords in tool_keywords.items():
            if any(kw in message for kw in keywords):
                # Verificar que la herramienta existe
                for tool in tools:
                    if tool.get("function", {}).get("name") == tool_name:
                        return tool_name
        
        return None
    
    def _generate_mock_args(self, tool_name: str, message: str) -> Dict[str, Any]:
        """Genera argumentos mock para una herramienta"""
        
        if tool_name == "buscar_platos":
            return {"query": "alitas", "categoria": None}
        elif tool_name == "ver_reserva":
            return {"reserva_id": "RES001"}
        elif tool_name == "crear_reserva":
            return {
                "cliente_nombre": "Cliente Test",
                "fecha": "2026-01-15",
                "hora": "19:00",
                "personas": 4
            }
        elif tool_name == "registrar_cliente":
            return {
                "nombre": "Nuevo Cliente",
                "email": "cliente@test.com",
                "telefono": "0999999999"
            }
        elif tool_name == "resumen_ventas":
            return {"periodo": "dia"}
        
        return {}
    
    async def analyze_image(
        self,
        image_base64: str,
        prompt: str
    ) -> str:
        """Análisis simulado de imagen"""
        
        responses = [
            "Puedo ver un delicioso plato de alitas con salsa BBQ.",
            "La imagen muestra una hamburguesa gourmet con queso derretido.",
            "Veo una parrillada mixta con carnes variadas y vegetales.",
            "Es una imagen de nuestro restaurante con ambiente acogedor.",
        ]
        
        return random.choice(responses)
