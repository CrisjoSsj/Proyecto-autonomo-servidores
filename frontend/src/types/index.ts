/**
 * Tipos compartidos para la aplicación del restaurante
 * Centraliza todas las interfaces y tipos del dominio
 */

// ============================================================
// ESTADOS (Union Types)
// ============================================================

export type MesaEstado = 'disponible' | 'ocupada' | 'reservada' | 'mantenimiento' | 'libre';

export type ReservaEstado = 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_show';

export type FilaEstado = 'esperando' | 'llamado' | 'confirmado' | 'cancelado';

// ============================================================
// ENTIDADES PRINCIPALES
// ============================================================

export interface Mesa {
  id: number;
  id_mesa?: number;
  numero: number;
  capacidad: number;
  estado: MesaEstado;
  ubicacion?: string;
}

export interface MesaBackend {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
}

export interface Reserva {
  id_reserva?: number;
  id?: number;
  id_cliente?: number;
  id_mesa: number;
  fecha: string;
  hora_inicio: string;
  hora_fin?: string;
  estado: ReservaEstado | string;
  nombre?: string;
  telefono?: string;
  email?: string;
  numero_personas?: number;
  ocasion_especial?: string;
  comentarios?: string;
}

export interface ReservaCreate {
  id_cliente?: number;
  id_mesa: number;
  fecha: string;
  hora_inicio: string;
  hora_fin?: string;
  estado?: string;
  nombre: string;
  telefono: string;
  email: string;
  numero_personas: number;
  ocasion_especial?: string;
  comentarios?: string;
}

export interface PersonaFila {
  id: number;
  cliente_id?: number;
  nombre: string;
  telefono: string;
  numeroPersonas: number;
  posicion: number;
  tiempoEstimado: number;
  hora_llegada?: string;
  estado?: FilaEstado;
}

export interface PersonaFilaCreate {
  cliente_id?: number;
  nombre: string;
  telefono: string;
  numeroPersonas: number;
  hora_llegada?: string;
  estado?: string;
}

export interface Cliente {
  id_cliente?: number;
  nombre: string;
  telefono: string;
  email: string;
}

export interface Restaurante {
  id?: number;
  nombre: string;
  direccion: string;
  telefono: string;
  horario?: string;
  capacidadTotal?: number;
}

export interface Categoria {
  id_categoria?: number;
  nombre: string;
  descripcion?: string;
}

export interface Plato {
  id_plato?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria_id?: number;
  disponible?: boolean;
  imagen?: string;
}

export interface Menu {
  id_menu?: number;
  nombre: string;
  descripcion?: string;
  platos?: Plato[];
}

// ============================================================
// AUTENTICACIÓN
// ============================================================

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  username?: string;
  full_name?: string;
  telefono?: string;
  disabled?: boolean;
}

export interface UserCreate {
  username: string;
  full_name: string;
  email: string;
  telefono: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  is_admin?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ============================================================
// ESTADÍSTICAS Y MÉTRICAS
// ============================================================

export interface EstadisticasMesas {
  total: number;
  disponibles: number;
  ocupadas: number;
  reservadas: number;
  mantenimiento?: number;
  capacidad_total?: number;
  capacidad_disponible?: number;
}

export interface EstadisticasReservas {
  total_reservas?: number;
  reservas_hoy: number;
  pendientes_hoy: number;
  confirmadas_hoy: number;
  en_curso: number;
  completadas_hoy: number;
  canceladas_hoy?: number;
  no_show_hoy?: number;
  estados_validos?: string[];
}

export interface EstadisticasFila {
  total_esperando: number;
  total_llamados?: number;
  tiempo_espera_maximo: number;
  promedio_personas_por_grupo?: number;
  ultimo_actualizado?: string;
}

export interface ReservasHoy {
  fecha: string;
  total: number;
  por_estado: Record<string, number>;
  reservas: Reserva[];
}

// ============================================================
// DISPONIBILIDAD
// ============================================================

export interface MesaDisponible {
  mesa_id: number;
  numero: number;
  capacidad: number;
  horarios_disponibles: string[];
}

export interface DisponibilidadResponse {
  fecha: string;
  personas: number;
  mesas_disponibles: MesaDisponible[];
  total_opciones: number;
}

export interface VerificacionDisponibilidad {
  disponible: boolean;
  mensaje: string;
  conflicto?: {
    reserva_existente: number;
    hora_inicio: string;
    hora_fin: string;
    nombre?: string;
  };
  hora_fin_estimada?: string;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface DashboardData {
  totalReservas?: number;
  reservasPorMes?: { mes: string; total: number }[];
  mesasPopulares?: { mesaId: number; usos: number }[];
  platosPopulares?: { platoId: number; nombre: string; pedidos: number }[];
}

export interface Alerta {
  id: string;
  tipo: 'reserva' | 'fila' | 'mesa' | 'inventario';
  titulo: string;
  mensaje: string;
  urgencia: 'urgente' | 'importante' | 'informativa';
  timestamp: string;
  datos?: unknown;
  resuelta: boolean;
}

// ============================================================
// WEBSOCKET
// ============================================================

export type WebSocketChannel = 'fila_virtual' | 'mesas' | 'reservas';

export interface WebSocketMessage {
  channel: WebSocketChannel;
  action: string;
  data: unknown;
}

export type MessageCallback = (message: WebSocketMessage) => void;

// ============================================================
// RESPUESTAS DE API
// ============================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string | Record<string, unknown>;
}

// ============================================================
// FORMULARIOS
// ============================================================

export interface ReservaFormData {
  nombre: string;
  telefono: string;
  email: string;
  id_cliente?: number;
  id_mesa: number | string;
  fecha: string;
  hora_inicio: string;
  numero_personas: number;
  ocasion_especial?: string;
  comentarios?: string;
}

export interface FilaFormData {
  nombre: string;
  telefono: string;
  numeroPersonas: number;
}

export interface MesaFormData {
  numero: number;
  capacidad: number;
  estado: MesaEstado;
  ubicacion?: string;
}

// ============================================================
// EVENTOS
// ============================================================

export type FormChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
export type FormSubmitEvent = React.FormEvent<HTMLFormElement>;
