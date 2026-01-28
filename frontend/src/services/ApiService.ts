/**
 * ApiService.ts
 * Servicio centralizado para comunicación con la API REST Python
 */

import type {
  Mesa,
  MesaBackend,
  MesaFormData,
  Reserva,
  ReservaCreate,
  PersonaFila,
  PersonaFilaCreate,
  Cliente,
  Restaurante,
  Categoria,
  Plato,
  Menu,
  User,
  UserCreate,
  LoginResponse,
  EstadisticasMesas,
  EstadisticasReservas,
  EstadisticasFila,
  DisponibilidadResponse,
  VerificacionDisponibilidad,
  ReservasHoy,
  Payment,
  CreatePaymentRequest,
  PaymentResponse,
} from '../types';

// Configuración base de la API
const API_BASE_URL = 'http://localhost:8000';
const PAYMENT_SERVICE_URL = 'http://localhost:8002';

// Clase para manejar las llamadas API
class ApiService {
  private baseURL: string;
  private paymentServiceURL: string;

  constructor(baseURL: string = API_BASE_URL, paymentServiceURL: string = PAYMENT_SERVICE_URL) {
    this.baseURL = baseURL;
    this.paymentServiceURL = paymentServiceURL;
  }

  // Método genérico para hacer peticiones
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Agregar token de autenticación si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!response.ok) {
        // Intentar leer el cuerpo para dar más contexto en el error
        let body: unknown = null;
        try {
          body = isJson ? await response.json() : await response.text();
        } catch (readErr) {
          body = `Could not read response body: ${readErr}`;
        }
        const err = new Error(`HTTP ${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
        console.error(`Error en petición a ${endpoint}:`, err);
        throw err;
      }

      return (isJson ? await response.json() : await response.text()) as T;
    } catch (error) {
      console.error(`Error en petición a ${endpoint}:`, error);
      throw error;
    }
  }

  // --- MÉTODOS QUE COINCIDEN CON TU API REST PYTHON ---
  
  // Restaurante
  async getRestaurantes(): Promise<Restaurante[]> {
    return this.request<Restaurante[]>('/restaurantes');
  }

  async crearRestaurante(restauranteData: Partial<Restaurante>): Promise<Restaurante> {
    return this.request<Restaurante>('/restaurante/', {
      method: 'POST',
      body: JSON.stringify(restauranteData),
    });
  }

  // Categorias del Menú
  async getCategorias(): Promise<Categoria[]> {
    return this.request<Categoria[]>('/categorias/');
  }

  async crearCategoria(categoriaData: Partial<Categoria>): Promise<Categoria> {
    return this.request<Categoria>('/categoria/', {
      method: 'POST',
      body: JSON.stringify(categoriaData),
    });
  }

  // Menú
  async getMenus(): Promise<Menu[]> {
    return this.request<Menu[]>('/menu/');
  }

  async crearMenu(menuData: Partial<Menu>): Promise<Menu> {
    return this.request<Menu>('/menu/', {
      method: 'POST',
      body: JSON.stringify(menuData),
    });
  }

  // Platos
  async getPlatos(): Promise<Plato[]> {
    return this.request<Plato[]>('/platos/');
  }

  async crearPlato(platoData: Partial<Plato>): Promise<Plato> {
    return this.request<Plato>('/platos/', {
      method: 'POST',
      body: JSON.stringify(platoData),
    });
  }

  async buscarPlatos(query: string): Promise<Plato[]> {
    return this.request<Plato[]>(`/platos/buscar?query=${query}`);
  }

  // Mesas
  async getMesas(): Promise<Mesa[]> {
    const data = await this.request<MesaBackend[]>('/mesas/');
    // Mapear la forma del backend (id_mesa) a la forma que el frontend espera
    return (data || []).map((m) => ({
      id: m.id_mesa ?? Math.floor(Math.random() * 1000000),
      id_mesa: m.id_mesa,
      numero: m.numero,
      capacidad: m.capacidad,
      estado: (m.estado ?? 'libre') as Mesa['estado'],
      ubicacion: ''
    }));
  }

  async crearMesa(mesaData: MesaFormData & { id?: number }): Promise<Mesa> {
    // Alinear la forma de la UI con lo que espera el backend
    // Obtener mesas actuales para generar id_mesa si no se provee
    const existing = await this.request<MesaBackend[]>('/mesas/');
    const maxId = (existing || []).reduce((acc, cur) => {
      const id = cur.id_mesa ?? 0;
      return id > acc ? id : acc;
    }, 0);

    const backendPayload: MesaBackend = {
      id_mesa: mesaData.id ?? maxId + 1,
      numero: mesaData.numero,
      capacidad: mesaData.capacidad,
      estado: mesaData.estado ?? 'libre'
    };

    const created = await this.request<MesaBackend>('/mesa/', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });

    // Mapear respuesta a la forma frontend
    return {
      id: created.id_mesa ?? backendPayload.id_mesa,
      id_mesa: created.id_mesa ?? backendPayload.id_mesa,
      numero: created.numero ?? backendPayload.numero,
      capacidad: created.capacidad ?? backendPayload.capacidad,
      estado: (created.estado ?? backendPayload.estado) as Mesa['estado'],
      ubicacion: ''
    };
  }

  async actualizarMesa(mesaData: Mesa): Promise<Mesa> {
    const backendPayload: MesaBackend = {
      id_mesa: mesaData.id ?? mesaData.id_mesa ?? 0,
      numero: mesaData.numero,
      capacidad: mesaData.capacidad,
      estado: mesaData.estado ?? 'libre'
    };

    const response = await this.request<{ mesa?: MesaBackend } & MesaBackend>('/mesa/', {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    });

    const source = response?.mesa ?? response ?? backendPayload;

    return {
      id: source.id_mesa ?? backendPayload.id_mesa,
      id_mesa: source.id_mesa ?? backendPayload.id_mesa,
      numero: source.numero ?? backendPayload.numero,
      capacidad: source.capacidad ?? backendPayload.capacidad,
      estado: (source.estado ?? backendPayload.estado) as Mesa['estado'],
      ubicacion: mesaData.ubicacion ?? ''
    };
  }

  async eliminarMesa(idMesa: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/mesa/${idMesa}`, {
      method: 'DELETE',
    });
  }

  // Clientes
  async getClientes(): Promise<Cliente[]> {
    return this.request<Cliente[]>('/clientes/');
  }

  async crearCliente(clienteData: Partial<Cliente>): Promise<Cliente> {
    return this.request<Cliente>('/cliente/', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  }

  async buscarClientes(query: string): Promise<Cliente[]> {
    return this.request<Cliente[]>(`/cliente/buscar?query=${query}`);
  }

  // Reservas
  async getReservas(): Promise<Reserva[]> {
    return this.request<Reserva[]>('/reservas/');
  }

  async crearReserva(reservaData: ReservaCreate): Promise<Reserva> {
    return this.request<Reserva>('/reserva/', {
      method: 'POST',
      body: JSON.stringify(reservaData),
    });
  }

  async actualizarReserva(reservaData: Reserva): Promise<Reserva> {
    return this.request<Reserva>('/reserva/', {
      method: 'PUT',
      body: JSON.stringify(reservaData),
    });
  }

  async buscarReservas(query: string): Promise<Reserva[]> {
    return this.request<Reserva[]>(`/reservas/buscar?query=${query}`);
  }

  // Fila Virtual
  async getFilaVirtual(): Promise<PersonaFila[]> {
    const data = await this.request<PersonaFila[]>('/fila-virtual/');
    // Mapear la respuesta del endpoint nuevo que ya tiene todos los campos
    return (data || []).map((f, idx) => ({
      id: f.id ?? idx,
      nombre: f.nombre ?? `Cliente ${f.cliente_id ?? f.id ?? idx}`,
      telefono: f.telefono ?? '',
      numeroPersonas: f.numeroPersonas ?? 2,
      posicion: f.posicion ?? (idx + 1),
      tiempoEstimado: f.tiempoEstimado ?? 15,
    }));
  }

  // Alias para compatibilidad con componentes
  async getFilas(): Promise<PersonaFila[]> {
    // Reusar la versión mapeada
    return this.getFilaVirtual();
  }

  async unirseFilaVirtual(filaData: PersonaFilaCreate): Promise<PersonaFila> {
    // Usar el endpoint nuevo que soporta todos los campos
    const backendPayload = {
      cliente_id: filaData.cliente_id ?? Math.floor(Math.random() * 1000000),
      nombre: filaData.nombre ?? `Cliente ${Math.floor(Math.random() * 1000)}`,
      telefono: filaData.telefono ?? '',
      numeroPersonas: filaData.numeroPersonas ?? 1,
      hora_llegada: filaData.hora_llegada ?? new Date().toISOString(),
      estado: filaData.estado ?? 'esperando'
    };

    const created = await this.request<PersonaFila>('/fila-virtual/', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });

    // La respuesta ya tiene todos los campos del modelo nuevo
    return {
      id: created.id,
      nombre: created.nombre,
      telefono: created.telefono,
      numeroPersonas: created.numeroPersonas,
      posicion: created.posicion,
      tiempoEstimado: created.tiempoEstimado,
    };
  }

  // Alias para compatibilidad con componentes
  async crearFila(filaData: PersonaFilaCreate): Promise<PersonaFila> {
    // Reusar la lógica de unirseFilaVirtual que ya normaliza y mapea la respuesta
    return this.unirseFilaVirtual(filaData);
  }

  async buscarFilaVirtual(query: string): Promise<PersonaFila[]> {
    return this.request<PersonaFila[]>(`/fila/buscar?query=${query}`);
  }

  async eliminarFilaVirtual(idFila: number): Promise<{ mensaje: string }> {
    return this.request<{ mensaje: string }>(`/fila-virtual/${idFila}`, {
      method: 'DELETE',
    });
  }

  // Autenticación
  async login(email: string, password: string, isAdmin: boolean = true): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: password,
        is_admin: isAdmin
      }),
    });
    
    // Guardar token y datos del usuario en localStorage
    if (response.access_token) {
      localStorage.setItem('authToken', response.access_token);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    
    return response;
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/users/me');
  }

  async registerUser(userData: UserCreate): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Usuarios
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users/');
  }

  async crearUser(userData: UserCreate): Promise<User> {
    return this.request<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async buscarUsers(query: string): Promise<User[]> {
    return this.request<User[]>(`/users/buscar?query=${query}`);
  }

  // ===== ESTADÍSTICAS Y MÉTRICAS =====

  // Estadísticas de reservas
  async getEstadisticasReservas(): Promise<EstadisticasReservas> {
    return this.request<EstadisticasReservas>('/reservas/estadisticas');
  }

  // Reservas del día
  async getReservasHoy(): Promise<ReservasHoy> {
    return this.request<ReservasHoy>('/reservas/hoy');
  }

  // Disponibilidad de mesas para reservas
  async getDisponibilidad(fecha: string, personas: number = 2): Promise<DisponibilidadResponse> {
    return this.request<DisponibilidadResponse>(`/reservas/disponibilidad?fecha=${fecha}&personas=${personas}`);
  }

  // Verificar disponibilidad específica
  async verificarDisponibilidad(mesaId: number, fecha: string, horaInicio: string): Promise<VerificacionDisponibilidad> {
    return this.request<VerificacionDisponibilidad>(`/reservas/verificar-disponibilidad?mesa_id=${mesaId}&fecha=${fecha}&hora_inicio=${horaInicio}`);
  }

  // Cambiar estado de reserva
  async cambiarEstadoReserva(idReserva: number, nuevoEstado: string): Promise<{ message: string; reserva: Reserva }> {
    return this.request<{ message: string; reserva: Reserva }>(`/reserva/${idReserva}/estado?nuevo_estado=${nuevoEstado}`, {
      method: 'PUT',
    });
  }

  // Estadísticas de mesas
  async getEstadisticasMesas(): Promise<EstadisticasMesas> {
    return this.request<EstadisticasMesas>('/mesas/estadisticas');
  }

  // Cambiar estado de mesa
  async cambiarEstadoMesa(idMesa: number, nuevoEstado: string): Promise<{ message: string; mesa: Mesa }> {
    return this.request<{ message: string; mesa: Mesa }>(`/mesa/${idMesa}/estado?nuevo_estado=${nuevoEstado}`, {
      method: 'PUT',
    });
  }

  // Estadísticas de fila virtual
  async getEstadisticasFilaVirtual(): Promise<EstadisticasFila> {
    return this.request<EstadisticasFila>('/fila-virtual/estadisticas/resumen');
  }

  // Llamar siguiente en fila
  async llamarSiguienteEnFila(): Promise<{ mensaje: string; persona: PersonaFila }> {
    return this.request<{ mensaje: string; persona: PersonaFila }>('/fila-virtual/admin/llamar-siguiente', {
      method: 'POST',
    });
  }

  // ===== PAGOS =====

  // Crear un nuevo pago
  async createPayment(paymentData: CreatePaymentRequest): Promise<PaymentResponse> {
    const url = `${this.paymentServiceURL}/payments/create`;
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    };

    // Agregar token si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Error al crear el pago');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creando pago:', error);
      throw error;
    }
  }

  // Obtener un pago por ID
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    const url = `${this.paymentServiceURL}/payments/${paymentId}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Agregar token si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Error al obtener el pago');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo pago:', error);
      throw error;
    }
  }

  // Listar todos los pagos
  async listPayments(skip: number = 0, limit: number = 20, statusFilter?: string): Promise<PaymentResponse[]> {
    let url = `${this.paymentServiceURL}/payments/?skip=${skip}&limit=${limit}`;
    
    if (statusFilter) {
      url += `&status_filter=${statusFilter}`;
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Agregar token si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Error al listar pagos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error listando pagos:', error);
      throw error;
    }
  }

  // Reembolsar un pago
  async refundPayment(paymentId: string): Promise<{ success: boolean; payment_id: string; status: string; message?: string }> {
    const url = `${this.paymentServiceURL}/payments/${paymentId}/refund`;
    
    console.log('🔄 [ApiService] - Iniciando reembolso para pago:', paymentId);
    console.log('🔄 [ApiService] - URL de reembolso:', url);
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Agregar token si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      console.log('🔄 [ApiService] - Respuesta del servidor (status):', response.status);
      
      const responseData = await response.json();
      console.log('🔄 [ApiService] - Datos de respuesta:', responseData);
      
      if (!response.ok) {
        const errorMsg = responseData.detail || responseData.message || 'Error al reembolsar el pago';
        console.error('❌ [ApiService] - Error en respuesta:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ [ApiService] - Reembolso completado exitosamente');
      return responseData;
    } catch (error) {
      const errorMsg = (error as Error).message || 'Error desconocido al reembolsar';
      console.error('❌ [ApiService] - Error reembolsando pago:', errorMsg, error);
      throw new Error(errorMsg);
    }
  }
}

// Instancia global del servicio API
export const apiService = new ApiService();
export default ApiService;
