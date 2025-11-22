// Servicio de autenticación para manejar el estado de sesión
import { apiService } from './ApiService';

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

class AuthService {
  private user: User | null = null;

  constructor() {
    // Cargar usuario del localStorage al inicializar
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        console.error('Error al cargar usuario del localStorage:', e);
        this.user = null;
      }
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await apiService.login(email, password, true);
      
      if (response.access_token && response.user) {
        this.user = response.user as User;
        return {
          user: this.user,
          token: response.access_token
        };
      }
      
      throw new Error('Respuesta de login inválida');
    } catch (error: any) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    apiService.logout();
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token && !!this.user;
  }

  getUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }

      await apiService.getCurrentUser();
      return true;
    } catch (error) {
      console.error('Error verificando token:', error);
      this.logout();
      return false;
    }
  }
}

// Instancia global del servicio de autenticación
export const authService = new AuthService();
export default AuthService;

