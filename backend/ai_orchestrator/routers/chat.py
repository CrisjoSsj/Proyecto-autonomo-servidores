"""
Router de Chat
Endpoint principal para interactuar con el asistente IA
"""
import uuid
import base64
import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.conversation import Conversation, Message
from adapters import GroqAdapter, MockLLMAdapter
from mcp.server import MCPServer
from config import get_settings

router = APIRouter(prefix="/chat", tags=["Chat IA"])
settings = get_settings()


# ============================================
# LLM Factory
# ============================================

def get_llm_provider():
    """Factory para obtener el provider configurado"""
    if settings.llm_provider == "groq" and settings.groq_api_key:
        return GroqAdapter()
    return MockLLMAdapter()


def get_mcp_server():
    """Obtiene el servidor MCP"""
    return MCPServer(core_api_url=settings.core_api_url)


# ============================================
# Schemas
# ============================================

class ChatMessageRequest(BaseModel):
    """Solicitud de mensaje de chat"""
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[int] = None
    channel: str = "web"  # web, whatsapp, telegram


class ChatMessageResponse(BaseModel):
    """Respuesta del chat"""
    conversation_id: str
    response: str
    tool_used: Optional[str] = None
    tool_result: Optional[dict] = None
    timestamp: str


class ConversationResponse(BaseModel):
    """Historial de conversación"""
    conversation_id: str
    messages: List[dict]
    created_at: str


# ============================================
# System Prompt
# ============================================

SYSTEM_PROMPT = """Eres el asistente virtual de Chuwue Grill, un restaurante especializado en alitas, hamburguesas y parrilladas.

Tu rol es:
1. Ayudar a los clientes con información del menú y precios
2. Asistir con reservas y consultas
3. Proporcionar información sobre el restaurante
4. Responder de manera amigable y profesional

Tienes acceso a las siguientes herramientas:
- buscar_platos: Buscar platos en el menú
- ver_reserva: Consultar detalles de una reserva
- crear_reserva: Crear una nueva reserva
- registrar_cliente: Registrar un nuevo cliente
- resumen_ventas: Obtener estadísticas de ventas (solo para administradores)

Cuando el usuario pregunte algo que requiera información del sistema, usa las herramientas disponibles.
Responde siempre en español y de manera concisa pero amigable.
Si no puedes ayudar con algo, sugiere alternativas o indica cómo pueden contactar al restaurante."""


# ============================================
# Endpoints
# ============================================

