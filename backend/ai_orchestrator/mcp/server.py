"""
MCP Server
Orquesta la ejecución de herramientas
"""
from typing import Dict, Any, List, Optional
import json

from .tools import get_all_tools, execute_tool
from .tools.consulta_tools import buscar_platos, ver_reserva
from .tools.accion_tools import crear_reserva, registrar_cliente
from .tools.reporte_tools import resumen_ventas


class MCPServer:
    """
    Servidor MCP que gestiona las herramientas
    
    El LLM puede solicitar ejecutar herramientas, y este servidor
    se encarga de ejecutarlas y devolver los resultados.
    """
    
    def __init__(self, core_api_url: str = "http://localhost:8000"):
        self.core_api_url = core_api_url
        self._tools = get_all_tools()
    
    def get_tools_for_llm(self) -> List[Dict[str, Any]]:
        """
        Obtiene las definiciones de herramientas en formato OpenAI/Groq
        
        Returns:
            Lista de definiciones de tools para el LLM
        """
        return self._tools
    
    async def execute(
        self,
        tool_name: str,
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Ejecuta una herramienta
        
        Args:
            tool_name: Nombre de la herramienta
            arguments: Argumentos para la herramienta
            
        Returns:
            Resultado de la ejecución
        """
        return await execute_tool(tool_name, arguments, self.core_api_url)
    
    async def execute_multiple(
        self,
        tool_calls: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Ejecuta múltiples herramientas
        
        Args:
            tool_calls: Lista de {tool_name, arguments, call_id}
            
        Returns:
            Lista de resultados
        """
        results = []
        for call in tool_calls:
            result = await self.execute(
                call["tool_name"],
                call.get("arguments", {})
            )
            results.append({
                "call_id": call.get("call_id"),
                "tool_name": call["tool_name"],
                "result": result
            })
        return results
    
    def format_tool_results_for_llm(
        self,
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Formatea resultados de tools para enviar de vuelta al LLM
        
        Args:
            results: Resultados de execute_multiple
            
        Returns:
            Mensajes formateados para el LLM
        """
        messages = []
        for result in results:
            messages.append({
                "role": "tool",
                "tool_call_id": result["call_id"],
                "content": json.dumps(result["result"], ensure_ascii=False)
            })
        return messages
