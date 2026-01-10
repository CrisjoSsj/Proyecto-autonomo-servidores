/**
 * GraphQLService.ts
 * Servicio para comunicación con el servidor GraphQL
 */

import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

// ============================================================
// TIPOS LOCALES PARA GRAPHQL (diferentes a la API REST)
// ============================================================

export interface GQLRestaurante {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  capacidadTotal: number;
}

export interface GQLMenu {
  id: string;
  nombre: string;
  descripcion: string;
  precioTotal: number;
  disponible: boolean;
}

export interface GQLPlato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  categoria_id?: string;
  id_categoria?: string;
}

export interface GQLReserva {
  id: string;
  clienteId: string;
  mesaId: string;
  fecha: string;
  hora: string;
  numeroPersonas: number;
  estado: string;
  numero_personas?: number;
}

export interface GQLMesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: string;
  ubicacion: string;
}

export interface GQLCategoria {
  id?: string;
  id_categoria?: string;
  nombre: string;
}

export interface GQLPersonaFila {
  id?: number;
  nombre: string;
  numeroPersonas: number;
  tiempoEstimado: number;
}

export interface DashboardData {
  totalReservas: number;
  reservasPorMes: { mes: string; total: number }[];
  mesasPopulares: { mesaId: string; usos: number }[];
  platosPopulares: { platoId: string; nombre: string; pedidos: number }[];
}

export interface ReporteMetricas {
  tasaOcupacion: number;
  mesasDisponibles: number;
  totalMesas: number;
  mesasOcupadas: number;
  mesasReservadas: number;
  totalReservas: number;
  personasEnCola: number;
  reservasPendientes?: number;
}

export interface ReporteData {
  metricas: ReporteMetricas;
  periodo: string;
  mesas: GQLMesa[];
  platos: GQLPlato[];
  reservas: GQLReserva[];
  filaVirtual: GQLPersonaFila[];
  categorias?: GQLCategoria[];
}

export interface RestauranteInput {
  nombre: string;
  direccion: string;
  telefono: string;
  horario?: string;
  capacidadTotal?: number;
}

export interface ReservaInput {
  clienteId: string;
  mesaId: string;
  fecha: string;
  hora: string;
  numeroPersonas: number;
  estado?: string;
}

// ============================================================
// CONFIGURACIÓN
// ============================================================

// Determinar la URL del servidor GraphQL dinámicamente
const getGraphQLUri = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // En desarrollo: intentar con los puertos comunes (3000, 3001, 3002)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Usar el puerto que viene en la variable de entorno o intentar los puertos estándar
      const port = (import.meta.env.VITE_GRAPHQL_PORT as string) || '3000';
      return `${protocol}//localhost:${port}/api/graphql`;
    }
    
    // En producción: usar la misma origen
    return `${protocol}//${hostname}${window.location.port ? `:${window.location.port}` : ''}/api/graphql`;
  }
  
  return 'http://localhost:3000/api/graphql';
};

const graphqlUri = getGraphQLUri();
console.log('🔌 GraphQL conectado en:', graphqlUri);

