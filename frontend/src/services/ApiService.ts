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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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
    return this.request('/mesas/');
  }

  async crearMesa(mesaData: any) {
    return this.request('/mesa/', {
      method: 'POST',
      body: JSON.stringify(mesaData),
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
    return this.request('/filas/');
  }

  // Alias para compatibilidad con componentes
  async getFilas() {
    return this.request('/filas/');
  }

  async unirseFilaVirtual(filaData: any) {
    return this.request('/fila/', {
      method: 'POST',
      body: JSON.stringify(filaData),
    });
  }

  // Alias para compatibilidad con componentes
  async crearFila(filaData: any) {
    return this.request('/fila/', {
      method: 'POST',
      body: JSON.stringify(filaData),
    });
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