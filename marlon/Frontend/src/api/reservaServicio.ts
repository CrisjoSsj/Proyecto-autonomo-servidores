import axios from "axios";
import type { IreservaServicio } from "../interfaces/reservaServicio";
import { createApiClient, getAuthHeader } from "./axiosConfig";

const ReservaServicioApi = createApiClient("http://localhost:8000/api_rest/api/v1/reservaServicio/", 'Bearer');

export const createReservaServicio = (data: IreservaServicio, token: string) => ReservaServicioApi.post("/", data, {headers: { Authorization: getAuthHeader(token) },});
export const deleteReservaServicio = (id: number, token: string) =>
  ReservaServicioApi.delete(`/${id}/`, {
    headers: { Authorization: getAuthHeader(token) },
  });
export const getReservaServiciosByReserva = (reservaId: number, token: string) =>
  ReservaServicioApi.get(`/?reserva_id=${reservaId}`, {
    headers: { Authorization: getAuthHeader(token) },
  });

export const getReservaServiciosByProveedor = (proveedorId: number, token: string) =>
  ReservaServicioApi.get(`/?proveedor_id=${proveedorId}`, {
    headers: { Authorization: getAuthHeader(token) },
  });

  
export const updateReservaServicio = (id: number, data: Partial<IreservaServicio>, token: string) => ReservaServicioApi.patch(`/${id}/`, data, {headers: { Authorization: getAuthHeader(token) },});

export const getReservaServicioById = (id: number, token: string) =>
    ReservaServicioApi.get(`/${id}/`, { headers: { Authorization: getAuthHeader(token) } });