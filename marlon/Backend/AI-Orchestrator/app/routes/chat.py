from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.routes.tools import get_caller
from app.tools import get_default_registry, ToolError
import re
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_user_id_from_caller(caller: dict) -> str | int | None:
    """Extrae el user_id del caller (JWT payload o API key).
    
    Retorna el user_id como string (para UUIDs) o int según corresponda.
    """
    logger.info(f"get_user_id_from_caller called with caller keys: {caller.keys()}")
    if 'jwt_payload' in caller:
        # El campo 'sub' del JWT contiene el user_id (puede ser UUID string o int)
        sub = caller['jwt_payload'].get('sub')
        logger.info(f"Found jwt_payload, sub = {sub}")
        if sub:
            # Retornar como está - Django puede manejar tanto UUIDs como enteros
            return sub
    logger.warning("No jwt_payload found in caller")
    return None


async def get_client_data_for_user(user_id: str | int) -> dict | None:
    """Obtiene los datos del cliente desde Django usando el user_id."""
    logger.info(f"get_client_data_for_user called with user_id: {user_id}")
    if not user_id:
        logger.warning("user_id is None or empty")
        return None
    try:
        registry = get_default_registry()
        result = await registry.execute('obtener_cliente', {'user_id': str(user_id)})
        logger.info(f"obtener_cliente result: {result}")
        if result and not result.get('error'):
            return result
    except Exception as e:
        logger.error(f"Error getting client data: {e}")
    return None


# =====================================================
# SISTEMA DE DETECCIÓN DE INTENCIÓN BASADO EN REGLAS
# =====================================================
# Este sistema detecta la intención del usuario sin depender
# del modelo de IA para generar JSON correctamente.

