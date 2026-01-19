import axios from "axios";
import type { IclienteRegister } from "../interfaces/cliente";
import type { IproveedorRegister } from "../interfaces/proveedor";
import { createApiClient, getAuthHeader, isJWT } from "./axiosConfig";
import { parseJwt } from "../utils/jwt";

const clienteApi = createApiClient("http://127.0.0.1:8000/api_rest/api/v1/cliente/", 'Bearer');

const proveedorApi = createApiClient("http://127.0.0.1:8000/api_rest/api/v1/proveedor/", 'Bearer');

const profileApi = createApiClient("http://localhost:3000", 'Bearer');

// getUsers: si token es JWT (auth-service) llamamos a /users/me en auth-service
export const getUsers = (token: string | null) => {
    if (!token) return Promise.reject(new Error('No token provided'));
    // Si parece JWT, llamar al auth-service
    if (isJWT(token)) {
        return profileApi.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
    }
    // Si no es JWT, seguir usando el endpoint Django antiguo
    return createApiClient('http://127.0.0.1:8000/api_rest/profile/', 'Token').get('/', { headers: { Authorization: `Token ${token}` } });
}

export const getCliente = (id: number) => clienteApi.get(`/${id}/`);
export const updateCliente = (id: number, cliente: Partial<IclienteRegister>, token: string) =>
    clienteApi.patch(`/${id}/`, cliente, { headers: { Authorization: getAuthHeader(token) } });

export const getProveedor = (id: number) => proveedorApi.get(`/${id}/`);
export const updateProveedor = (id: number, proveedor: Partial<IproveedorRegister>, token: string) =>
    proveedorApi.patch(`/${id}/`, proveedor, { headers: { Authorization: getAuthHeader(token) } });

// Nuevo endpoint para actualizar perfil usando JWT (crea registro si no existe)
const djangoProfileApi = createApiClient("http://127.0.0.1:8000/api_rest/", 'Bearer');
export const updateProfileByJwt = (payload: any, token: string) =>
    djangoProfileApi.patch('profile/update/', payload, { headers: { Authorization: `Bearer ${token}` } });

// Intentos de obtener datos públicos desde el servicio Django sin enviar Authorization
export const getClientePublic = (id: number) => createApiClient('http://127.0.0.1:8000/api_rest/api/v1/cliente/', 'None').get(`/${id}/`);
export const getProveedorPublic = (id: number) => createApiClient('http://127.0.0.1:8000/api_rest/api/v1/proveedor/', 'None').get(`/${id}/`);
