"""
Tools de Reporte
- resumen_ventas: Estadísticas de ventas
"""
from typing import Dict, Any
from datetime import datetime, timedelta
import httpx
import random


# Definiciones para el LLM
REPORTE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "resumen_ventas",
            "description": "Genera un resumen de ventas y estadísticas del restaurante. Usa esta herramienta cuando el usuario pregunte por ventas, ingresos, estadísticas o reportes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "periodo": {
                        "type": "string",
                        "description": "Período del reporte",
                        "enum": ["dia", "semana", "mes"]
                    }
                },
                "required": ["periodo"]
            }
        }
    }
]


async def resumen_ventas(args: Dict[str, Any], core_api_url: str) -> Dict[str, Any]:
    """
    Genera resumen de ventas
    
    Args:
        args: {periodo: "dia" | "semana" | "mes"}
        core_api_url: URL del Core API
    """
    periodo = args.get("periodo", "dia")
    
    # Calcular rango de fechas
    hoy = datetime.now()
    if periodo == "dia":
        fecha_inicio = hoy.replace(hour=0, minute=0, second=0)
        titulo = f"Resumen de ventas de hoy ({hoy.strftime('%d/%m/%Y')})"
    elif periodo == "semana":
        fecha_inicio = hoy - timedelta(days=7)
        titulo = f"Resumen de ventas de la última semana"
    else:  # mes
        fecha_inicio = hoy - timedelta(days=30)
        titulo = f"Resumen de ventas del último mes"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{core_api_url}/dashboard/stats",
                params={"desde": fecha_inicio.isoformat()}
            )
            
            if response.status_code == 200:
                stats = response.json()
                return {
                    "success": True,
                    "titulo": titulo,
                    "periodo": periodo,
                    "estadisticas": stats,
                    "message": f"Reporte generado para {periodo}"
                }
                
    except Exception as e:
        pass
    
    # Datos simulados
    multiplicador = {"dia": 1, "semana": 7, "mes": 30}[periodo]
    
    # Generar estadísticas simuladas realistas
    ordenes_base = random.randint(20, 40)
    ticket_promedio = random.uniform(25, 45)
    
    stats = {
        "ventas_totales": round(ordenes_base * multiplicador * ticket_promedio, 2),
        "ordenes_completadas": ordenes_base * multiplicador,
        "clientes_atendidos": int(ordenes_base * multiplicador * 0.8),
        "ticket_promedio": round(ticket_promedio, 2),
        "reservas_total": int(ordenes_base * multiplicador * 0.3),
        "ocupacion_promedio": f"{random.randint(60, 85)}%",
        "platos_mas_vendidos": [
            {"nombre": "Alitas BBQ", "cantidad": random.randint(30, 60) * multiplicador},
            {"nombre": "Hamburguesa Clásica", "cantidad": random.randint(25, 50) * multiplicador},
            {"nombre": "Parrillada Mixta", "cantidad": random.randint(15, 35) * multiplicador}
        ],
        "horario_pico": "19:00 - 21:00",
        "comparacion_anterior": f"+{random.randint(5, 15)}%"
    }
    
    return {
        "success": True,
        "titulo": titulo,
        "periodo": periodo,
        "fecha_inicio": fecha_inicio.strftime("%Y-%m-%d"),
        "fecha_fin": hoy.strftime("%Y-%m-%d"),
        "estadisticas": stats,
        "message": f"📊 {titulo}: ${stats['ventas_totales']} en {stats['ordenes_completadas']} órdenes",
        "source": "simulado"
    }
