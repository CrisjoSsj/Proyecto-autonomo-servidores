/**
 * errorHandler.ts
 * Manejo centralizado de errores de la aplicación
 */

// ============================================================
// TIPOS
// ============================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorInfo {
  message: string;
  userMessage: string;
  status?: number;
  details?: unknown;
}

// ============================================================
// FUNCIONES
// ============================================================

/**
 * Extrae un mensaje amigable de cualquier tipo de error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Error inesperado';
}

/**
 * Convierte un error a un mensaje amigable para el usuario
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Datos inválidos. Verifica la información e intenta de nuevo.';
      case 401:
        return 'Sesión expirada. Por favor inicia sesión de nuevo.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no fue encontrado.';
      case 409:
        return 'Conflicto: ya existe un registro con estos datos.';
      case 422:
        return 'Datos de validación incorrectos.';
      case 500:
        return 'Error interno del servidor. Intenta más tarde.';
      case 502:
      case 503:
      case 504:
        return 'Servicio no disponible. Intenta más tarde.';
      default:
        return error.message || 'Error de comunicación con el servidor.';
    }
  }

  if (error instanceof Error) {
    // Detectar errores de red
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Error de conexión. Verifica tu red e intenta de nuevo.';
    }
    
    // Detectar errores de timeout
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return 'La solicitud tardó demasiado. Intenta de nuevo.';
    }

    return error.message;
  }

  return 'Error inesperado. Por favor intenta de nuevo.';
}

/**
 * Procesa respuesta HTTP y lanza ApiError si hay problemas
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let details: unknown;
    const contentType = response.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        details = await response.json();
      } else {
        details = await response.text();
      }
    } catch {
      details = 'No se pudo leer el cuerpo del error';
    }

    throw new ApiError(
      response.status,
      `HTTP ${response.status}: ${response.statusText}`,
      details
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  
  return response.text() as unknown as T;
}

/**
 * Parsea información completa de un error
 */
export function parseError(error: unknown): ErrorInfo {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      userMessage: handleApiError(error),
      status: error.status,
      details: error.details
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      userMessage: handleApiError(error),
    };
  }

  return {
    message: String(error),
    userMessage: 'Error inesperado',
  };
}

/**
 * Log de errores para debugging
 */
export function logError(context: string, error: unknown): void {
  const errorInfo = parseError(error);
  console.error(`[${context}]`, {
    message: errorInfo.message,
    status: errorInfo.status,
    details: errorInfo.details
  });
}

/**
 * Verifica si un error es de autenticación
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403;
  }
  return false;
}

/**
 * Verifica si un error es de conexión
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('network request failed')
    );
  }
  return false;
}
