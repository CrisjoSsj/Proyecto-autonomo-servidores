"""
Firma HMAC-SHA256 para webhooks
"""
import hmac
import hashlib
import json
from typing import Union


def sign_payload(payload: Union[dict, bytes], secret: str) -> str:
    """
    Firma un payload con HMAC-SHA256
    
    Args:
        payload: Datos a firmar (dict o bytes)
        secret: Clave secreta compartida
        
    Returns:
        Firma hexadecimal
    """
    if isinstance(payload, dict):
        payload = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode()
    elif isinstance(payload, str):
        payload = payload.encode()
    
    signature = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return signature


def verify_signature(payload: Union[dict, bytes], signature: str, secret: str) -> bool:
    """
    Verifica una firma HMAC-SHA256
    
    Args:
        payload: Datos firmados
        signature: Firma a verificar
        secret: Clave secreta compartida
        
    Returns:
        True si la firma es válida
    """
    expected = sign_payload(payload, secret)
    return hmac.compare_digest(signature, expected)


def create_signed_webhook(
    event_type: str,
    data: dict,
    secret: str
) -> tuple:
    """
    Crea un webhook firmado listo para enviar
    
    Args:
        event_type: Tipo de evento
        data: Datos del evento
        secret: Clave secreta del partner
        
    Returns:
        Tuple de (payload_dict, signature)
    """
    from datetime import datetime, timezone
    
    payload = {
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data
    }
    
    signature = sign_payload(payload, secret)
    
    return payload, signature
