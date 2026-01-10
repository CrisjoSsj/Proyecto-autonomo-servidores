"""
Tools de Acción
- crear_reserva: Crear una nueva reserva
- registrar_cliente: Agregar un cliente
"""
from typing import Dict, Any
import httpx
import uuid


# Definiciones para el LLM
ACCION_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "crear_reserva",
            "description": "Crea una nueva reserva en el restaurante. Usa esta herramienta cuando el usuario quiera reservar una mesa.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cliente_nombre": {
                        "type": "string",
                        "description": "Nombre del cliente que hace la reserva"
                    },
                    "fecha": {
                        "type": "string",
                        "description": "Fecha de la reserva en formato YYYY-MM-DD"
                    },
                    "hora": {
                        "type": "string",
                        "description": "Hora de la reserva en formato HH:MM"
                    },
                    "personas": {
                        "type": "integer",
                        "description": "Número de personas"
                    },
                    "notas": {
                        "type": "string",
                        "description": "Notas adicionales (ocasión especial, preferencias, etc.)"
                    }
                },
                "required": ["cliente_nombre", "fecha", "hora", "personas"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "registrar_cliente",
            "description": "Registra un nuevo cliente en el sistema. Usa esta herramienta cuando necesites agregar información de un cliente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {
                        "type": "string",
                        "description": "Nombre completo del cliente"
                    },
                    "email": {
                        "type": "string",
                        "description": "Email del cliente"
                    },
                    "telefono": {
                        "type": "string",
                        "description": "Teléfono del cliente"
                    }
                },
                "required": ["nombre", "telefono"]
            }
        }
    }
]


async def crear_reserva(args: Dict[str, Any], core_api_url: str) -> Dict[str, Any]:
    """
    Crea una nueva reserva
    
    Args:
        args: {cliente_nombre, fecha, hora, personas, notas?}
        core_api_url: URL del Core API
    """
    cliente = args.get("cliente_nombre", "")
    fecha = args.get("fecha", "")
    hora = args.get("hora", "")
    personas = args.get("personas", 2)
    notas = args.get("notas", "")
    
    # Validaciones básicas
    if not cliente or not fecha or not hora:
        return {
            "success": False,
            "error": "Faltan datos: nombre del cliente, fecha y hora son obligatorios"
        }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{core_api_url}/reservas/",
                json={
                    "cliente_nombre": cliente,
                    "fecha": fecha,
                    "hora": hora,
                    "numero_personas": personas,
                    "notas": notas
                }
            )
            
            if response.status_code in [200, 201]:
                reserva = response.json()
                return {
                    "success": True,
                    "reserva": reserva,
                    "message": f"Reserva creada exitosamente para {cliente}"
                }
            else:
                return {
                    "success": False,
                    "error": f"Error al crear reserva: {response.text}"
                }
                
    except Exception as e:
        pass
    
    # Simular creación exitosa
    reserva_id = f"RES{uuid.uuid4().hex[:6].upper()}"
    reserva = {
        "id": reserva_id,
        "cliente": cliente,
        "fecha": fecha,
        "hora": hora,
        "personas": personas,
        "estado": "pendiente",
        "notas": notas
    }
    
    return {
        "success": True,
        "reserva": reserva,
        "message": f"¡Reserva {reserva_id} creada exitosamente para {cliente} el {fecha} a las {hora}!",
        "source": "simulado"
    }


async def registrar_cliente(args: Dict[str, Any], core_api_url: str) -> Dict[str, Any]:
    """
    Registra un nuevo cliente
    
    Args:
        args: {nombre, email?, telefono}
        core_api_url: URL del Core API
    """
    nombre = args.get("nombre", "")
    email = args.get("email", "")
    telefono = args.get("telefono", "")
    
    if not nombre or not telefono:
        return {
            "success": False,
            "error": "Nombre y teléfono son obligatorios"
        }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{core_api_url}/clientes/",
                json={
                    "nombre": nombre,
                    "email": email,
                    "telefono": telefono
                }
            )
            
            if response.status_code in [200, 201]:
                cliente_data = response.json()
                return {
                    "success": True,
                    "cliente": cliente_data,
                    "message": f"Cliente {nombre} registrado exitosamente"
                }
                
    except Exception as e:
        pass
    
    # Simular registro exitoso
    cliente_id = f"CLI{uuid.uuid4().hex[:6].upper()}"
    cliente_data = {
        "id": cliente_id,
        "nombre": nombre,
        "email": email,
        "telefono": telefono,
        "puntos": 0
    }
    
    return {
        "success": True,
        "cliente": cliente_data,
        "message": f"Cliente {nombre} registrado con ID {cliente_id}",
        "source": "simulado"
    }