@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Enviar mensaje al asistente IA
    
    - **message**: Mensaje del usuario
    - **conversation_id**: ID de conversación existente (opcional)
    - **channel**: Canal de origen (web, whatsapp, telegram)
    
    El asistente puede usar herramientas MCP para:
    - Buscar en el menú
    - Consultar/crear reservas
    - Registrar clientes
    - Obtener estadísticas
    """
    llm = get_llm_provider()
    mcp = get_mcp_server()
    
    # Obtener o crear conversación
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.conversation_id == request.conversation_id
        ).first()
    else:
        conversation = None
    
    if not conversation:
        conversation = Conversation(
            conversation_id=f"conv_{uuid.uuid4().hex[:12]}",
            user_id=request.user_id,
            channel=request.channel
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Construir historial de mensajes
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # Agregar mensajes previos de la conversación
    prev_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.desc()).limit(10).all()
    
    for msg in reversed(prev_messages):
        messages.append({"role": msg.role, "content": msg.content})
    
    # Agregar mensaje actual
    messages.append({"role": "user", "content": request.message})
    
    # Guardar mensaje del usuario
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    
    # Obtener herramientas MCP
    tools = mcp.get_tools_for_llm()
    
    # Generar respuesta del LLM
    response = await llm.generate(messages, tools=tools)
    
    tool_used = None
    tool_result = None
    final_response = response.content
    
    # Si el LLM quiere usar herramientas
    if response.tool_calls:
        tool_results = []
        
        for tool_call in response.tool_calls:
            tool_used = tool_call.tool_name
            result = await mcp.execute(tool_call.tool_name, tool_call.arguments)
            tool_result = result
            
            tool_results.append({
                "call_id": tool_call.call_id,
                "tool_name": tool_call.tool_name,
                "result": result
            })
            
            # Guardar resultado del tool
            tool_message = Message(
                conversation_id=conversation.id,
                role="tool",
                content=json.dumps(result, ensure_ascii=False),
                tool_name=tool_call.tool_name,
                tool_result=json.dumps(result, ensure_ascii=False)
            )
            db.add(tool_message)
        
        # Agregar resultados al contexto y generar respuesta final
        messages.append({
            "role": "assistant",
            "content": "",
            "tool_calls": [
                {
                    "id": tc.call_id,
                    "type": "function",
                    "function": {
                        "name": tc.tool_name,
                        "arguments": json.dumps(tc.arguments)
                    }
                }
                for tc in response.tool_calls
            ]
        })
        
        for tr in tool_results:
            messages.append({
                "role": "tool",
                "tool_call_id": tr["call_id"],
                "content": json.dumps(tr["result"], ensure_ascii=False)
            })
        
        # Generar respuesta final con los resultados
        final_response_obj = await llm.generate(messages)
        final_response = final_response_obj.content
    
    # Guardar respuesta del asistente
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=final_response,
        tool_name=tool_used
    )
    db.add(assistant_message)
    db.commit()
    
    return ChatMessageResponse(
        conversation_id=conversation.conversation_id,
        response=final_response,
        tool_used=tool_used,
        tool_result=tool_result,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@router.post("/message/with-image")
async def send_message_with_image(
    message: str = Form(...),
    conversation_id: Optional[str] = Form(None),
    channel: str = Form("web"),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Enviar mensaje con imagen (multimodal)
    
    El asistente analizará la imagen y responderá según el contexto.
    Útil para:
    - Identificar platos
    - Analizar fotos del restaurante
    - OCR de menús
    """
    llm = get_llm_provider()
    
    # Leer y encodear imagen
    image_content = await image.read()
    image_base64 = base64.b64encode(image_content).decode()
    
    # Analizar imagen
    prompt = f"El usuario envió esta imagen con el mensaje: '{message}'. Analiza la imagen y responde de manera útil en el contexto de un restaurante."
    
    image_analysis = await llm.analyze_image(image_base64, prompt)
    
    # Crear/obtener conversación
    if conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.conversation_id == conversation_id
        ).first()
    else:
        conversation = Conversation(
            conversation_id=f"conv_{uuid.uuid4().hex[:12]}",
            channel=channel
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Guardar mensajes
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=f"[Imagen adjunta] {message}"
    )
    db.add(user_msg)
    
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=image_analysis
    )
    db.add(assistant_msg)
    db.commit()
    
    return {
        "conversation_id": conversation.conversation_id,
        "response": image_analysis,
        "image_analyzed": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/history/{conversation_id}", response_model=ConversationResponse)
async def get_conversation_history(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Obtener historial de una conversación"""
    
    conversation = db.query(Conversation).filter(
        Conversation.conversation_id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversación no encontrada"
        )
    
    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.asc()).all()
    
    return ConversationResponse(
        conversation_id=conversation.conversation_id,
        messages=[
            {
                "role": m.role,
                "content": m.content,
                "tool_name": m.tool_name,
                "timestamp": m.created_at.isoformat()
            }
            for m in messages
        ],
        created_at=conversation.created_at.isoformat()
    )


@router.get("/conversations")
async def list_conversations(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Listar conversaciones recientes"""
    
    conversations = db.query(Conversation).order_by(
        Conversation.updated_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "conversation_id": c.conversation_id,
            "channel": c.channel,
            "user_id": c.user_id,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        }
        for c in conversations
    ]
