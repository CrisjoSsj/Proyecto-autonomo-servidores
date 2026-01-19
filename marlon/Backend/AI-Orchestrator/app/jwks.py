from jwt import PyJWKClient, decode, InvalidTokenError
from fastapi import HTTPException
from app.config import settings


class JWKSVerifier:
    def __init__(self, jwks_url: str):
        if not jwks_url:
            raise RuntimeError("JWKS URL not configured")
        self.jwks_url = jwks_url
        self._client = PyJWKClient(jwks_url)

    def verify(self, token: str) -> dict:
        try:
            signing_key = self._client.get_signing_key_from_jwt(token)
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token (key fetch): {e}")

        try:
            payload = decode(token, signing_key.key, algorithms=["RS256"], options={"require": ["sub"]})
            return payload
        except InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


_verifier: JWKSVerifier | None = None


def get_verifier() -> JWKSVerifier:
    global _verifier
    if _verifier is None:
        if not getattr(settings, 'JWKS_URL', None):
            raise RuntimeError("JWKS_URL not configured in settings")
        _verifier = JWKSVerifier(str(settings.JWKS_URL))
    return _verifier


def verify_jwt_token(token: str) -> dict:
    v = get_verifier()
    return v.verify(token)
