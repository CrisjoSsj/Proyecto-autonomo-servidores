"""
Shared - Módulos compartidos entre microservicios
"""
from .error_handler import APIError, ErrorDetail, create_error_response
from .jwt_validator import validate_jwt_local

__all__ = ["APIError", "ErrorDetail", "create_error_response", "validate_jwt_local"]