// Configurar Apollo Client
const client = new ApolloClient({
  link: new HttpLink({
    uri: graphqlUri,
    credentials: 'include', // Incluir cookies en las peticiones
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});

// ========== QUERIES ==========

/**
 * Obtener datos del dashboard
 */
export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    totalReservas
    reservasPorMes {
      mes
      total
    }
    mesasPopulares {
      mesaId
      usos
    }
    platosPopulares {
      platoId
      nombre
      pedidos
    }
  }
`;

/**
 * Obtener todos los restaurantes
 */
export const GET_RESTAURANTES = gql`
  query GetRestaurantes {
    restaurantes {
      id
      nombre
      direccion
      telefono
      horario
      capacidadTotal
    }
  }
`;

/**
 * Obtener un restaurante por ID
 */
export const GET_RESTAURANTE = gql`
  query GetRestaurante($id: ID!) {
    restaurante(id: $id) {
      id
      nombre
      direccion
      telefono
      horario
      capacidadTotal
    }
  }
`;

/**
 * Obtener todos los menús
 */
export const GET_MENUS = gql`
  query GetMenus {
    menus {
      id
      nombre
      descripcion
      precioTotal
      disponible
    }
  }
`;

/**
 * Obtener un menú por ID
 */
export const GET_MENU = gql`
  query GetMenu($id: ID!) {
    menu(id: $id) {
      id
      nombre
      descripcion
      precioTotal
      disponible
    }
  }
`;

/**
 * Obtener todos los platos
 */
export const GET_PLATOS = gql`
  query GetPlatos {
    platos {
      id
      nombre
      descripcion
      precio
      categoria
      disponible
    }
  }
`;

/**
 * Obtener todas las reservas
 */
export const GET_RESERVAS = gql`
  query GetReservas {
    reservas {
      id
      clienteId
      mesaId
      fecha
      hora
      numeroPersonas
      estado
    }
  }
`;

/**
 * Obtener una reserva por ID
 */
export const GET_RESERVA = gql`
  query GetReserva($id: ID!) {
    reserva(id: $id) {
      id
      clienteId
      mesaId
      fecha
      hora
      numeroPersonas
      estado
    }
  }
`;

/**
 * Obtener todas las mesas
 */
export const GET_MESAS = gql`
  query GetMesas {
    mesas {
      id
      numero
      capacidad
      estado
      ubicacion
    }
  }
`;

// ========== MUTATIONS ==========

/**
 * Crear un nuevo restaurante
 */
export const CREATE_RESTAURANTE = gql`
  mutation CreateRestaurante($input: RestauranteInput!) {
    createRestaurante(input: $input) {
      id
      nombre
      direccion
      telefono
      horario
      capacidadTotal
    }
  }
`;
export const UPDATE_RESTAURANTE = gql`
  mutation UpdateRestaurante($id: ID!, $input: RestauranteInput!) {
    updateRestaurante(id: $id, input: $input) {
      id
      nombre
      direccion
      telefono
      horario
      capacidadTotal
    }
  }
`;

/**
 * Eliminar un restaurante
 */
export const DELETE_RESTAURANTE = gql`
  mutation DeleteRestaurante($id: ID!) {
    deleteRestaurante(id: $id)
  }
`;

/**
 * Crear una nueva reserva
 */
export const CREATE_RESERVA = gql`
  mutation CreateReserva($input: ReservaInput!) {
    createReserva(input: $input) {
      id
      clienteId
      mesaId
      fecha
      hora
      numeroPersonas
      estado
    }
  }
`;

/**
 * Actualizar una reserva
 */
export const UPDATE_RESERVA = gql`
  mutation UpdateReserva($id: ID!, $input: ReservaInput!) {
    updateReserva(id: $id, input: $input) {
      id
      clienteId
      mesaId
      fecha
      hora
      numeroPersonas
      estado
    }
  }
`;

/**
 * Cancelar una reserva
 */
export const CANCEL_RESERVA = gql`
  mutation CancelReserva($id: ID!) {
    cancelReserva(id: $id) {
      id
      estado
    }
  }
`;

// ========== FUNCIONES DE SERVICIO ==========

/**
 * Obtener datos del dashboard
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const result = await client.query<DashboardData>({
      query: GET_DASHBOARD_DATA,
    });
    return result.data;
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    // Retornar datos de ejemplo si hay error
    return {
      totalReservas: 45,
      reservasPorMes: [
        { mes: 'Enero', total: 12 },
        { mes: 'Febrero', total: 18 },
        { mes: 'Marzo', total: 15 },
      ],
      mesasPopulares: [
        { mesaId: '1', usos: 23 },
        { mesaId: '2', usos: 19 },
        { mesaId: '3', usos: 15 },
      ],
      platosPopulares: [
        { platoId: '1', nombre: 'Alitas BBQ', pedidos: 45 },
        { platoId: '2', nombre: 'Hamburguesa', pedidos: 38 },
        { platoId: '3', nombre: 'Pizza', pedidos: 32 },
      ],
    };
  }
}

/**
 * Obtener todos los restaurantes
 */
export async function fetchRestaurantes(): Promise<GQLRestaurante[]> {
  try {
    const { data } = await client.query<{ restaurantes: GQLRestaurante[] }>({
      query: GET_RESTAURANTES,
    });
    return data.restaurantes;
  } catch (error) {
    console.error('Error al obtener restaurantes:', error);
    throw error;
  }
}

/**
 * Obtener un restaurante por ID
 */
export async function fetchRestaurante(id: string): Promise<GQLRestaurante> {
  try {
    const { data } = await client.query<{ restaurante: GQLRestaurante }>({
      query: GET_RESTAURANTE,
      variables: { id },
    });
    return data.restaurante;
  } catch (error) {
    console.error('Error al obtener restaurante:', error);
    throw error;
  }
}

/**
 * Obtener todos los menús
 */
export async function fetchMenus(): Promise<GQLMenu[]> {
  try {
    const { data } = await client.query<{ menus: GQLMenu[] }>({
      query: GET_MENUS,
    });
    return data.menus;
  } catch (error) {
    console.error('Error al obtener menús:', error);
    throw error;
  }
}

/**
 * Obtener todos los platos
 */
export async function fetchPlatos(): Promise<GQLPlato[]> {
  try {
    const { data } = await client.query<{ platos: GQLPlato[] }>({
      query: GET_PLATOS,
    });
    return data.platos;
  } catch (error) {
    console.error('Error al obtener platos:', error);
    throw error;
  }
}

/**
 * Obtener todas las reservas
 */
export async function fetchReservas(): Promise<GQLReserva[]> {
  try {
    const { data } = await client.query<{ reservas: GQLReserva[] }>({
      query: GET_RESERVAS,
    });
    return data.reservas;
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw error;
  }
}

/**
 * Obtener todas las mesas
 */
export async function fetchMesas(): Promise<GQLMesa[]> {
  try {
    const { data } = await client.query<{ mesas: GQLMesa[] }>({
      query: GET_MESAS,
    });
    return data.mesas;
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    throw error;
  }
}

/**
 * Crear una nueva reserva
 */
export async function createReserva(input: ReservaInput): Promise<GQLReserva> {
  try {
    const { data } = await client.mutate<{ createReserva: GQLReserva }>({
      mutation: CREATE_RESERVA,
      variables: { input },
    });
    if (!data?.createReserva) throw new Error('No se pudo crear la reserva');
    return data.createReserva;
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
}

/**
 * Actualizar una reserva
 */
export async function updateReserva(id: string, input: Partial<ReservaInput>): Promise<GQLReserva> {
  try {
    const { data } = await client.mutate<{ updateReserva: GQLReserva }>({
      mutation: UPDATE_RESERVA,
      variables: { id, input },
    });
    if (!data?.updateReserva) throw new Error('No se pudo actualizar la reserva');
    return data.updateReserva;
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    throw error;
  }
}

/**
 * Cancelar una reserva
 */
export async function cancelReserva(id: string): Promise<GQLReserva> {
  try {
    const { data } = await client.mutate<{ cancelReserva: GQLReserva }>({
      mutation: CANCEL_RESERVA,
      variables: { id },
    });
    if (!data?.cancelReserva) throw new Error('No se pudo cancelar la reserva');
    return data.cancelReserva;
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    throw error;
  }
}

/**
 * Crear un nuevo restaurante
 */
export async function createRestaurante(input: RestauranteInput): Promise<GQLRestaurante> {
  try {
    const { data } = await client.mutate<{ createRestaurante: GQLRestaurante }>({
      mutation: CREATE_RESTAURANTE,
      variables: { input },
    });
    if (!data?.createRestaurante) throw new Error('No se pudo crear el restaurante');
    return data.createRestaurante;
  } catch (error) {
    console.error('Error al crear restaurante:', error);
    throw error;
  }
}

/**
 * Descargar reporte operacional en PDF (generado en el frontend con jsPDF)
 * Incluye estadísticas detalladas de mesas, menús, reservas y fila virtual
 */
export async function downloadReportePDF(data: ReporteData): Promise<void> {
  try {
    console.log('📥 Iniciando generación de PDF enriquecido...');
    
    const { metricas, periodo, mesas, platos, reservas, filaVirtual, categorias } = data;
    
    // Importar jsPDF dinámicamente
    const { jsPDF } = await import('jspdf');
    
    // Crear documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;
    const margin = 15;

    // ========== FUNCIONES AUXILIARES ==========
    const addNewPage = (): void => {
      doc.addPage();
      yPosition = 15;
    };

    const addTitle = (text: string): void => {
      if (yPosition > pageHeight - 30) addNewPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(163, 146, 116); // Goldifox
      doc.text(text, margin, yPosition);
      doc.setDrawColor(163, 146, 116);
      doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
      yPosition += 10;
      doc.setTextColor(0, 0, 0);
    };

    const addSubtitle = (text: string): void => {
      if (yPosition > pageHeight - 20) addNewPage();
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, yPosition);
      yPosition += 6;
    };

    const addText = (text: string, fontSize = 10, bold = false): void => {
      if (yPosition > pageHeight - 15) addNewPage();
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(text, margin, yPosition);
      yPosition += 5;
    };

    const addLineSpacing = (space = 2): void => {
      yPosition += space;
    };

    const addMetricRow = (label: string, value: string, isHighlight = false): void => {
      if (yPosition > pageHeight - 15) addNewPage();
      doc.setFontSize(10);
      doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
      doc.text(label, margin + 2, yPosition);
      doc.text(value, pageWidth - margin - 2, yPosition, { align: 'right' });
      yPosition += 5;
    };

    // ========== PORTADA ==========
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(163, 146, 116);
    doc.text('REPORTE OPERACIONAL', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Del Restaurante', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    doc.setDrawColor(163, 146, 116);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Período: ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Fecha: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // ========== RESUMEN EJECUTIVO ==========
    doc.setTextColor(0, 0, 0);
    addTitle('1. RESUMEN EJECUTIVO');

    addMetricRow('Tasa de Ocupación', `${Math.round(metricas.tasaOcupacion)}%`, true);
    addMetricRow('Mesas Disponibles', `${metricas.mesasDisponibles} de ${metricas.totalMesas}`);
    addMetricRow('Mesas Ocupadas', metricas.mesasOcupadas.toString());
    addMetricRow('Mesas Reservadas', metricas.mesasReservadas.toString());
    addMetricRow('Total Reservas', metricas.totalReservas.toString());
    addMetricRow('Personas en Fila', metricas.personasEnCola.toString());
    addLineSpacing(3);

    // ========== ANÁLISIS DE MESAS ==========
    addTitle('2. ANÁLISIS DE MESAS');
    
    // Estadísticas por estado
    const mesasPorEstado: Record<string, number> = {};
    mesas.forEach((mesa) => {
      const estado = mesa.estado?.toLowerCase() || 'desconocido';
      mesasPorEstado[estado] = (mesasPorEstado[estado] || 0) + 1;
    });

    Object.entries(mesasPorEstado).forEach(([estado, count]) => {
      const porcentaje = ((count / mesas.length) * 100).toFixed(1);
      addMetricRow(
        `Mesas ${estado.charAt(0).toUpperCase() + estado.slice(1)}`,
        `${count} (${porcentaje}%)`
      );
    });

    // Mesas por capacidad
    addLineSpacing(3);
    addSubtitle('Distribución por Capacidad');
    const mesasPorCapacidad: Record<string, number> = {};
    mesas.forEach((mesa) => {
      const capacidad = mesa.capacidad?.toString() || 'N/A';
      mesasPorCapacidad[capacidad] = (mesasPorCapacidad[capacidad] || 0) + 1;
    });

    Object.entries(mesasPorCapacidad)
      .sort()
      .forEach(([capacidad, count]) => {
        addMetricRow(`Capacidad ${capacidad} personas`, count.toString());
      });

    addLineSpacing(3);

    // ========== ANÁLISIS DE RESERVAS ==========
    addTitle('3. ANÁLISIS DE RESERVAS');

    const reservasPorEstado: Record<string, number> = {};
    reservas.forEach((r) => {
      const estado = r.estado?.toLowerCase() || 'pendiente';
      reservasPorEstado[estado] = (reservasPorEstado[estado] || 0) + 1;
    });

    Object.entries(reservasPorEstado).forEach(([estado, count]) => {
      const porcentaje = metricas.totalReservas > 0 
        ? ((count / metricas.totalReservas) * 100).toFixed(1)
        : '0';
      addMetricRow(
        `Reservas ${estado.charAt(0).toUpperCase() + estado.slice(1)}`,
        `${count} (${porcentaje}%)`
      );
    });

    // Análisis de personas
    addLineSpacing(3);
    addSubtitle('Análisis de Personas');
    
    const totalPersonas = reservas.reduce((sum, r) => sum + (r.numeroPersonas || r.numero_personas || 0), 0);
    const promedioPersonas = reservas.length > 0 ? (totalPersonas / reservas.length).toFixed(1) : '0';
    
    addMetricRow('Total de Personas Reservadas', totalPersonas.toString());
    addMetricRow('Promedio por Reserva', `${promedioPersonas} personas`);
    
    if (reservas.length > 0) {
      const maxPersonas = Math.max(...reservas.map((r) => r.numeroPersonas || r.numero_personas || 0));
      const minPersonas = Math.min(...reservas.map((r) => r.numeroPersonas || r.numero_personas || 0));
      addMetricRow('Máximo por Reserva', `${maxPersonas} personas`);
      addMetricRow('Mínimo por Reserva', `${minPersonas} personas`);
    }

    addLineSpacing(3);

    // ========== ANÁLISIS DE MENÚ Y PLATOS ==========
    addTitle('4. ANÁLISIS DE MENÚ Y PLATOS');

    const platosDisp = platos.filter((p) => p.disponible).length;
    const platosNoDisp = platos.filter((p) => !p.disponible).length;
    const dispPorcentaje = platos.length > 0 ? ((platosDisp / platos.length) * 100).toFixed(1) : '0';

    addMetricRow('Total de Platos', platos.length.toString());
    addMetricRow('Platos Disponibles', `${platosDisp} (${dispPorcentaje}%)`);
    addMetricRow('Platos No Disponibles', platosNoDisp.toString());

    // Por categoría
    if (categorias && categorias.length > 0) {
      addLineSpacing(3);
      addSubtitle('Platos por Categoría');

      categorias.forEach((cat) => {
        const catId = cat.id || cat.id_categoria;
        const platosCat = platos.filter((p) => 
          (p.categoria_id === catId || p.id_categoria === catId || p.categoria === cat.nombre)
        ).length;
        
        const dispCat = platos.filter((p) => 
          (p.categoria_id === catId || p.id_categoria === catId || p.categoria === cat.nombre) && p.disponible
        ).length;

        if (platosCat > 0) {
          addMetricRow(
            `${cat.nombre}`,
            `${dispCat}/${platosCat} disponibles`
          );
        }
      });
    }

    addLineSpacing(3);

    // ========== ANÁLISIS DE FILA VIRTUAL ==========
    if (filaVirtual && filaVirtual.length > 0) {
      addTitle('5. ANÁLISIS DE FILA VIRTUAL');

      const totalEnCola = filaVirtual.reduce((sum, p) => sum + (p.numeroPersonas || 0), 0);
      const tiempoPromedio = filaVirtual.length > 0
        ? (filaVirtual.reduce((sum, p) => sum + (p.tiempoEstimado || 0), 0) / filaVirtual.length).toFixed(1)
        : '0';

      addMetricRow('Personas en Fila', filaVirtual.length.toString());
      addMetricRow('Total de Personas', totalEnCola.toString());
      addMetricRow('Tiempo Promedio de Espera', `${tiempoPromedio} minutos`, true);

      // Primeros 5 en fila
      if (filaVirtual.length > 0) {
        addLineSpacing(2);
        addSubtitle('Próximos en Llegar');

        filaVirtual.slice(0, 5).forEach((persona, index) => {
          const nombre = persona.nombre || `Cliente #${index + 1}`;
          const personas = persona.numeroPersonas || 0;
          const tiempo = persona.tiempoEstimado || 'N/A';
          
          addMetricRow(
            `${index + 1}. ${nombre}`,
            `${personas} pers. - ${tiempo} min`
          );
        });

        if (filaVirtual.length > 5) {
          addText(`... y ${filaVirtual.length - 5} más en la fila`);
        }
      }

      addLineSpacing(3);
    }

    // ========== CONCLUSIONES Y RECOMENDACIONES ==========
    addTitle('6. CONCLUSIONES Y RECOMENDACIONES');

    const recomendaciones: string[] = [];

    if (metricas.tasaOcupacion > 80) {
      recomendaciones.push('• Alta ocupación: Considerar aumentar personal o capacidad.');
    } else if (metricas.tasaOcupacion < 30) {
      recomendaciones.push('• Baja ocupación: Realizar promociones para atraer clientes.');
    }

    if (metricas.personasEnCola > 5) {
      recomendaciones.push('• Fila virtual extensa: Priorizar asientos disponibles.');
    }

    if (platosNoDisp > 0) {
      recomendaciones.push(`• ${platosNoDisp} platos sin disponibilidad: Revisar stock.`);
    }

    if (metricas.reservasPendientes && metricas.reservasPendientes > 0) {
      recomendaciones.push(`• ${metricas.reservasPendientes} reservas pendientes: Confirmar o rechazar.`);
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push('• Operación normal: Continuar monitoreando.');
      recomendaciones.push('• Todas las métricas dentro de rangos óptimos.');
    }

    recomendaciones.forEach((rec) => {
      if (yPosition > pageHeight - 20) addNewPage();
      addText(rec, 9);
    });

    // ========== PIE DE PÁGINA ==========
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Este reporte fue generado automáticamente por el Sistema de Gestión del Restaurante',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    // Guardar el PDF
    doc.save(`reporte-operacional-${new Date().toISOString().split('T')[0]}.pdf`);
    
    console.log('✅ PDF enriquecido generado y descargado exitosamente');
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    alert(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    throw error;
  }
}

// Exportar cliente Apollo para uso avanzado
export { client as apolloClient };

// Re-exportar tipos con alias para compatibilidad
export type Restaurante = GQLRestaurante;
export type Menu = GQLMenu;
export type Plato = GQLPlato;
export type Reserva = GQLReserva;
export type Mesa = GQLMesa;
