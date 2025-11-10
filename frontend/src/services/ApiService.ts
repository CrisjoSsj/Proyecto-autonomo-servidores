// Configuración base de la API
const API_BASE_URL = 'http://localhost:8000';

// Clase para manejar las llamadas API
class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Método genérico para hacer peticiones
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
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
        let body: any = null;
        try {
          body = isJson ? await response.json() : await response.text();
        } catch (readErr) {
          body = `Could not read response body: ${readErr}`;
        }
        const err = new Error(`HTTP ${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
        console.error(`Error en petición a ${endpoint}:`, err);
        throw err;
      }

      return isJson ? await response.json() : await response.text();
    } catch (error) {
      console.error(`Error en petición a ${endpoint}:`, error);
      throw error;
    }
  }

  // --- MÉTODOS QUE COINCIDEN CON TU API REST PYTHON ---
  
  // Restaurante
  async getRestaurantes() {
    return this.request('/restaurantes');
  }

  async crearRestaurante(restauranteData: any) {
    return this.request('/restaurante/', {
      method: 'POST',
      body: JSON.stringify(restauranteData),
    });
  }

  // Categorias del Menú
  async getCategorias() {
    return this.request('/categorias/');
  }

  async crearCategoria(categoriaData: any) {
    return this.request('/categoria/', {
      method: 'POST',
      body: JSON.stringify(categoriaData),
    });
  }

  // Menú
  async getMenus() {
    return this.request('/menu/');
  }

  async crearMenu(menuData: any) {
    return this.request('/menu/', {
      method: 'POST',
      body: JSON.stringify(menuData),
    });
  }

  // Platos
  async getPlatos() {
    return this.request('/platos/');
  }

  async crearPlato(platoData: any) {
    return this.request('/platos/', {
      method: 'POST',
      body: JSON.stringify(platoData),
    });
  }

  async buscarPlatos(query: string) {
    return this.request(`/platos/buscar?query=${query}`);
  }

  // Mesas
  async getMesas() {
    const data = await this.request('/mesas/');
    // Mapear la forma del backend (id_mesa) a la forma que el frontend espera
    return (data || []).map((m: any) => ({
      id: m.id_mesa ?? m.id ?? Math.floor(Math.random() * 1000000),
      numero: m.numero,
      capacidad: m.capacidad,
      estado: m.estado ?? m.estado_mesa ?? 'libre',
      ubicacion: m.ubicacion ?? ''
    }));
  }

  async crearMesa(mesaData: any) {
    // Alinear la forma de la UI con lo que espera el backend
    // Obtener mesas actuales para generar id_mesa si no se provee
    const existing: any[] = await this.request('/mesas/');
    const maxId = (existing || []).reduce((acc, cur) => {
      const id = cur.id_mesa ?? cur.id ?? 0;
      return id > acc ? id : acc;
    }, 0);

    const backendPayload = {
      id_mesa: mesaData.id ?? maxId + 1,
      numero: mesaData.numero,
      capacidad: mesaData.capacidad,
      estado: mesaData.estado ?? 'libre'
    };

    const created = await this.request('/mesa/', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });

    // Mapear respuesta a la forma frontend
    return {
      id: created.id_mesa ?? created.id ?? backendPayload.id_mesa,
      numero: created.numero ?? backendPayload.numero,
      capacidad: created.capacidad ?? backendPayload.capacidad,
      estado: created.estado ?? backendPayload.estado,
      ubicacion: created.ubicacion ?? ''
    };
  }

  async actualizarMesa(mesaData: any) {
    const backendPayload = {
      id_mesa: mesaData.id ?? mesaData.id_mesa,
      numero: mesaData.numero,
      capacidad: mesaData.capacidad,
      estado: mesaData.estado ?? 'libre'
    };

    const updated = await this.request('/mesa/', {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    });

    const source = updated?.mesa ?? updated ?? backendPayload;

    return {
      id: source.id_mesa ?? source.id ?? backendPayload.id_mesa,
      numero: source.numero ?? backendPayload.numero,
      capacidad: source.capacidad ?? backendPayload.capacidad,
      estado: source.estado ?? backendPayload.estado,
      ubicacion: source.ubicacion ?? mesaData.ubicacion ?? ''
    };
  }

  async eliminarMesa(idMesa: number) {
    return this.request(`/mesa/${idMesa}`, {
      method: 'DELETE',
    });
  }

  // Clientes
  async getClientes() {
    return this.request('/clientes/');
  }

  async crearCliente(clienteData: any) {
    return this.request('/cliente/', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  }

  async buscarClientes(query: string) {
    return this.request(`/cliente/buscar?query=${query}`);
  }

  // Reservas
  async getReservas() {
    return this.request('/reservas/');
  }

  async crearReserva(reservaData: any) {
    return this.request('/reserva/', {
      method: 'POST',
      body: JSON.stringify(reservaData),
    });
  }

  async buscarReservas(query: string) {
    return this.request(`/reservas/buscar?query=${query}`);
  }

  // Fila Virtual
  async getFilaVirtual() {
    const data = await this.request('/filas/');
    // Mapear la forma del backend a la forma que espera el frontend
    return (data || []).map((f: any, idx: number) => ({
      id: f.id_fila ?? f.id ?? idx,
      nombre: f.nombre ?? `Cliente ${f.id_cliente ?? f.id_fila ?? idx}`,
      telefono: f.telefono ?? '',
      numeroPersonas: f.numero_personas ?? f.numeroPersonas ?? 2,
      posicion: f.posicion ?? (idx + 1),
      tiempoEstimado: (() => {
        const raw = f.tiempo_espera ?? f.tiempoEstimado ?? '15';
        const n = String(raw).match(/\d+/)?.[0];
        return n ? parseInt(n, 10) : 15;
      })(),
    }));
  }

  // Alias para compatibilidad con componentes
  async getFilas() {
    // Reusar la versión mapeada
    return this.getFilaVirtual();
  }

  async unirseFilaVirtual(filaData: any) {
    // Dejar que el backend genere id_fila y posicion; enviar solo datos relevantes
    const backendPayload = {
      id_cliente: filaData.cliente_id ?? filaData.id_cliente ?? Math.floor(Math.random() * 1000000),
      tiempo_espera: filaData.tiempo_espera ?? `${(filaData.numeroPersonas ?? filaData.numero_personas ?? 1) * 15} min`,
      estado: filaData.estado ?? 'esperando'
    };

    const created = await this.request('/fila/', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });

    // Mapear la respuesta del backend a la forma del frontend
    return {
      id: created.id_fila ?? created.id,
      nombre: filaData.nombre ?? `Cliente ${backendPayload.id_cliente}`,
      telefono: filaData.telefono ?? '',
      numeroPersonas: filaData.numeroPersonas ?? filaData.numero_personas ?? 2,
      posicion: created.posicion,
      tiempoEstimado: (() => {
        const raw = created.tiempo_espera ?? backendPayload.tiempo_espera ?? '15';
        const n = String(raw).match(/\d+/)?.[0];
        return n ? parseInt(n, 10) : 15;
      })(),
    };
  }

  // Alias para compatibilidad con componentes
  async crearFila(filaData: any) {
    // Reusar la lógica de unirseFilaVirtual que ya normaliza y mapea la respuesta
    return this.unirseFilaVirtual(filaData);
  }

  async buscarFilaVirtual(query: string) {
    return this.request(`/fila/buscar?query=${query}`);
  }

  // Autenticación
  async login(username: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: username,
        password: password,
      }),
    });
    
    // Guardar token en localStorage
    if (response.access_token) {
      localStorage.setItem('authToken', response.access_token);
    }
    
    return response;
  }

  async logout() {
    localStorage.removeItem('authToken');
  }

  async getCurrentUser() {
    return this.request('/auth/users/me');
  }

  async registerUser(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Usuarios
  async getUsers() {
    return this.request('/users/');
  }

  async crearUser(userData: any) {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async buscarUsers(query: string) {
    return this.request(`/users/buscar?query=${query}`);
  }
}

// Instancia global del servicio API
export const apiService = new ApiService();
export default ApiService;