def detect_intent(query: str) -> dict | None:
    """
    Detecta la intención del usuario basándose en palabras clave.
    Retorna un dict con 'tool' y 'params' o None si no detecta intención.
    """
    query_lower = query.lower().strip()
    
    # ========== CREAR RESERVA ==========
    crear_reserva_patterns = [
        r'(crear|hacer|agendar|reservar|quiero|necesito|me gustar[ií]a)\s+(una\s+)?(reserva|cita)',
        r'reserv(ar|a)\s+(el|un|una|para)',
        r'agendar\s+(el|un|una|para)',
        r'quiero\s+(el\s+)?servicio',
        r'me\s+gustar[ií]a\s+(agendar|reservar)',
    ]
    
    for pattern in crear_reserva_patterns:
        if re.search(pattern, query_lower):
            # Extraer información de la reserva
            params = extract_reservation_params(query_lower, query)
            if params.get('servicio_nombre') or params.get('servicio_id'):
                return {'tool': 'crear_reserva', 'params': params, 'intent': 'crear_reserva'}
            else:
                # Necesita más información
                return {'tool': None, 'intent': 'crear_reserva_incomplete', 'missing': ['servicio']}
    
    # ========== VER/CONSULTAR RESERVA ==========
    ver_reserva_patterns = [
        r'(ver|consultar|mostrar|cual|donde|estado)\s+(mi|la|una)?\s*reserva',
        r'reserva\s+(número|numero|#|id)\s*(\d+)',
        r'mis\s+reservas',
    ]
    
    for pattern in ver_reserva_patterns:
        match = re.search(pattern, query_lower)
        if match:
            # Buscar número de reserva
            id_match = re.search(r'(\d+)', query_lower)
            if id_match:
                return {'tool': 'ver_reserva', 'params': {'reserva_id': int(id_match.group(1))}, 'intent': 'ver_reserva'}
            return {'tool': None, 'intent': 'ver_reserva_incomplete', 'missing': ['reserva_id']}
    
    # ========== PROCESAR PAGO ==========
    pago_patterns = [
        r'(pagar|hacer\s+pago|procesar\s+pago|registrar\s+pago)',
        r'(quiero|necesito)\s+pagar',
        r'pago\s+(de|para)\s+(la\s+)?reserva',
    ]
    
    for pattern in pago_patterns:
        if re.search(pattern, query_lower):
            params = extract_payment_params(query_lower, query)
            if params.get('reserva_id') and params.get('monto'):
                return {'tool': 'procesar_pago', 'params': params, 'intent': 'procesar_pago'}
            else:
                return {'tool': None, 'intent': 'procesar_pago_incomplete', 'missing': ['reserva_id', 'monto']}
    
    # ========== RESUMEN DE VENTAS ========== (ANTES de buscar_productos para evitar conflicto)
    ventas_patterns = [
        r'resumen\s+(de\s+)?ventas',
        r'reporte\s+(de\s+)?ventas',
        r'informe\s+(de\s+)?ventas',
        r'cu[aá]nto\s+(vend[ií]|se\s+ha\s+vendido)',
        r'ventas\s+(del|de)\s+(d[ií]a|mes|semana)',
    ]
    
    for pattern in ventas_patterns:
        if re.search(pattern, query_lower):
            # Por defecto, último mes
            from datetime import datetime, timedelta
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            return {'tool': 'resumen_ventas', 'params': {'start_date': start_date, 'end_date': end_date}, 'intent': 'resumen_ventas'}
    
    # ========== BUSCAR SERVICIOS (detección mejorada) ==========
    # Detectar si es una búsqueda de servicios
    is_search = bool(re.search(r'(busca|buscar|encuentra|lista|listar|muestra|mostrar|dame|dime|cu[aá]les|hay).*(servicio|producto)', query_lower)) or \
                bool(re.search(r'servicio[s]?\s+(disponible|de\s+|con\s+|que)', query_lower)) or \
                bool(re.search(r'qu[eé]\s+servicios', query_lower))
    
    if is_search:
        params = {}
        
        # Extraer precio mínimo
        precio_min_match = re.search(r'(?:precio\s+)?(?:mayor|m[aá]s|superior)\s*(?:a|de|que)?\s*\$?\s*(\d+)', query_lower)
        if precio_min_match:
            params['precio_min'] = int(precio_min_match.group(1))
        
        # Extraer precio máximo
        precio_max_match = re.search(r'(?:precio\s+)?(?:menor|menos|inferior)\s*(?:a|de|que)?\s*\$?\s*(\d+)', query_lower)
        if precio_max_match:
            params['precio_max'] = int(precio_max_match.group(1))
        
        # Detectar categoría
        if re.search(r'belleza|peluquer|cabello|corte', query_lower):
            params['categoria'] = 'Servicios de belleza'
        elif re.search(r'reparacion|hogar|plomer|electric', query_lower):
            params['categoria'] = 'Reparaciones del hogar'
        elif re.search(r'clases|educaci|particular|enseñ', query_lower):
            params['categoria'] = 'Clases particulares'
        elif re.search(r'm[eé]dic|salud|cita', query_lower):
            params['categoria'] = 'Salud'
        
        # Extraer texto de búsqueda específico
        # Buscar "servicios de X" donde X es el término de búsqueda
        busqueda_match = re.search(r'servicios?\s+(?:de\s+|llamado\s+)?["\']?([a-záéíóúñ\s]+)["\']?(?:\s+para|\s+con|\s*$)', query_lower)
        if busqueda_match:
            q = busqueda_match.group(1).strip()
            # Limpiar palabras comunes y muy cortas
            q = re.sub(r'\b(con|de|del|la|el|los|las|un|una|que|tiene|tienen|precio|mayor|menor|disponibles?)\b', '', q).strip()
            if q and len(q) >= 2:
                params['q'] = q
        
        logger.info(f"Búsqueda detectada con params: {params}")
        return {'tool': 'buscar_productos', 'params': params, 'intent': 'buscar_servicios'}
    
    # ========== NO SE DETECTÓ INTENCIÓN CLARA ==========
    return None


def extract_payment_params(query_lower: str, query_original: str) -> dict:
    """Extrae parámetros de pago del mensaje del usuario."""
    params = {}
    
    # Buscar ID de reserva
    reserva_match = re.search(r'reserva\s*(?:#|n[úu]mero|id)?\s*(\d+)', query_lower)
    if reserva_match:
        params['reserva_id'] = int(reserva_match.group(1))
    
    # Buscar monto
    monto_match = re.search(r'\$?\s*(\d+(?:\.\d{2})?)\s*(?:d[oó]lares?)?', query_lower)
    if monto_match:
        params['monto'] = monto_match.group(1)
    
    # Buscar método de pago
    if 'tarjeta' in query_lower:
        params['metodo_pago'] = 'tarjeta'
    elif 'efectivo' in query_lower:
        params['metodo_pago'] = 'efectivo'
    elif 'transferencia' in query_lower:
        params['metodo_pago'] = 'transferencia'
    else:
        params['metodo_pago'] = 'tarjeta'  # Default
    
    return params


