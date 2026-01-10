/**
 * Constantes de configuración de la aplicación
 * Centraliza valores que se usan en múltiples partes del código
 */

// ============================================================
// URLS Y ENDPOINTS
// ============================================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
export const GRAPHQL_PORT = import.meta.env.VITE_GRAPHQL_PORT || '3000';

// ============================================================
// ESTADOS (constantes como readonly tuples para type safety)
// ============================================================

export const ESTADOS_RESERVA = [
  'pendiente',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'no_show'
] as const;

export const ESTADOS_MESA = [
  'disponible',
  'ocupada',
  'reservada',
  'mantenimiento',
  'libre',
  'limpieza'
] as const;

export const ESTADOS_FILA = [
  'esperando',
  'llamado',
  'confirmado',
  'cancelado'
] as const;

// ============================================================
// HORARIOS
// ============================================================

export const HORARIO_APERTURA = '11:00';
export const HORARIO_CIERRE = '22:00';
export const DURACION_RESERVA_MINUTOS = 120;

// Genera lista de horarios disponibles para reservas
export const HORARIOS_RESERVA = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
] as const;

// ============================================================
// CONFIGURACIÓN DE INTERVALOS
// ============================================================

export const INTERVALO_ACTUALIZACION_DASHBOARD = 30000; // 30 segundos
export const INTERVALO_ACTUALIZACION_REPORTES = 10000; // 10 segundos
export const INTERVALO_VERIFICAR_RESERVAS = 60000; // 1 minuto
export const WEBSOCKET_RECONNECT_INTERVAL = 5000; // 5 segundos

// ============================================================
// LÍMITES Y VALIDACIONES
// ============================================================

export const MAX_PERSONAS_RESERVA = 10;
export const MIN_PERSONAS_RESERVA = 1;
export const MAX_ALERTAS_DASHBOARD = 10;

// ============================================================
// COLORES Y ESTILOS
// ============================================================

export const COLORES_ESTADO_MESA = {
  disponible: '#10b981', // green
  libre: '#10b981',
  ocupada: '#ef4444', // red
  reservada: '#f59e0b', // amber
  mantenimiento: '#6b7280', // gray
  limpieza: '#8b5cf6' // purple
} as const;

export const COLORES_ESTADO_RESERVA = {
  pendiente: '#f59e0b',
  confirmada: '#10b981',
  en_curso: '#3b82f6',
  completada: '#6b7280',
  cancelada: '#ef4444',
  no_show: '#991b1b'
} as const;

// ============================================================
// MENSAJES
// ============================================================

export const MENSAJES = {
  ERROR_CONEXION: 'Error de conexión. Verifica tu red e intenta de nuevo.',
  ERROR_SERVIDOR: 'Error del servidor. Intenta más tarde.',
  ERROR_VALIDACION: 'Por favor completa todos los campos requeridos.',
  EXITO_RESERVA: '¡Reserva creada exitosamente!',
  EXITO_ACTUALIZACION: 'Actualización realizada correctamente.',
  CARGANDO: 'Cargando...',
} as const;

// ============================================================
// STORAGE KEYS
// ============================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  ALERTAS: 'alertas_dashboard',
} as const;
