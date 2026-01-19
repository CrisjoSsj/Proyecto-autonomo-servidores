import axios from "axios";
import type { Iservicio } from "../interfaces/servicio";
import { createApiClient, getAuthHeader } from "./axiosConfig";

// Base URL apuntando al endpoint correcto
const servicioApi = createApiClient("http://127.0.0.1:8000/api_rest/api/v1/servicio/", 'Bearer');

// Crear un nuevo servicio
export const createServicio = (servicio: Partial<Iservicio>, token: string) => {
  return servicioApi.post("/", servicio, {
    headers: {
      Authorization: getAuthHeader(token),
      "Content-Type": "application/json",
    },
  });
};


export const getServicioByProveedor = (proveedorId: number, token: string) => servicioApi.get(`/?proveedor_id=${proveedorId}`, {headers: {Authorization: getAuthHeader(token)}});
export const getAllServicios = (token: string) => servicioApi.get("/", {headers: {Authorization: getAuthHeader(token)}});
export const getServicioById = (id: number, token: string) => servicioApi.get(`/${id}/`, {headers: {Authorization: getAuthHeader(token)}});
export const deleteServicio = (id: number, token: string) => servicioApi.delete(`/${id}/`, {headers: {Authorization: getAuthHeader(token)}});
export const updateServicio = (id: number, servicio: Partial<Iservicio>, token: string) => servicioApi.patch(`/${id}/`, servicio, { headers: {Authorization: getAuthHeader(token)} });