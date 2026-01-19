import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  ReservasByMonth,
  ServiceStats,
  ClienteStats,
  BusinessEvent,
} from '../websocket/types';

/**
 * DASHBOARD CON LÓGICA DEL NEGOCIO REAL DE FindYourWork
 * Métricas enfocadas en KPIs reales de la plataforma de servicios
 */
@Injectable()
export class DashboardService {
  private djangoApiUrl = 'http://localhost:8000';
  private readonly apiTimeout = 5000;

  /**
   * 📊 KPIs CRÍTICOS - Métricas principales del negocio
   */
  async getBusinessKPIs() {
    try {
      const [reservas, calificaciones, servicios, clientes, proveedores] = 
        await Promise.all([
          axios.get(`${this.djangoApiUrl}/api_rest/api/v1/reserva/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
          axios.get(`${this.djangoApiUrl}/api_rest/api/v1/calificacion/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
          axios.get(`${this.djangoApiUrl}/api_rest/api/v1/servicio/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
          axios.get(`${this.djangoApiUrl}/api_rest/api/v1/cliente/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
          axios.get(`${this.djangoApiUrl}/api_rest/api/v1/proveedor/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
        ]);

      const reservasData = reservas.data || [];
      const calificacionesData = calificaciones.data || [];

      // 💰 INGRESOS: suma de total_estimado de todas las reservas confirmadas
      const ingresos_totales = reservasData
        .filter(r => r.estado === 'confirmada')
        .reduce((sum, r) => sum + (parseFloat(r.total_estimado) || 0), 0);

      // 📅 RESERVAS POR ESTADO - Core del negocio
      const reservas_confirmadas = reservasData.filter(r => r.estado === 'confirmada').length;
      const reservas_pendientes = reservasData.filter(r => r.estado === 'pendiente').length;
      const reservas_canceladas = reservasData.filter(r => r.estado === 'cancelada').length;

      // 📈 TASA DE CONVERSIÓN - Pendiente → Confirmada (indicador crítico)
      const tasa_conversion = reservasData.length > 0
        ? parseFloat(((reservas_confirmadas / reservasData.length) * 100).toFixed(1))
        : 0;

      // ⭐ SATISFACCIÓN DEL CLIENTE - Promedio de calificaciones
      const satisfaccion_promedio = calificacionesData.length > 0
        ? parseFloat((calificacionesData.reduce((sum, c) => sum + (c.puntuacion || 0), 0) / calificacionesData.length).toFixed(2))
        : 0;

      return {
        // KPIs Financieros
        ingresos_totales: parseFloat(ingresos_totales.toFixed(2)),
        ingresos_promedio_reserva: reservas_confirmadas > 0 
          ? (ingresos_totales / reservas_confirmadas).toFixed(2)
          : 0,

        // KPIs de Reservas
        reservas_confirmadas,
        reservas_pendientes,
        reservas_canceladas,
        reservas_totales: reservasData.length,
        tasa_conversion,
        tasa_cancelacion: reservasData.length > 0 
          ? parseFloat(((reservas_canceladas / reservasData.length) * 100).toFixed(1))
          : 0,

        // KPIs de Satisfacción
        satisfaccion_promedio,
        calificaciones_totales: calificacionesData.length,

        // Datos de Plataforma
        servicios_totales: servicios.data.length,
        clientes_totales: clientes.data.length,
        proveedores_totales: proveedores.data.length,
      };
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return this.getDefaultKPIs();
    }
  }

  /**
   * 💼 ANÁLISIS DE SERVICIOS - Qué servicios generan más demanda
   */
  async getServiciosAnalisis() {
    try {
      const [servicios, reservaServicio] = await Promise.all([
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/servicio/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/reservaServicio/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
      ]);

      const serviciosData = servicios.data || [];
      const reservasData = reservaServicio.data || [];

      // Contar reservas por servicio
      const reservasPorServicio: Record<number, number> = {};
      reservasData.forEach((r: any) => {
        r.reserva_servicios?.forEach((rs: any) => {
          const servicioId = rs.servicio_id;
          reservasPorServicio[servicioId] = (reservasPorServicio[servicioId] || 0) + 1;
        });
      });

      // Top servicios por demanda
      const topServicios = serviciosData
        .map((s: any) => ({
          id: s.id,
          nombre: s.nombre_servicio,
          reservas: reservasPorServicio[s.id] || 0,
          rating: s.rating_promedio || 0,
          precio: parseFloat(s.precio) || 0,
        }))
        .sort((a, b) => b.reservas - a.reservas)
        .slice(0, 10);

      // Servicios por categoría
      const serviciosPorCategoria: Record<string, number> = {};
      serviciosData.forEach((s: any) => {
        const cat = s.categoria_nombre || 'Sin categoría';
        serviciosPorCategoria[cat] = (serviciosPorCategoria[cat] || 0) + 1;
      });

      return {
        total_servicios: serviciosData.length,
        top_servicios: topServicios,
        servicios_por_categoria: serviciosPorCategoria,
        servicio_con_mas_demanda: topServicios[0] || null,
      };
    } catch (error) {
      console.error('Error analyzing services:', error);
      return { total_servicios: 0, top_servicios: [], servicios_por_categoria: {} };
    }
  }

  /**
   * 👥 ANÁLISIS DE PROVEEDORES - Top proveedores y performance
   */
  async getProveedoresAnalisis() {
    try {
      const [proveedores, servicios, calificaciones] = await Promise.all([
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/proveedor/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/servicio/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/calificacion/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
      ]);

      const proveedoresData = proveedores.data || [];
      const serviciosData = servicios.data || [];
      const calificacionesData = calificaciones.data || [];

      // Calcular rating promedio por proveedor
      const ratingPorProveedor: Record<number, { suma: number; count: number }> = {};
      
      calificacionesData.forEach((cal: any) => {
        const servicioId = cal.servicio_id;
        const servicio = serviciosData.find((s: any) => s.id === servicioId);
        if (servicio) {
          const proveedorId = servicio.proveedor_id;
          if (!ratingPorProveedor[proveedorId]) {
            ratingPorProveedor[proveedorId] = { suma: 0, count: 0 };
          }
          ratingPorProveedor[proveedorId].suma += cal.puntuacion || 0;
          ratingPorProveedor[proveedorId].count++;
        }
      });

      // Top proveedores
      const topProveedores = proveedoresData
        .map((p: any) => {
          const rating = ratingPorProveedor[p.id];
          const promedio = rating ? rating.suma / rating.count : 0;
          const serviciosCount = serviciosData.filter((s: any) => s.proveedor_id === p.id).length;
          
          return {
            id: p.id,
            nombre: p.usuario?.username || `Proveedor ${p.id}`,
            servicios: serviciosCount,
            rating_promedio: promedio,
            calificaciones: rating?.count || 0,
          };
        })
        .sort((a, b) => b.rating_promedio - a.rating_promedio)
        .slice(0, 5);

      return {
        total_proveedores: proveedoresData.length,
        top_proveedores: topProveedores,
        proveedor_mejor_calificado: topProveedores[0] || null,
      };
    } catch (error) {
      console.error('Error analyzing providers:', error);
      return { total_proveedores: 0, top_proveedores: [] };
    }
  }

  /**
   * 📊 FLUJO DE RESERVAS - Tendencia temporal
   */
  async getReservasFlujoPorMes(): Promise<ReservasByMonth[]> {
    try {
      const response = await axios.get(
        `${this.djangoApiUrl}/api_rest/api/v1/reserva/`,
        { timeout: this.apiTimeout },
      ).catch(() => ({ data: [] }));

      const reservas = response.data || [];
      const byMonth: Record<string, ReservasByMonth> = {};

      reservas.forEach((reserva: any) => {
        const fecha = new Date(reserva.fecha);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

        if (!byMonth[mesKey]) {
          byMonth[mesKey] = {
            mes: mesKey,
            total: 0,
            confirmadas: 0,
            pendientes: 0,
            canceladas: 0,
          };
        }

        byMonth[mesKey].total++;
        if (reserva.estado === 'confirmada') byMonth[mesKey].confirmadas++;
        else if (reserva.estado === 'pendiente') byMonth[mesKey].pendientes++;
        else if (reserva.estado === 'cancelada') byMonth[mesKey].canceladas++;
      });

      return Object.values(byMonth).sort((a, b) => a.mes.localeCompare(b.mes));
    } catch (error) {
      console.error('Error fetching reservas por mes:', error);
      return [];
    }
  }

  /**
   * 🎯 VISTA GENERAL DEL NEGOCIO
   */
  async getDashboardStats() {
    try {
      const [kpis, servicios, proveedores, reservasPorMes] = await Promise.all([
        this.getBusinessKPIs(),
        this.getServiciosAnalisis(),
        this.getProveedoresAnalisis(),
        this.getReservasFlujoPorMes(),
      ]);

      return {
        kpis,
        servicios,
        proveedores,
        reservas_por_mes: reservasPorMes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error obteniendo dashboard stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * 📊 ESTADO GENERAL DE LA PLATAFORMA
   */
  async getPlatformStatus() {
    try {
      const kpis = await this.getBusinessKPIs();
      return {
        servicios_disponibles: kpis.servicios_totales,
        clientes_registrados: kpis.clientes_totales,
        proveedores_activos: kpis.proveedores_totales,
        reservas_activas: kpis.reservas_confirmadas,
        ingresos_totales: kpis.ingresos_totales,
        tasa_conversion: kpis.tasa_conversion,
        satisfaccion: kpis.satisfaccion_promedio,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching platform status:', error);
      return {
        servicios_disponibles: 0,
        clientes_registrados: 0,
        proveedores_activos: 0,
        reservas_activas: 0,
        ingresos_totales: 0,
        tasa_conversion: 0,
        satisfaccion: 0,
      };
    }
  }

  /**
   * Compatibilidad con métodos antiguos
   */
  async getServiceStats(): Promise<ServiceStats> {
    try {
      const response = await axios.get(
        `${this.djangoApiUrl}/api_rest/api/v1/servicio/`,
        { timeout: this.apiTimeout },
      ).catch(() => ({ data: [] }));

      const servicios = response.data || [];
      const porCategoria: Record<string, number> = {};

      servicios.forEach((servicio: any) => {
        const categoria = servicio.categoria_nombre || 'Sin categoría';
        porCategoria[categoria] = (porCategoria[categoria] || 0) + 1;
      });

      return {
        total: servicios.length,
        activos: servicios.length,
        inactivos: 0,
        porCategoria,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de servicios:', error);
      return { total: 0, activos: 0, inactivos: 0, porCategoria: {} };
    }
  }

  async getClienteStats(): Promise<ClienteStats> {
    try {
      const response = await axios.get(
        `${this.djangoApiUrl}/api_rest/api/v1/cliente/`,
        { timeout: this.apiTimeout },
      ).catch(() => ({ data: [] }));

      const clientes = response.data || [];
      const porMes: Record<string, number> = {};

      clientes.forEach((cliente: any) => {
        const fecha = new Date(cliente.created_at);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        porMes[mesKey] = (porMes[mesKey] || 0) + 1;
      });

      const porMesArray = Object.entries(porMes).map(([mes, cantidad]) => ({
        mes,
        cantidad,
      }));

      return {
        total: clientes.length,
        activos: clientes.length,
        inactivos: 0,
        porMes: porMesArray,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de clientes:', error);
      return { total: 0, activos: 0, inactivos: 0, porMes: [] };
    }
  }

  async getReservasByMonth(): Promise<ReservasByMonth[]> {
    return this.getReservasFlujoPorMes();
  }

  async getCalificacionesPromedio(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.djangoApiUrl}/api_rest/api/v1/calificacion/`,
        { timeout: this.apiTimeout },
      ).catch(() => ({ data: [] }));

      const calificaciones = response.data || [];
      const promedioGeneral = calificaciones.length > 0
        ? (calificaciones.reduce((sum, c) => sum + (c.puntuacion || 0), 0) / calificaciones.length).toFixed(2)
        : 0;

      return {
        promedioGeneral,
        totalCalificaciones: calificaciones.length,
      };
    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      return { promedioGeneral: 0, totalCalificaciones: 0 };
    }
  }

  createBusinessEvent(eventType: any, data: any): BusinessEvent {
    return { type: eventType, data, timestamp: new Date() };
  }

  private getDefaultKPIs() {
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

  /**
   * 💰 INGRESOS POR MES - Análisis de ingresos mensuales
   */
  async getIngresosPorMes() {
    try {
      const response = await axios.get(
        `${this.djangoApiUrl}/api_rest/api/v1/reserva/`,
        { timeout: this.apiTimeout },
      ).catch(() => ({ data: [] }));

      const reservas = response.data || [];
      const ingresosPorMes: Record<string, number> = {};

      // Solo contar reservas confirmadas (dinero real)
      reservas
        .filter((r: any) => r.estado === 'confirmada')
        .forEach((reserva: any) => {
          const fecha = new Date(reserva.fecha);
          const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          const ingreso = parseFloat(reserva.total_estimado) || 0;
          ingresosPorMes[mesKey] = (ingresosPorMes[mesKey] || 0) + ingreso;
        });

      return Object.entries(ingresosPorMes)
        .map(([mes, ingreso]) => ({
          mes,
          ingreso: parseFloat(ingreso.toFixed(2)),
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes));
    } catch (error) {
      console.error('Error fetching ingresos por mes:', error);
      return [];
    }
  }

  /**
   * 📅 FLUJO DE RESERVAS ANUAL - Tendencia anual detallada
   */
  async getFlujoReservasAnual() {
    try {
      const response = await axios.get(
        `${this.djangoApiUrl}/api_rest/api/v1/reserva/`,
        { timeout: this.apiTimeout },
      ).catch(() => ({ data: [] }));

      const reservas = response.data || [];
      const currentYear = new Date().getFullYear();
      const flujoAnual: Record<string, any> = {};

      // Inicializar 12 meses del año actual
      for (let i = 1; i <= 12; i++) {
        const mesKey = `${currentYear}-${String(i).padStart(2, '0')}`;
        flujoAnual[mesKey] = {
          mes: mesKey,
          confirmadas: 0,
          pendientes: 0,
          canceladas: 0,
          total: 0,
          ingreso: 0,
        };
      }

      // Procesar reservas
      reservas.forEach((reserva: any) => {
        const fecha = new Date(reserva.fecha);
        const año = fecha.getFullYear();
        
        // Solo procesar reservas del año actual
        if (año === currentYear) {
          const mesKey = `${año}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          
          if (flujoAnual[mesKey]) {
            flujoAnual[mesKey].total++;
            const ingreso = parseFloat(reserva.total_estimado) || 0;

            if (reserva.estado === 'confirmada') {
              flujoAnual[mesKey].confirmadas++;
              flujoAnual[mesKey].ingreso += ingreso;
            } else if (reserva.estado === 'pendiente') {
              flujoAnual[mesKey].pendientes++;
            } else if (reserva.estado === 'cancelada') {
              flujoAnual[mesKey].canceladas++;
            }
          }
        }
      });

      return Object.values(flujoAnual).map((item: any) => ({
        ...item,
        ingreso: parseFloat(item.ingreso.toFixed(2)),
      }));
    } catch (error) {
      console.error('Error fetching flujo anual:', error);
      return [];
    }
  }

  /**
   * 🔔 ACTIVIDAD EN TIEMPO REAL - Últimas transacciones/eventos
   */
  async getActividadTiempoReal() {
    try {
      const [reservas, calificaciones, pagos] = await Promise.all([
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/reserva/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/calificacion/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/pago/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
      ]);

      const actividades: any[] = [];

      // Procesar reservas - usar updated_at si existe, sino fecha
      (reservas.data || []).forEach((r: any) => {
        actividades.push({
          tipo: 'reserva',
          subtipo: r.estado,
          descripcion: `Reserva ${r.estado}: ${r.servicio?.nombre_servicio || 'Servicio'}`,
          fecha: r.updated_at || r.fecha || new Date().toISOString(),
          icono: r.estado === 'confirmada' ? '✅' : r.estado === 'pendiente' ? '⏳' : '❌',
          monto: r.total_estimado,
        });
      });

      // Procesar calificaciones - usar created_at o fecha_creacion
      (calificaciones.data || []).forEach((c: any) => {
        actividades.push({
          tipo: 'calificacion',
          subtipo: 'creada',
          descripcion: `Calificación: ${c.puntuacion}/5 estrellas`,
          fecha: c.created_at || c.fecha_creacion || new Date().toISOString(),
          icono: '⭐',
        });
      });

      // Procesar pagos - usar updated_at si existe
      (pagos.data || []).forEach((p: any) => {
        actividades.push({
          tipo: 'pago',
          subtipo: p.estado,
          descripcion: `Pago ${p.estado}: $${p.monto}`,
          fecha: p.updated_at || p.fecha || new Date().toISOString(),
          icono: p.estado === 'completado' ? '💰' : '⏳',
          monto: p.monto,
        });
      });

      // Ordenar por fecha descendente (más reciente primero) y tomar últimas 20
      return actividades
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 20);
    } catch (error) {
      console.error('Error fetching actividad en tiempo real:', error);
      return [];
    }
  }

  /**
   * 📅 ANÁLISIS DETALLADO DE RESERVAS - Por estado y pago
   */
  async getReservasDesglosadas() {
    try {
      const [reservas, pagos] = await Promise.all([
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/reserva/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/pago/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
      ]);

      const reservasData = reservas.data || [];
      const pagosData = pagos.data || [];

      // Crear mapa de pagos por reserva
      const pagosPorReserva: Record<number, any> = {};
      pagosData.forEach((pago: any) => {
        if (pago.reserva?.id) {
          pagosPorReserva[pago.reserva.id] = pago;
        }
      });

      // Desglosar reservas
      let confirmadas_por_proveedor = 0;  // Reservas confirmadas
      let pagadas_por_cliente = 0;        // Reservas con pago procesado
      let pendientes_confirmacion = 0;    // Reservas en estado pendiente
      let pendientes_pago = 0;            // Reservas confirmadas sin pago

      reservasData.forEach((reserva: any) => {
        if (reserva.estado === 'confirmada') {
          confirmadas_por_proveedor++;
          const pago = pagosPorReserva[reserva.id];
          if (pago && pago.estado === 'pagado') {
            pagadas_por_cliente++;
          } else {
            pendientes_pago++;
          }
        } else if (reserva.estado === 'pendiente') {
          pendientes_confirmacion++;
        }
      });

      return {
        confirmadas_por_proveedor: confirmadas_por_proveedor,
        pagadas_por_cliente: pagadas_por_cliente,
        pendientes_confirmacion: pendientes_confirmacion,
        pendientes_pago: pendientes_pago,
        total_reservas: reservasData.length,
      };
    } catch (error) {
      console.error('Error fetching reservas desglosadas:', error);
      return {
        confirmadas_por_proveedor: 0,
        reservas_pagadas: 0,
        pendientes_confirmacion: 0,
        pendientes_pago: 0,
        total_reservas: 0,
      };
    }
  }

  /**
   * 💹 PROYECCIÓN DE INGRESOS - Estimación basada en tendencias
   */
  async getProyeccionIngresos() {
    try {
      const [reservasResponse, pagosResponse] = await Promise.all([
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/reserva/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
        axios.get(`${this.djangoApiUrl}/api_rest/api/v1/pago/`, { timeout: this.apiTimeout }).catch(() => ({ data: [] })),
      ]);

      const reservas = reservasResponse.data || [];
      const pagos = pagosResponse.data || [];

      const hoy = new Date();
      const mesActual = hoy.getMonth();
      const yearActual = hoy.getFullYear();
      const diaDelMes = hoy.getDate();
      const diasEnMes = new Date(yearActual, mesActual + 1, 0).getDate();

      // Crear mapa de pagos por reserva
      const pagosPorReserva: Record<number, any> = {};
      pagos.forEach((pago: any) => {
        if (pago.reserva?.id) {
          pagosPorReserva[pago.reserva.id] = pago;
        }
      });

      // Calcular ingresos del mes actual (solo confirmadas y pagadas)
      let ingresosConfirmadosPagados = 0;
      reservas
        .filter((r: any) => {
          const fecha = new Date(r.fecha);
          return fecha.getMonth() === mesActual && 
                 fecha.getFullYear() === yearActual && 
                 r.estado === 'confirmada' &&
                 pagosPorReserva[r.id] &&
                 pagosPorReserva[r.id].estado === 'pagado';
        })
        .forEach((r: any) => {
          ingresosConfirmadosPagados += parseFloat(r.total_estimado) || 0;
        });

      // Calcular ingresos confirmados (no importa si pagados)
      let ingresosConfirmados = 0;
      reservas
        .filter((r: any) => {
          const fecha = new Date(r.fecha);
          return fecha.getMonth() === mesActual && 
                 fecha.getFullYear() === yearActual && 
                 r.estado === 'confirmada';
        })
        .forEach((r: any) => {
          ingresosConfirmados += parseFloat(r.total_estimado) || 0;
        });

      // Proyectar para todo el mes
      const ingresoProyectadoPagado = (ingresosConfirmadosPagados / diaDelMes) * diasEnMes;
      const ingresoProyectadoConfirmado = (ingresosConfirmados / diaDelMes) * diasEnMes;

      // Calcular promedios diarios
      const promedioDiarioPagado = ingresosConfirmadosPagados / diaDelMes;
      const promedioDiarioConfirmado = ingresosConfirmados / diaDelMes;

      // Ingresos pendientes (confirmados pero sin pagar)
      let ingresosPendientes = 0;
      reservas
        .filter((r: any) => {
          const fecha = new Date(r.fecha);
          return fecha.getMonth() === mesActual && 
                 fecha.getFullYear() === yearActual &&
                 r.estado === 'confirmada' && 
                 (!pagosPorReserva[r.id] || pagosPorReserva[r.id].estado !== 'pagado');
        })
        .forEach((r: any) => {
          ingresosPendientes += parseFloat(r.total_estimado) || 0;
        });

      return {
        ingresos_pagados_mes: parseFloat(ingresosConfirmadosPagados.toFixed(2)),
        ingresos_confirmados_mes: parseFloat(ingresosConfirmados.toFixed(2)),
        ingresos_pendientes_mes: parseFloat(ingresosPendientes.toFixed(2)),
        proyeccion_pagado_mes: parseFloat(ingresoProyectadoPagado.toFixed(2)),
        proyeccion_confirmado_mes: parseFloat(ingresoProyectadoConfirmado.toFixed(2)),
        promedio_diario_pagado: parseFloat(promedioDiarioPagado.toFixed(2)),
        promedio_diario_confirmado: parseFloat(promedioDiarioConfirmado.toFixed(2)),
        dias_procesados: diaDelMes,
        dias_totales_mes: diasEnMes,
        dias_restantes: diasEnMes - diaDelMes,
        porcentaje_mes: parseFloat(((diaDelMes / diasEnMes) * 100).toFixed(1)),
      };
    } catch (error) {
      console.error('Error fetching proyección de ingresos:', error);
      return {
        ingresos_pagados_mes: 0,
        ingresos_confirmados_mes: 0,
        ingresos_pendientes_mes: 0,
        proyeccion_pagado_mes: 0,
        proyeccion_confirmado_mes: 0,
        promedio_diario_pagado: 0,
        promedio_diario_confirmado: 0,
        dias_procesados: 0,
        dias_totales_mes: 0,
        dias_restantes: 0,
        porcentaje_mes: 0,
      };
    }
  }

  private getDefaultStats() {
    return {
      kpis: this.getDefaultKPIs(),
      servicios: { total_servicios: 0, top_servicios: [], servicios_por_categoria: {} },
      proveedores: { total_proveedores: 0, top_proveedores: [] },
      reservas_por_mes: [],
      timestamp: new Date().toISOString(),
    };
  }
}