def extract_reservation_params(query_lower: str, query_original: str) -> dict:
    """Extrae parámetros de reserva del mensaje del usuario."""
    params = {}
    
    # Buscar nombre de servicio entre comillas
    quoted_match = re.search(r'["\']([^"\']+)["\']', query_original)
    if quoted_match:
        params['servicio_nombre'] = quoted_match.group(1)
    
    # Buscar "servicio X" o "el servicio X"
    servicio_match = re.search(r'(?:el\s+)?servicio\s+(?:que\s+se\s+llama\s+)?["\']?([^"\',.]+)["\']?', query_lower)
    if servicio_match and not params.get('servicio_nombre'):
        params['servicio_nombre'] = servicio_match.group(1).strip()
    
    # Buscar fecha
    # Patrones: "19 de enero", "lunes 19", "2026-01-19", "19/01/2026"
    fecha_patterns = [
        r'(\d{4})-(\d{2})-(\d{2})',  # YYYY-MM-DD
        r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})',  # DD/MM/YYYY
        r'(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)',
        r'(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+(\d{1,2})',
    ]
    
    meses = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    }
    
    for pattern in fecha_patterns:
        match = re.search(pattern, query_lower)
        if match:
            groups = match.groups()
            if len(groups) == 3 and groups[0].isdigit():
                # YYYY-MM-DD o DD/MM/YYYY
                if len(groups[0]) == 4:
                    params['fecha'] = f"{groups[0]}-{groups[1]}-{groups[2]}"
                else:
                    params['fecha'] = f"{groups[2]}-{groups[1].zfill(2)}-{groups[0].zfill(2)}"
            elif len(groups) == 2:
                # "19 de enero" o "lunes 19"
                dia = None
                mes = None
                for g in groups:
                    if g.isdigit():
                        dia = g.zfill(2)
                    elif g in meses:
                        mes = meses[g]
                if dia:
                    # Asumir año actual o 2026
                    year = '2026'
                    if mes:
                        params['fecha'] = f"{year}-{mes}-{dia}"
                    else:
                        # Asumir mes actual (enero 2026)
                        params['fecha'] = f"2026-01-{dia}"
            break
    
    # Buscar hora
    hora_patterns = [
        r'(\d{1,2}):(\d{2})',  # 12:00
        r'(\d{1,2})\s*(am|pm|hrs?|horas?)',  # 12pm, 12 hrs
        r'a\s+las?\s+(\d{1,2})(?::(\d{2}))?',  # "a las 12" o "a las 12:00"
    ]
    
    for pattern in hora_patterns:
        match = re.search(pattern, query_lower)
        if match:
            groups = match.groups()
            hora = groups[0]
            minutos = '00'
            
            if len(groups) > 1 and groups[1] and groups[1].isdigit():
                minutos = groups[1]
            elif len(groups) > 1 and groups[1] in ['pm', 'p.m.']:
                hora = str(int(hora) + 12) if int(hora) < 12 else hora
            
            params['hora'] = f"{hora.zfill(2)}:{minutos}"
            break
    
    return params


