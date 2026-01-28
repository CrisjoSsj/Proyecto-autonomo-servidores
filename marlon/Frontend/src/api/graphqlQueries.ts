export const QUERY_SERVICIOS = `
  query Servicios($filter: ServicioFilterInput, $pagination: Pagination) {
    servicios(filter: $filter, pagination: $pagination) {
      id
      nombreServicio
      descripcion
      duracion
      ratingPromedio
      precio
      categoria { id nombre }
    }
  }
`;

export const QUERY_RESERVAS = `
  query Reservas($filter: ReservaFilterInput, $pagination: Pagination) {
    reservas(filter: $filter, pagination: $pagination) {
      id
      fecha
      hora
      estado
      totalEstimado
      pagos {
        id
        monto
        estado
        metodoPago
        fechaPago
      }
    }
  }
`;

export const QUERY_CATEGORIAS = `
  query Categorias($pagination: Pagination) {
    categorias(pagination: $pagination) {
      id
      nombre
      descripcion
    }
  }
`;

// ====================================
// QUERIES DE REPORTES
// ====================================

export const QUERY_REPORTE_VENTAS = `
  query ReporteVentas($pagination: Pagination) {
    reporteVentas(pagination: $pagination) {
      periodo
      totalVentas
      cantidadReservas
      promedioPorReserva
      serviciosMasVendidos {
        servicio {
          id
          nombreServicio
          descripcion
          precio
        }
        cantidadVendida
        ingresosGenerados
      }
    }
  }
`;

export const QUERY_REPORTE_SATISFACCION = `
  query ReporteSatisfaccion($pagination: Pagination) {
    reporteSatisfaccion(pagination: $pagination) {
      servicio {
        id
        nombreServicio
        descripcion
      }
      promedioCalificacion
      totalCalificaciones
      distribucionCalificaciones {
        puntuacion
        cantidad
        porcentaje
      }
    }
  }
`;

export const QUERY_REPORTE_PROVEEDORES = `
  query ReporteProveedores($pagination: Pagination) {
    reporteProveedores(pagination: $pagination) {
      proveedor {
        id
        user {
          username
          email
          firstName
          lastName
        }
        telefono
        descripcion
      }
      totalServicios
      ingresosTotales
      promedioCalificacion
      serviciosActivos
    }
  }
`;

export const QUERY_REPORTE_CLIENTES = `
  query ReporteClientes($pagination: Pagination) {
    reporteClientes(pagination: $pagination) {
      cliente {
        id
        user {
          username
          email
          firstName
          lastName
        }
        telefono
      }
      totalReservas
      gastoTotal
      promedioPorReserva
      ultimaReserva
    }
  }
`;

export const QUERY_METRICAS_GENERALES = `
  query MetricasGenerales($pagination: Pagination) {
    metricasGenerales(pagination: $pagination) {
      totalUsuarios
      totalClientes
      totalProveedores
      totalServicios
      totalReservas
      ingresosTotales
      promedioSatisfaccion
    }
  }
`;
// ====================================
// QUERIES ESPECÍFICOS
// ====================================
export const QUERY_SERVICIOS_MAS_POPULARES = `
  query ServiciosMasPopulares($limit: Int) {
    serviciosMasPopulares(limit: $limit) {
      servicio {
        id
        nombreServicio
        descripcion
        precio
        ratingPromedio
      }
      cantidadVendida
      ingresosGenerados
    }
  }
`;

export const QUERY_PROVEEDORES_MEJOR_CALIFICADOS = `
  query ProveedoresMejorCalificados($limit: Int) {
    proveedoresMejorCalificados(limit: $limit) {
      proveedor {
        id
        user {
          username
          firstName
          lastName
        }
        descripcion
      }
      totalServicios
      ingresosTotales
      promedioCalificacion
      serviciosActivos
    }
  }
`;

export const QUERY_CLIENTES_MAS_ACTIVOS = `
  query ClientesMasActivos($limit: Int) {
    clientesMasActivos(limit: $limit) {
      cliente {
        id
        user {
          username
          firstName
          lastName
        }
      }
      totalReservas
      gastoTotal
      promedioPorReserva
      ultimaReserva
    }
  }
`;
// ====================================
// QUERIES DE TENDENCIAS
// ====================================
export const QUERY_TENDENCIAS_VENTAS = `
  query TendenciasVentas($filter: TendenciasFilter, $pagination: Pagination) {
    tendenciasVentas(filter: $filter, pagination: $pagination) {
      fecha
      valor
      etiqueta
    }
  }
`;

export const QUERY_TENDENCIAS_SATISFACCION = `
  query TendenciasSatisfaccion($filter: TendenciasFilter, $pagination: Pagination) {
    tendenciasSatisfaccion(filter: $filter, pagination: $pagination) {
      fecha
      valor
      etiqueta
    }
  }
`;


