import axios from 'axios';
import type { IclienteRegister } from '../interfaces/cliente';
import type { IproveedorRegister } from '../interfaces/proveedor';
import { createApiClient } from './axiosConfig';

const clienteApi = createApiClient('http://127.0.0.1:8000/api_rest/api/v1/cliente/', 'Bearer');

const proveedorApi = createApiClient('http://127.0.0.1:8000/api_rest/api/v1/proveedor/', 'Bearer');

const authApi = createApiClient('http://localhost:3000', 'Bearer');



export const registerCliente = (cliente: IclienteRegister) => clienteApi.post('/', cliente);

export const registerProveedor = (proveedor: IproveedorRegister) => proveedorApi.post('/', proveedor);

// Registro en el auth-service centralizado. Devuelve tokens si se crea correctamente.
export const registerAuth = (payload: any) => authApi.post('/auth/register', payload);

// Sincronizar creación de cliente/proveedor en el backend Django a través del auth-service
export const registerSync = (payload: any) => authApi.post('/users/sync', payload);