# System prompt con contexto de FindYourWork y herramientas MCP
SYSTEM_PROMPT = """Eres el asistente virtual de FindYourWork, una plataforma de reservas de servicios profesionales (peluquería, spa, masajes, etc.).

Tienes acceso a las siguientes herramientas para ayudar a los usuarios:

## HERRAMIENTAS DISPONIBLES:

### Consultas (disponibles para todos):
1. **buscar_productos** - Buscar servicios disponibles
   - Parámetros opcionales:
     - q: texto de búsqueda (nombre o descripción)
     - categoria: filtrar por categoría
     - precio_min: precio mínimo (número)
     - precio_max: precio máximo (número)
   - Ejemplos:
     - Listar todos: {"tool": "buscar_productos", "params": {}}
     - Buscar por texto: {"tool": "buscar_productos", "params": {"q": "corte cabello"}}
     - Por precio: {"tool": "buscar_productos", "params": {"precio_max": 50}}
     - Precio mayor a: {"tool": "buscar_productos", "params": {"precio_min": 100}}

2. **ver_reserva** - Ver detalle de una reserva específica
   - Parámetros: reserva_id (número)
   - Ejemplo: {"tool": "ver_reserva", "params": {"reserva_id": 1}}

### Acciones (requieren usuario autenticado - los datos del cliente se obtienen automáticamente):
3. **crear_reserva** - Crear una nueva reserva para el usuario actual
   - Parámetros: servicio_id (número del servicio), fecha (YYYY-MM-DD), hora (HH:MM)
   - NO pidas nombre, email ni teléfono al usuario - se obtienen automáticamente de su cuenta
   - Ejemplo: {"tool": "crear_reserva", "params": {"servicio_id": 1, "fecha": "2026-01-20", "hora": "15:00"}}

4. **procesar_pago** - Registrar un pago
   - Parámetros: reserva_id, monto, metodo_pago (efectivo/tarjeta/transferencia)
   - Ejemplo: {"tool": "procesar_pago", "params": {"reserva_id": 1, "monto": "50.00", "metodo_pago": "tarjeta"}}

### Reportes:
5. **resumen_ventas** - Obtener resumen de ventas
   - Parámetros: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
   - Ejemplo: {"tool": "resumen_ventas", "params": {"start_date": "2026-01-01", "end_date": "2026-01-17"}}

## INSTRUCCIONES:
- Cuando el usuario pida algo que requiera una herramienta, DEBES responder con el JSON de la herramienta en este formato exacto:
  TOOL_CALL: {"tool": "nombre_herramienta", "params": {...}}
- Para listar todos los servicios, usa: TOOL_CALL: {"tool": "buscar_productos", "params": {}}
- Para filtrar por precio, usa precio_min y/o precio_max como NÚMEROS (sin símbolo $).
- Para crear una reserva, SOLO pide el servicio, fecha y hora. NO pidas datos personales.
- Si el usuario menciona un servicio por nombre, primero busca con buscar_productos para obtener el servicio_id.
- Si no necesitas una herramienta, responde normalmente en español.
- Sé amable y conciso.
- Los servicios de FindYourWork incluyen: cortes de cabello, manicure, pedicure, masajes, spa, tratamientos faciales, etc.
"""


def build_prompt(user_query: str) -> str:
    """Construye el prompt completo con contexto del sistema."""
    return f"{SYSTEM_PROMPT}\n\n## Mensaje del usuario:\n{user_query}\n\n## Tu respuesta:"


def extract_json_from_response(response: str) -> dict | None:
    """Extrae el JSON del TOOL_CALL manejando objetos anidados."""
    import json
    
    # Buscar el inicio de TOOL_CALL:
    start_marker = "TOOL_CALL:"
    start_idx = response.upper().find(start_marker.upper())
    if start_idx == -1:
        return None
    
    # Encontrar el inicio del JSON (primer '{')
    json_start = response.find('{', start_idx)
    if json_start == -1:
        return None
    
    # Contar llaves para encontrar el JSON completo
    brace_count = 0
    json_end = json_start
    
    for i, char in enumerate(response[json_start:], start=json_start):
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                json_end = i + 1
                break
    
    json_str = response[json_start:json_end]
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return None


