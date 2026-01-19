from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

security = HTTPBearer()


async def validate_jwt(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validate JWT by fetching JWKS and verifying signature.

    This is a placeholder: implement caching of JWKS, signature verification and claim checks.
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    # TODO: fetch and cache JWKS from settings.JWKS_URL, verify token using jwcrypto or PyJWT
    # For now accept token in dev mode (NOT for production)
    return {"sub": "dev-user", "roles": ["user"]}
