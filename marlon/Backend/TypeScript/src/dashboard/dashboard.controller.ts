import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';
import { DashboardService } from './dashboard.service';
import { BusinessEvent } from '../websocket/types';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private websocketService: WebSocketService,
    private dashboardService: DashboardService,
  ) {}

  @Get()
  async getDashboardSummary() {
    return this.websocketService.getDashboardSummary();
  }

  @Get('/stats')
  async getStats() {
    return await this.dashboardService.getDashboardStats();
  }

  /**
   * 📊 KPIs CRÍTICOS - Métricas principales del negocio
   */
  @Get('/kpis')
  async getKPIs() {
    return await this.dashboardService.getBusinessKPIs();
  }

  /**
   * 💼 ANÁLISIS DE SERVICIOS
   */
  @Get('/servicios/analisis')
  async getServiciosAnalisis() {
    return await this.dashboardService.getServiciosAnalisis();
  }

  /**
   * 👥 ANÁLISIS DE PROVEEDORES
   */
  @Get('/proveedores/analisis')
  async getProveedoresAnalisis() {
    return await this.dashboardService.getProveedoresAnalisis();
  }

  /**
   * 📈 FLUJO DE RESERVAS POR MES
   */
  @Get('/reservas/flujo')
  async getReservasFluj() {
    return await this.dashboardService.getReservasFlujoPorMes();
  }

  /**
   * 💰 INGRESOS POR MES
   */
  @Get('/ingresos/mes')
  async getIngresosPorMes() {
    return await this.dashboardService.getIngresosPorMes();
  }

  /**
   * 📅 FLUJO DE RESERVAS ANUAL
   */
  @Get('/reservas/anual')
  async getFlujoReservasAnual() {
    return await this.dashboardService.getFlujoReservasAnual();
  }

  /**
   * 🔔 OBTENER ACTIVIDAD EN TIEMPO REAL
   */
  @Get('/actividad/tiempo-real')
  async getActividadTiempoReal() {
    return await this.dashboardService.getActividadTiempoReal();
  }

  /**
   * 📊 OBTENER RESERVAS DESGLOSADAS POR ESTADO
   */
  @Get('/reservas/desglosadas')
  async getReservasDesglosadas() {
    return await this.dashboardService.getReservasDesglosadas();
  }

  /**
   * 💹 PROYECCIÓN DE INGRESOS
   */
  @Get('/proyeccion/ingresos')
  async getProyeccionIngresos() {
    return await this.dashboardService.getProyeccionIngresos();
  }

  @Get('status')
  async getPlatformStatus() {
    return this.dashboardService.getPlatformStatus();
  }

  @Get('clients')
  async getConnectedClients() {
    return {
      clients: this.websocketService.getConnectedClients(),
    };
  }

  @Get('rooms')
  async getRooms() {
    return {
      rooms: this.websocketService.getRoomsList(),
    };
  }

  @Get('events')
  async getRecentEvents() {
    return {
      events: this.websocketService.getRecentEvents(50),
    };
  }

  @Get('metrics')
  async getMetrics() {
    return this.websocketService.getMetrics();
  }

  @Get('api-status')
  async getApiStatus() {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Endpoint para que la API REST envíe eventos al WebSocket
   * Esto será llamado desde Django cada vez que ocurra una acción importante
   */
  @Post('emit-event')
  @HttpCode(HttpStatus.ACCEPTED)
  async emitBusinessEvent(@Body() event: BusinessEvent) {
    try {
      this.websocketService.broadcastEvent(event);
      return {
        success: true,
        message: 'Evento emitido exitosamente',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error emitiendo evento',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint para que la API REST envíe actualizaciones del dashboard
   */
  @Post('update-dashboard')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateDashboard(@Body() data: any) {
    try {
      this.websocketService.broadcastDashboardUpdate(data);
      return {
        success: true,
        message: 'Dashboard actualizado',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error actualizando dashboard',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint para que la API REST envíe notificaciones a un rol específico
   */
  @Post('notify-role')
  @HttpCode(HttpStatus.ACCEPTED)
  async notifyRole(
    @Body() data: { role: 'cliente' | 'proveedor' | 'admin'; event: string; payload: any },
  ) {
    try {
      this.websocketService.emitToRole(data.role, data.event, data.payload);
      return {
        success: true,
        message: `Notificación enviada a ${data.role}s`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error enviando notificación',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint para que la API REST envíe notificaciones a un usuario específico
   */
  @Post('notify-user')
  @HttpCode(HttpStatus.ACCEPTED)
  async notifyUser(
    @Body() data: { userId: string; event: string; payload: any },
  ) {
    try {
      this.websocketService.emitToUser(data.userId, data.event, data.payload);
      return {
        success: true,
        message: `Notificación enviada al usuario ${data.userId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error enviando notificación',
        error: error.message,
      };
    }
  }
}