async def execute_tool_if_needed(response: str, caller: dict | None = None) -> tuple[str, dict | None]:
    """Detecta y ejecuta llamadas a herramientas en la respuesta del LLM."""
    import json
    
    tool_json = extract_json_from_response(response)
    if not tool_json:
        return response, None
    
    try:
        tool_name = tool_json.get('tool')
        params = tool_json.get('params', {})
        
        if not tool_name:
            return response, None
        
        # Herramientas que requieren usuario autenticado
        auth_required_tools = ['crear_reserva', 'procesar_pago', 'registrar_cliente']
        user_id = get_user_id_from_caller(caller) if caller else None
        
        if tool_name in auth_required_tools:
            if not user_id:
                return f"❌ Para {tool_name.replace('_', ' ')}, necesitas iniciar sesión primero.", None
            
            # Obtener datos del cliente automáticamente
            client_data = await get_client_data_for_user(user_id)
            
            if tool_name == 'crear_reserva':
                if not client_data:
                    return "❌ No encontramos tu perfil de cliente. Por favor, completa tu perfil en la sección 'Mi Perfil' antes de hacer una reserva.", None
                
                # Inyectar datos del cliente automáticamente
                params['cliente_id'] = client_data.get('id')
                params['user_id'] = user_id
                params['telefono'] = client_data.get('telefono', '')
                
                # Establecer valores por defecto si no se proporcionaron
                if 'estado' not in params:
                    params['estado'] = 'pendiente'
                if 'total_estimado' not in params:
                    params['total_estimado'] = '0.00'
        
        registry = get_default_registry()
        
        # Para operaciones que crean datos, confirmar automáticamente
        confirm = True if tool_name in ['crear_reserva', 'registrar_cliente', 'procesar_pago'] else None
        result = await registry.execute(tool_name, params, confirm=confirm)
        
        # Formatear resultado de forma legible
        if isinstance(result, list):
            if len(result) == 0:
                return "No se encontraron resultados para tu búsqueda.", result
            
            # Formatear lista de servicios/productos
            formatted = f"✅ Encontré {len(result)} resultado(s):\n\n"
            for i, item in enumerate(result[:10], 1):  # Limitar a 10
                nombre = item.get('nombre_servicio') or item.get('nombre') or item.get('nombreServicio') or 'Sin nombre'
                precio = item.get('precio', 'N/A')
                desc = item.get('descripcion', '')[:100] if item.get('descripcion') else ''
                formatted += f"**{i}. {nombre}** - ${precio}\n"
                if desc:
                    formatted += f"   {desc}...\n"
            return formatted, result
        
        return f"✅ Resultado:\n```json\n{json.dumps(result, indent=2, ensure_ascii=False)}\n```", result
        
    except ToolError as e:
        return f"❌ Error ejecutando herramienta: {str(e)}", None
    except Exception as e:
        return f"❌ Error: {str(e)}", None


class ChatRequest(BaseModel):
    query: str
    session_id: str | None = None
    top_k: int = 5


class ToolCall(BaseModel):
    tool: str
    params: dict | None = None


@router.post("/query")
async def query_chat(payload: ChatRequest, caller=Depends(get_caller)):
    """Handle a chat query: retrieve relevant docs, call LLM adapter, and return answer."""
    if not payload.query:
        raise HTTPException(status_code=400, detail="Empty query")

    from app.llm_adapter import get_default_adapter

    adapter = get_default_adapter()
    
    # Construir prompt con contexto del sistema
    full_prompt = build_prompt(payload.query)
    answer = await adapter.generate(full_prompt)
    
    # Detectar y ejecutar herramientas si es necesario (pasar caller para autenticación)
    final_answer, tool_result = await execute_tool_if_needed(answer, caller)

    return {"answer": final_answer, "sources": [], "tool_result": tool_result}


