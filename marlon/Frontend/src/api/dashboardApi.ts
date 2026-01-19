import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  withCredentials: true,
});

export class DashboardApiService {
  /**
   * 💰 OBTENER KPIs CRÍTICOS DEL NEGOCIO
   */
  static async getBusinessKPIs(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/kpis');
      return response.data;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return {
        ingresos_totales: 0,
        ingresos_promedio_reserva: 0,
        reservas_confirmadas: 0,
        reservas_pendientes: 0,
        reservas_canceladas: 0,
        reservas_totales: 0,
        tasa_conversion: 0,
        tasa_cancelacion: 0,
        satisfaccion_promedio: 0,
        calificaciones_totales: 0,
        servicios_totales: 0,
        clientes_totales: 0,
        proveedores_totales: 0,
      };
    }
  }

  /**
   * 💼 OBTENER ANÁLISIS DE SERVICIOS
   */
  static async getServiciosAnalisis(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/servicios/analisis');
      return response.data;
    } catch (error) {
      console.error('Error fetching servicios analysis:', error);
      return {
        total_servicios: 0,
        top_servicios: [],
        servicios_por_categoria: {},
      };
    }
  }

  /**
   * 👥 OBTENER ANÁLISIS DE PROVEEDORES
   */
  static async getProveedoresAnalisis(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/proveedores/analisis');
      return response.data;
    } catch (error) {
      console.error('Error fetching proveedores analysis:', error);
      return {
        total_proveedores: 0,
        top_proveedores: [],
        proveedor_mejor_calificado: null,
      };
    }
  }

  /**
   * 📈 OBTENER FLUJO DE RESERVAS POR MES
   */
  static async getReservasFluj(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/reservas/flujo');
      return response.data;
    } catch (error) {
      console.error('Error fetching reservas flujo:', error);
      return [];
    }
  }

  /**
   * 💰 OBTENER INGRESOS POR MES
   */
  static async getIngresosPorMes(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/ingresos/mes');
      return response.data;
    } catch (error) {
      console.error('Error fetching ingresos por mes:', error);
      return [];
    }
  }

  /**
   * 📅 OBTENER FLUJO DE RESERVAS ANUAL
   */
  static async getFlujoReservasAnual(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/reservas/anual');
      return response.data;
    } catch (error) {
      console.error('Error fetching flujo anual:', error);
      return [];
    }
  }

  /**
   * 🔔 OBTENER ACTIVIDAD EN TIEMPO REAL
   */
  static async getActividadTiempoReal(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/actividad/tiempo-real');
      return response.data;
    } catch (error) {
      console.error('Error fetching actividad en tiempo real:', error);
      return [];
    }
  }

  /**
   * 📊 OBTENER RESERVAS DESGLOSADAS POR ESTADO
   */
  static async getReservasDesglosadas(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/reservas/desglosadas');
      return response.data;
    } catch (error) {
      console.error('Error fetching reservas desglosadas:', error);
      return null;
    }
  }

  /**
   * 💹 OBTENER PROYECCIÓN DE INGRESOS
   */
  static async getProyeccionIngresos(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/proyeccion/ingresos');
      return response.data;
    } catch (error) {
      console.error('Error fetching proyección de ingresos:', error);
      return null;
    }
  }

  /**
   * Obtiene el resumen del dashboard con métricas en tiempo real
   */
  static async getDashboardSummary(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen del dashboard:', error);
      return {};
    }
  }

  /**
   * Obtiene estadísticas detalladas (servicios, clientes, reservas, calificaciones)
   */
  static async getDashboardStats(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      return {};
    }
  }

  /**
   * Obtiene el estado de la plataforma
   */
  static async getPlatformStatus(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/status');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estado de la plataforma:', error);
      return {};
    }
  }

  /**
   * Obtiene métricas del WebSocket
   */
  static async getMetrics(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/metrics');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      return {};
    }
  }

  /**
   * Obtiene clientes conectados
   */
  static async getConnectedClients(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/clients');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo clientes conectados:', error);
      return [];
    }
  }

  /**
   * Obtiene salas activas
   */
  static async getRooms(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/rooms');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo salas:', error);
      return [];
    }
  }

  /**
   * Obtiene eventos recientes
   */
  static async getRecentEvents(limit = 50): Promise<any> {
    try {
      const response = await apiClient.get(`/dashboard/events?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo eventos recientes:', error);
      return [];
    }
  }

  /**
   * Obtiene estado de salud del API
   */
  static async getApiStatus(): Promise<any> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estado del API:', error);
      return {};
    }
  }
}
