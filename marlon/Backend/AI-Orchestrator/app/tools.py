from typing import Any, Dict
import httpx
import logging

from app.config import settings

logger = logging.getLogger(__name__)

ORCHESTRATOR_TOOLS_DJANGO_URL = settings.DJANGO_TOOLS_URL or "http://django:8000/api_rest/tools"
ORCHESTRATOR_TOOLS_API_KEY = settings.TOOLS_API_KEY or "dev-secret"


class ToolError(Exception):
    pass


class ToolClient:
    """Simple HTTP client to call the Django tools endpoints."""

    def __init__(self, base_url: str = ORCHESTRATOR_TOOLS_DJANGO_URL, api_key: str = ORCHESTRATOR_TOOLS_API_KEY):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.AsyncClient(timeout=30.0)

    async def call(self, path: str, method: str = "GET", json: Dict | None = None, extra_headers: Dict[str, str] | None = None) -> Dict[str, Any]:
        # Handle query parameters separately to ensure proper trailing slash
        path_clean = path.lstrip('/')
        if '?' in path_clean:
            base_path, query = path_clean.split('?', 1)
            url = f"{self.base_url}/{base_path}/?{query}"
        else:
            url = f"{self.base_url}/{path_clean}/"
        headers = {"Authorization": f"ApiKey {self.api_key}"}
        if extra_headers:
            headers.update(extra_headers)
        try:
            # Para GET requests, enviar parámetros como query params
            # Para POST/PUT/PATCH, enviar como JSON body
            if method.upper() == "GET":
                resp = await self._client.request(method, url, params=json or {}, headers=headers)
            else:
                resp = await self._client.request(method, url, json=json or {}, headers=headers)
        except Exception as e:
            logger.exception("HTTP call to tools failed")
            raise ToolError(f"Tool call network error: {e}")

        if resp.status_code >= 400:
            logger.error("Tool call failed %s %s -> %s", resp.status_code, url, resp.text)
            raise ToolError(f"Tool call failed {resp.status_code}: {resp.text}")

        try:
            return resp.json()
        except Exception:
            # If response is not JSON, return text payload
            return {"raw": resp.text}
    async def close(self) -> None:
        try:
            await self._client.aclose()
        except Exception:
            logger.warning("Error closing ToolClient httpx client", exc_info=True)


class ToolRegistry:
    """Registry of available tools with minimal metadata."""

    def __init__(self, client: ToolClient):
        self.client = client
        self.tools = {
            "buscar_productos": {
                "path": "buscar-productos",
                "method": "GET",
                "description": "Buscar servicios disponibles. Parámetros opcionales: q (texto de búsqueda), categoria, precio_min, precio_max",
            },
            "ver_reserva": {
                "path": "ver-reserva/{reserva_id}",
                "method": "GET",
                "description": "Obtener detalle de una reserva",
            },
            "obtener_cliente": {
                "path": "obtener-cliente",
                "method": "GET",
                "description": "Obtener cliente por user_id",
            },
            "crear_reserva": {
                "path": "crear-reserva",
                "method": "POST",
                "description": "Crear una reserva",
            },
            "registrar_cliente": {
                "path": "registrar-cliente",
                "method": "POST",
                "description": "Registrar cliente nuevo",
            },
            "procesar_pago": {
                "path": "procesar-pago",
                "method": "POST",
                "description": "Registrar un pago para una reserva",
            },
            "resumen_ventas": {
                "path": "resumen-ventas",
                "method": "GET",
                "description": "Obtener resumen de ventas con totales de pagos e ingresos del período. Parámetros: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)",
            },
        }

    async def execute(self, tool_name: str, params: Dict[str, Any], confirm: bool | None = None) -> Dict[str, Any]:
        """Execute a registered tool.

        - If `confirm` is None, the call is direct and no confirm query param is attached.
        - If `confirm` is False, the tools that support proposal semantics should return a proposal object.
        - If `confirm` is True, a mutative action will be performed.
        """
        if tool_name not in self.tools:
            raise ToolError("Unknown tool")
        meta = self.tools[tool_name]
        path = meta["path"].format(**params) if "{" in meta["path"] else meta["path"]
        method = meta.get("method", "GET")

        # Attach confirm as a query param if provided (Django views support it as query or body)
        # Note: ToolClient.call() handles trailing slash properly
        if confirm is True:
            path = f"{path}?confirm=true"
        elif confirm is False:
            path = f"{path}?confirm=false"

        # Forward idempotency key for confirm operations to ensure server-side idempotency
        extra_headers = None
        idempotency_key = None
        if isinstance(params, dict):
            idempotency_key = params.get('idempotency_key')
        if confirm is True and idempotency_key:
            extra_headers = {'Idempotency-Key': idempotency_key}

        # For GET calls, send params in json to let the tools endpoint handle them from the body/query
        return await self.client.call(path=path, method=method, json=params, extra_headers=extra_headers)


_default_registry: ToolRegistry | None = None


def get_default_registry() -> ToolRegistry:
    global _default_registry
    if _default_registry is None:
        _default_registry = ToolRegistry(ToolClient())
    return _default_registry