@router.post("/stream")
async def stream_chat(payload: ChatRequest, caller=Depends(get_caller)):
    """Stream an answer back to client as Server-Sent Events (text/event-stream).

    Usa detección de intención basada en reglas primero, y el LLM solo para conversación.
    """
    from fastapi.responses import StreamingResponse
    import asyncio
    import json

    # Obtener user_id del JWT para operaciones autenticadas
    user_id = get_user_id_from_caller(caller)
    
    async def event_stream():
        # =====================================================
        # PASO 1: Detectar intención con reglas (sin depender del LLM)
        # =====================================================
        intent_result = detect_intent(payload.query)
        
        if intent_result:
            tool_name = intent_result.get('tool')
            params = intent_result.get('params', {})
            intent = intent_result.get('intent')
            
            logger.info(f"Intención detectada: {intent}, tool: {tool_name}, params: {params}")
            
            # Caso: Intención incompleta - falta información
            if intent == 'crear_reserva_incomplete':
                yield "data: Para crear tu reserva necesito que me indiques:\n"
                yield "data: - **¿Qué servicio deseas?** (puedes decir el nombre)\n"
                yield "data: - **¿Qué fecha?** (ej: 20 de enero)\n"
                yield "data: - **¿A qué hora?** (ej: 14:00)\n"
                yield "data: \n"
                yield "data: 💡 Ejemplo: \"Quiero agendar el servicio 'corte de cabello' para el 20 de enero a las 14:00\"\n\n"
                yield "event: done\n\n"
                return
            
            if intent == 'ver_reserva_incomplete':
                yield "data: Para ver tu reserva necesito el **número/ID de la reserva**.\n"
                yield "data: \n"
                yield "data: 💡 Ejemplo: \"Muéstrame la reserva número 5\"\n\n"
                yield "event: done\n\n"
                return
            
            if intent == 'procesar_pago_incomplete':
                yield "data: Para procesar un pago necesito que me indiques:\n"
                yield "data: - **Número de reserva** (ej: reserva #5)\n"
                yield "data: - **Monto a pagar** (ej: $50.00)\n"
                yield "data: \n"
                yield "data: 💡 Ejemplo: \"Quiero pagar $50 de la reserva #5 con tarjeta\"\n\n"
                yield "event: done\n\n"
                return
            
            # Caso: Herramienta detectada - ejecutarla
            if tool_name:
                try:
                    # Herramientas que requieren usuario autenticado
                    auth_required_tools = ['crear_reserva', 'procesar_pago', 'registrar_cliente']
                    
                    if tool_name in auth_required_tools:
                        if not user_id:
                            yield f"data: ❌ Para {tool_name.replace('_', ' ')}, necesitas **iniciar sesión** primero.\n\n"
                            yield "event: done\n\n"
                            return
                        
                        # Obtener datos del cliente automáticamente
                        client_data = await get_client_data_for_user(user_id)
                        
                        if tool_name == 'crear_reserva':
                            if not client_data:
                                yield "data: ❌ No encontramos tu perfil de cliente.\n"
                                yield "data: Por favor, completa tu perfil en la sección **'Mi Perfil'** antes de hacer una reserva.\n\n"
                                yield "event: done\n\n"
                                return
                            
                            # Si el usuario mencionó un servicio por nombre, buscarlo primero
                            if params.get('servicio_nombre') and not params.get('servicio_id'):
                                yield f"data: 🔍 Buscando el servicio \"{params['servicio_nombre']}\"...\n\n"
                                registry = get_default_registry()
                                servicios = await registry.execute('buscar_productos', {'q': params['servicio_nombre']})
                                
                                if servicios and len(servicios) > 0:
                                    # Buscar coincidencia exacta o la primera
                                    servicio_encontrado = None
                                    for s in servicios:
                                        nombre_s = (s.get('nombre_servicio') or s.get('nombre', '')).lower()
                                        if params['servicio_nombre'].lower() in nombre_s or nombre_s in params['servicio_nombre'].lower():
                                            servicio_encontrado = s
                                            break
                                    
                                    if not servicio_encontrado:
                                        servicio_encontrado = servicios[0]
                                    
                                    params['servicio_id'] = servicio_encontrado.get('id')
                                    servicio_nombre = servicio_encontrado.get('nombre_servicio') or servicio_encontrado.get('nombre')
                                    servicio_precio = servicio_encontrado.get('precio', 'N/A')
                                    yield f"data: ✅ Encontré: **{servicio_nombre}** (${servicio_precio})\n\n"
                                else:
                                    yield f"data: ❌ No encontré ningún servicio llamado \"{params['servicio_nombre']}\".\n"
                                    yield "data: Usa: \"lista de servicios\" para ver los disponibles.\n\n"
                                    yield "event: done\n\n"
                                    return
                            
                            # Verificar que tenemos todos los datos necesarios
                            if not params.get('servicio_id'):
                                yield "data: ❌ No pude identificar qué servicio deseas. ¿Puedes decirme el nombre del servicio?\n\n"
                                yield "event: done\n\n"
                                return
                            
                            if not params.get('fecha'):
                                yield "data: ❌ ¿Para qué **fecha** quieres la reserva? (ej: 20 de enero)\n\n"
                                yield "event: done\n\n"
                                return
                            
                            if not params.get('hora'):
                                yield "data: ❌ ¿A qué **hora** quieres la reserva? (ej: 14:00)\n\n"
                                yield "event: done\n\n"
                                return
                            
                            # Inyectar datos del cliente automáticamente
                            params['cliente_id'] = client_data.get('id')
                            params['user_id'] = user_id
                            params['telefono'] = client_data.get('telefono', '')
                            params['estado'] = 'pendiente'
                            params['total_estimado'] = '0.00'
                            
                            # Limpiar parámetros no necesarios
                            params.pop('servicio_nombre', None)
                    
                    # Ejecutar la herramienta
                    yield f"data: 🔍 Procesando tu solicitud...\n\n"
                    await asyncio.sleep(0.1)
                    
                    registry = get_default_registry()
                    confirm = True if tool_name in ['crear_reserva', 'registrar_cliente', 'procesar_pago'] else None
                    result = await registry.execute(tool_name, params, confirm=confirm)
                    
                    # Formatear resultado según la herramienta
                    result_text = await format_tool_result(tool_name, result, params)
                    
                    # Enviar resultado línea por línea
                    for line in result_text.split('\n'):
                        yield f"data: {line}\n"
                    yield "\n"
                    
                except Exception as e:
                    logger.error(f"Error ejecutando herramienta: {e}", exc_info=True)
                    yield f"data: ❌ Lo siento, hubo un error: {str(e)}\n\n"
                
                yield "event: done\n\n"
                return
        
        # =====================================================
        # PASO 2: Si no detectamos intención, usar el LLM para respuesta conversacional
        # =====================================================
        adapter = __import__('app.llm_adapter', fromlist=['get_default_adapter']).get_default_adapter()
        full_prompt = build_prompt(payload.query)
        
        full_response = ""
        if hasattr(adapter, 'stream_generate'):
            async for chunk in adapter.stream_generate(full_prompt):
                full_response += chunk
        else:
            full_response = await adapter.generate(full_prompt)
        
        # Limpiar cualquier TOOL_CALL que el modelo haya generado (ya lo manejamos con reglas)
        clean_response = re.sub(r'TOOL_CALL:\s*\{[^}]*\}', '', full_response).strip()
        
        if clean_response:
            # Enviar respuesta del LLM
            parts = re.split(r'(?<=[.!?])\s+', clean_response)
            for part in parts:
                if part.strip():
                    yield f"data: {part} \n\n"
                    await asyncio.sleep(0.03)
        else:
            yield "data: 👋 ¡Hola! Soy el asistente de FindYourWork. Puedo ayudarte a:\n"
            yield "data: - **Buscar servicios**: \"muéstrame los servicios disponibles\"\n"
            yield "data: - **Filtrar por precio**: \"servicios con precio menor a $50\"\n"
            yield "data: - **Crear reservas**: \"quiero agendar el servicio X para el día Y a las Z\"\n"
            yield "data: - **Ver tus reservas**: \"ver mi reserva número 5\"\n\n"
        
        yield "event: done\n\n"

    return StreamingResponse(event_stream(), media_type='text/event-stream')


