"""
MCP Tools - Herramientas del chatbot
5 herramientas mínimas:
- 2 de consulta: buscar_platos, ver_reserva
- 2 de acción: crear_reserva, registrar_cliente
- 1 de reporte: resumen_ventas
"""
from typing import Dict, Any, List

from .consulta_tools import buscar_platos, ver_reserva, CONSULTA_TOOLS
from .accion_tools import crear_reserva, registrar_cliente, ACCION_TOOLS
from .reporte_tools import resumen_ventas, REPORTE_TOOLS


def get_all_tools() -> List[Dict[str, Any]]:
    """
    Obtiene todas las definiciones de herramientas
    
    Returns:
        Lista de tools en formato OpenAI/Groq
    """
    return CONSULTA_TOOLS + ACCION_TOOLS + REPORTE_TOOLS


async def execute_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    core_api_url: str
) -> Dict[str, Any]:
    """
    Ejecuta una herramienta por nombre
    
    Args:
        tool_name: Nombre de la herramienta
        arguments: Argumentos
        core_api_url: URL del Core API
        
    Returns:
        Resultado de la herramienta
    """
    
    # Mapeo de herramientas
    tools = {
        "buscar_platos": buscar_platos,
        "ver_reserva": ver_reserva,
        "crear_reserva": crear_reserva,
        "registrar_cliente": registrar_cliente,
        "resumen_ventas": resumen_ventas
    }
    
    if tool_name not in tools:
        return {
            "success": False,
            "error": f"Herramienta '{tool_name}' no encontrada"
        }
    
    try:
        result = await tools[tool_name](arguments, core_api_url)
        return result
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
