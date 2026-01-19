import os
import jwt
import logging
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

class JWTAuthentication(BaseAuthentication):
    """
    Autenticación JWT local (RS256)
    NO consulta al Auth Service
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return None

        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        public_key = os.environ.get('JWT_PUBLIC_KEY')
        if not public_key:
            raise AuthenticationFailed('JWT_PUBLIC_KEY no configurada')
        
        # Reemplazar \n literal por saltos de línea reales (necesario para PEM)
        public_key = public_key.replace('\\n', '\n')
        
        logger.info(f"Public key starts with: {public_key[:50]}...")
        logger.info(f"Token (first 50 chars): {token[:50]}...")

        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                options={
                    'require': ['sub']  # Solo requerir 'sub', exp/iat son opcionales
                }
            )
            logger.info(f"Token decoded successfully. Payload keys: {list(payload.keys())}")
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except jwt.InvalidTokenError as e:
            logger.error(f"JWT decode error: {type(e).__name__}: {e}")
            raise AuthenticationFailed(f'Token inválido: {type(e).__name__}')

        # Guardamos el payload para usarlo en permisos / vistas
        request.jwt_payload = payload

        # No usamos User de Django (el user vive en Auth Service)
        return (None, payload)


class ApiKeyAuthentication(BaseAuthentication):
    """Simple API Key authentication for service-to-service calls.

    Accepts either:
    - Authorization: ApiKey <key>
    - X-API-KEY: <key>

    On success returns a lightweight user-like object with is_authenticated=True so
    DRF's `IsAuthenticated` permission will allow the call.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        api_key_header = request.headers.get('X-API-KEY') or os.environ.get('ORCHESTRATOR_API_KEY')

        key = None
        if auth_header.startswith('ApiKey '):
            key = auth_header.split(' ', 1)[1].strip()
        elif api_key_header:
            key = api_key_header.strip()

        if not key:
            return None

        expected = os.environ.get('ORCHESTRATOR_API_KEY') or os.environ.get('ORCHESTRATOR_TOOLS_API_KEY')
        if not expected:
            # If not configured, fail-safe: reject external calls
            logger.error('ORCHESTRATOR_API_KEY no configurada en el entorno')
            raise AuthenticationFailed('ORCHESTRATOR_API_KEY no configurada')

        if key != expected:
            logger.warning('API Key invalida recibida: %s', key[:8])
            raise AuthenticationFailed('API Key invalida')

        # Provide a minimal user-like object accepted by IsAuthenticated
        from types import SimpleNamespace
        user = SimpleNamespace(is_authenticated=True, username='orchestrator')
        request.api_key = key
        return (user, key)