async def format_tool_result(tool_name: str, result: Any, params: dict) -> str:
    """Formatea el resultado de una herramienta de forma legible."""
    import json
    
    if tool_name == 'crear_reserva':
        if result and result.get('id'):
            text = f"✅ **¡Reserva creada exitosamente!**\n\n"
            text += f"📋 **ID de reserva:** {result.get('id')}\n"
            text += f"📆 **Fecha:** {result.get('fecha', 'N/A')}\n"
            text += f"🕐 **Hora:** {result.get('hora', 'N/A')}\n"
            text += f"📌 **Estado:** {result.get('estado', 'pendiente')}\n"
            text += f"\n_Puedes ver tu reserva en la sección 'Mis Reservas'._"
            return text
        elif result and result.get('proposal'):
            return f"📋 Reserva pendiente de confirmación. Por favor intenta de nuevo."
        elif result and result.get('error'):
            return f"❌ Error: {result.get('error')}"
        else:
            return f"❌ No se pudo crear la reserva. Respuesta: {json.dumps(result, ensure_ascii=False)}"
    
    elif tool_name == 'buscar_productos':
        if isinstance(result, list):
            if len(result) == 0:
                return "📭 No encontré servicios que coincidan con tu búsqueda. ¿Podrías intentar con otros términos?"
            
            query = params.get('q', '')
            precio_min = params.get('precio_min')
            precio_max = params.get('precio_max')
            categoria = params.get('categoria')
            
            # Construir descripción del filtro
            filtro_desc = ""
            if query:
                filtro_desc = f'relacionados con "{query}"'
            if precio_min:
                filtro_desc += f' con precio mayor a ${precio_min}'
            if precio_max:
                filtro_desc += f' con precio menor a ${precio_max}'
            if categoria:
                filtro_desc += f' en categoría "{categoria}"'
            
            if filtro_desc:
                text = f"✅ Encontré **{len(result)} servicio(s)** {filtro_desc}:\n\n"
            else:
                text = f"✅ Aquí tienes **{len(result)} servicio(s)** disponibles:\n\n"
            
            for i, item in enumerate(result[:10], 1):
                nombre = item.get('nombre_servicio') or item.get('nombre') or 'Sin nombre'
                precio = item.get('precio', 'N/A')
                categoria_item = item.get('categoria_nombre') or item.get('categoria', {}).get('nombre', '')
                desc = item.get('descripcion', '')
                servicio_id = item.get('id', '')
                
                text += f"**{i}. {nombre}** (ID: {servicio_id})\n"
                text += f"   💰 Precio: ${precio}\n"
                if categoria_item:
                    text += f"   📁 Categoría: {categoria_item}\n"
                if desc:
                    text += f"   📝 {desc[:80]}{'...' if len(desc) > 80 else ''}\n"
                text += "\n"
            
            if len(result) > 10:
                text += f"_...y {len(result) - 10} servicios más._\n"
            
            return text
        else:
            return f"✅ Resultado: {json.dumps(result, ensure_ascii=False)}"
    
    elif tool_name == 'ver_reserva':
        if result and result.get('id'):
            text = f"📅 **Detalles de tu reserva #{result.get('id')}:**\n\n"
            text += f"- **Fecha:** {result.get('fecha', 'N/A')}\n"
            text += f"- **Hora:** {result.get('hora', 'N/A')}\n"
            text += f"- **Estado:** {result.get('estado', 'N/A')}\n"
            text += f"- **Total estimado:** ${result.get('total_estimado', '0.00')}\n"
            
            # Mostrar servicios asociados
            servicios = result.get('servicios', [])
            if servicios:
                text += "\n**Servicios:**\n"
                for s in servicios:
                    text += f"  • {s.get('nombre', 'N/A')} - ${s.get('precio', '0.00')} ({s.get('estado', 'pendiente')})\n"
            
            return text
        elif result and result.get('error'):
            return f"❌ {result.get('error')}"
        else:
            return "❌ No se encontró la reserva solicitada."
    
    elif tool_name == 'procesar_pago':
        if result and result.get('id'):
            text = f"✅ **¡Pago registrado exitosamente!**\n\n"
            text += f"- **ID de pago:** {result.get('id')}\n"
            text += f"- **Reserva:** #{result.get('reserva')}\n"
            text += f"- **Monto:** ${result.get('monto', '0.00')}\n"
            text += f"- **Estado:** {result.get('estado', 'pagado')}\n"
            text += f"- **Método:** {result.get('metodo_pago', 'N/A')}\n"
            return text
        elif result and result.get('proposal'):
            return f"💳 Pago pendiente de confirmación."
        elif result and result.get('error'):
            return f"❌ Error: {result.get('error')}"
        else:
            return f"❌ No se pudo procesar el pago."
    
    elif tool_name == 'resumen_ventas':
        if result:
            text = f"📊 **Resumen de ventas:**\n\n"
            text += f"- **Total ventas:** ${result.get('total', 0)}\n"
            text += f"- **Cantidad:** {result.get('count', 0)} transacciones\n"
            return text
        return "📊 No hay datos de ventas disponibles."
    
    else:
        return f"✅ **Resultado:** {json.dumps(result, indent=2, ensure_ascii=False)}"


@router.post("/call-tool")
async def call_tool(req: ToolCall, caller=Depends(get_caller)):
    from app.tools import get_default_registry

    registry = get_default_registry()
    try:
        res = await registry.execute(req.tool, req.params or {})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return res
