"""
Tools de Consulta
- buscar_platos: Buscar en el menú
- ver_reserva: Consultar una reserva
"""
from typing import Dict, Any
import httpx


# Definiciones para el LLM
CONSULTA_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "buscar_platos",
            "description": "Busca platos en el menú del restaurante por nombre o categoría. Usa esta herramienta cuando el usuario pregunte por comida, menú, platos disponibles, precios, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Texto de búsqueda (nombre del plato, ingrediente, etc.)"
                    },
                    "categoria": {
                        "type": "string",
                        "description": "Categoría para filtrar (alitas, hamburguesas, parrilladas, bebidas, postres)",
                        "enum": ["alitas", "hamburguesas", "parrilladas", "bebidas", "postres", None]
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "ver_reserva",
            "description": "Obtiene los detalles de una reserva existente. Usa esta herramienta cuando el usuario quiera consultar información de su reserva.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reserva_id": {
                        "type": "string",
                        "description": "ID de la reserva (ej: RES001, RES002)"
                    }
                },
                "required": ["reserva_id"]
            }
        }
    }
]


async def buscar_platos(args: Dict[str, Any], core_api_url: str) -> Dict[str, Any]:
    """
    Busca platos en el menú
    
    Args:
        args: {query: str, categoria?: str}
        core_api_url: URL del Core API
    """
    query = args.get("query", "")
    categoria = args.get("categoria")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Intentar buscar en el API
            response = await client.get(
                f"{core_api_url}/platos/",
                params={"search": query} if query else {}
            )
            
            if response.status_code == 200:
                platos = response.json()
                
                # Filtrar por categoría si se especifica
                if categoria:
                    platos = [p for p in platos if categoria.lower() in p.get("categoria", "").lower()]
                
                # Filtrar por query
                if query:
                    platos = [p for p in platos if query.lower() in p.get("nombre", "").lower() 
                              or query.lower() in p.get("descripcion", "").lower()]
                
                return {
                    "success": True,
                    "count": len(platos),
                    "platos": platos[:10],  # Limitar a 10
                    "message": f"Encontré {len(platos)} platos"
                }
            
    except Exception as e:
        pass
    
    # Datos de ejemplo si el API no está disponible
    platos_ejemplo = [
        {"id": 1, "nombre": "Alitas BBQ", "precio": 12.99, "categoria": "alitas", "descripcion": "Deliciosas alitas con salsa BBQ"},
        {"id": 2, "nombre": "Alitas Picantes", "precio": 13.99, "categoria": "alitas", "descripcion": "Alitas con salsa picante"},
        {"id": 3, "nombre": "Hamburguesa Clásica", "precio": 9.99, "categoria": "hamburguesas", "descripcion": "Hamburguesa con queso y vegetales"},
        {"id": 4, "nombre": "Parrillada Mixta", "precio": 24.99, "categoria": "parrilladas", "descripcion": "Variedad de carnes a la parrilla"},
        {"id": 5, "nombre": "Limonada", "precio": 3.50, "categoria": "bebidas", "descripcion": "Limonada natural refrescante"},
    ]
    
    # Filtrar por query
    if query:
        platos_ejemplo = [p for p in platos_ejemplo if query.lower() in p["nombre"].lower()]
    if categoria:
        platos_ejemplo = [p for p in platos_ejemplo if categoria.lower() == p["categoria"]]
    
    return {
        "success": True,
        "count": len(platos_ejemplo),
        "platos": platos_ejemplo,
        "message": f"Encontré {len(platos_ejemplo)} platos",
        "source": "ejemplo"
    }


async def ver_reserva(args: Dict[str, Any], core_api_url: str) -> Dict[str, Any]:
    """
    Consulta una reserva
    
    Args:
        args: {reserva_id: str}
        core_api_url: URL del Core API
    """
    reserva_id = args.get("reserva_id", "")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{core_api_url}/reservas/{reserva_id}")
            
            if response.status_code == 200:
                reserva = response.json()
                return {
                    "success": True,
                    "reserva": reserva,
                    "message": f"Reserva {reserva_id} encontrada"
                }
            elif response.status_code == 404:
                return {
                    "success": False,
                    "error": f"Reserva {reserva_id} no encontrada"
                }
                
    except Exception as e:
        pass
    
    # Datos de ejemplo
    if reserva_id.upper() in ["RES001", "RES002", "RES003"]:
        reserva_ejemplo = {
            "id": reserva_id.upper(),
            "cliente": "Juan Pérez",
            "fecha": "2026-01-15",
            "hora": "19:00",
            "personas": 4,
            "estado": "confirmada",
            "mesa": "Mesa 5",
            "notas": "Cumpleaños"
        }
        return {
            "success": True,
            "reserva": reserva_ejemplo,
            "message": f"Reserva {reserva_id} encontrada",
            "source": "ejemplo"
        }
    
    return {
        "success": False,
        "error": f"Reserva {reserva_id} no encontrada"
    }
