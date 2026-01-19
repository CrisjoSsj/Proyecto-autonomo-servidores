import axios from "axios";
import type { Ireserva } from "../interfaces/reserva";
import { createApiClient, getAuthHeader } from "./axiosConfig";

const reservaApi = createApiClient("http://127.0.0.1:8000/api_rest/api/v1/reserva/", 'Bearer')

export const createReserva = (reserva: Ireserva, token: string) => reservaApi.post("/", reserva, { headers: { Authorization: getAuthHeader(token) } });
export const getReservasByCliente = (clienteId: number, token: string) => reservaApi.get(`/?cliente_id=${clienteId}`, { headers: { Authorization: getAuthHeader(token) }, });
export const getAllReservas = (token: string) => reservaApi.get("/", {headers: { Authorization: getAuthHeader(token) }});
export const getReserva = (id: number, token: string | null) => reservaApi.get(`/${id}/`, {headers: { Authorization: token ? getAuthHeader(token) : '' }});
export const updateReserva = (id: number, data: any, token: string) => reservaApi.patch(`/${id}/`, data, {headers: { Authorization: getAuthHeader(token) }}); 