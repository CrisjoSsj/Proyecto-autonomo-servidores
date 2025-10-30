/**
 * GraphQLService.ts
 * Servicio para comunicación con el servidor GraphQL
 * Conecta a http://localhost:3000/api/graphql
 */

import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

// Configurar Apollo Client
const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:3000/api/graphql',
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

/**
 * Actualizar un restaurante
 */
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
 * Obtener todos los restaurantes
 */
export async function fetchRestaurantes(): Promise<Restaurante[]> {
  try {
    const { data } = await client.query({
      query: GET_RESTAURANTES,
    });
    return (data as any).restaurantes;
  } catch (error) {
    console.error('Error al obtener restaurantes:', error);
    throw error;
  }
}

/**
 * Obtener un restaurante por ID
 */
export async function fetchRestaurante(id: string): Promise<Restaurante> {
  try {
    const { data } = await client.query({
      query: GET_RESTAURANTE,
      variables: { id },
    });
    return (data as any).restaurante;
  } catch (error) {
    console.error('Error al obtener restaurante:', error);
    throw error;
  }
}

/**
 * Obtener todos los menús
 */
export async function fetchMenus(): Promise<Menu[]> {
  try {
    const { data } = await client.query({
      query: GET_MENUS,
    });
    return (data as any).menus;
  } catch (error) {
    console.error('Error al obtener menús:', error);
    throw error;
  }
}

/**
 * Obtener todos los platos
 */
export async function fetchPlatos(): Promise<Plato[]> {
  try {
    const { data } = await client.query({
      query: GET_PLATOS,
    });
    return (data as any).platos;
  } catch (error) {
    console.error('Error al obtener platos:', error);
    throw error;
  }
}

/**
 * Obtener todas las reservas
 */
export async function fetchReservas(): Promise<Reserva[]> {
  try {
    const { data } = await client.query({
      query: GET_RESERVAS,
    });
    return (data as any).reservas;
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw error;
  }
}

/**
 * Obtener todas las mesas
 */
export async function fetchMesas(): Promise<Mesa[]> {
  try {
    const { data } = await client.query({
      query: GET_MESAS,
    });
    return (data as any).mesas;
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    throw error;
  }
}

/**
 * Crear una nueva reserva
 */
export async function createReserva(input: any): Promise<Reserva> {
  try {
    const { data } = await client.mutate({
      mutation: CREATE_RESERVA,
      variables: { input },
    });
    return (data as any).createReserva;
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
}

/**
 * Actualizar una reserva
 */
export async function updateReserva(id: string, input: any): Promise<Reserva> {
  try {
    const { data } = await client.mutate({
      mutation: UPDATE_RESERVA,
      variables: { id, input },
    });
    return (data as any).updateReserva;
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    throw error;
  }
}

/**
 * Cancelar una reserva
 */
export async function cancelReserva(id: string): Promise<Reserva> {
  try {
    const { data } = await client.mutate({
      mutation: CANCEL_RESERVA,
      variables: { id },
    });
    return (data as any).cancelReserva;
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    throw error;
  }
}

/**
 * Crear un nuevo restaurante
 */
export async function createRestaurante(input: any): Promise<Restaurante> {
  try {
    const { data } = await client.mutate({
      mutation: CREATE_RESTAURANTE,
      variables: { input },
    });
    return (data as any).createRestaurante;
  } catch (error) {
    console.error('Error al crear restaurante:', error);
    throw error;
  }
}

// Exportar cliente Apollo para uso avanzado
export { client as apolloClient };

// Tipos para TypeScript
export interface Restaurante {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  capacidadTotal: number;
}

export interface Menu {
  id: string;
  nombre: string;
  descripcion: string;
  precioTotal: number;
  disponible: boolean;
}

export interface Plato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
}

export interface Reserva {
  id: string;
  clienteId: string;
  mesaId: string;
  fecha: string;
  hora: string;
  numeroPersonas: number;
  estado: string;
}

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: string;
  ubicacion: string;
}
