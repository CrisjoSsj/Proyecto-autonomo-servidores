import axios from 'axios';

/**
 * Detecta si un token es JWT (tiene 3 partes separadas por punto)
 */
export function isJWT(token: string): boolean {
  return token.includes('.') && token.split('.').length === 3;
}

/**
 * Genera el header de autorización correcto según el tipo de token
 * - JWT → Bearer <token>
 * - Token clásico Django → Token <token>
 */
export function getAuthHeader(token: string, preferredScheme: 'Bearer' | 'Token' = 'Bearer'): string {
  // Si es JWT, SIEMPRE usar Bearer (Django JWTAuthentication lo requiere)
  if (isJWT(token)) {
    return `Bearer ${token}`;
  }
  // Si es token clásico de Django, usar Token
  return `Token ${token}`;
}

/**
 * Crea una instancia de axios configurada para acceso a la API
 * GET (lectura): acceso público sin autenticación
 * POST/PUT/PATCH/DELETE: requiere token
 * 
 * NOTA: authScheme ahora es solo una preferencia. Si el token almacenado es JWT,
 * se usará Bearer automáticamente (requerido por Django JWTAuthentication).
 */
export function createApiClient(baseURL: string, authScheme: 'Bearer' | 'Token' | 'None' = 'Bearer') {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Agregar token si existe en localStorage
  instance.interceptors.request.use((config) => {
    if (authScheme === 'None') return config;
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) config.headers = {} as any;
      // Usar la función inteligente que detecta JWT vs Token clásico
      config.headers.Authorization = getAuthHeader(token, authScheme);
    }
    return config;
  });

  return instance;
}
