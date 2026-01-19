import axios from "axios";
import type { Ifoto } from "../interfaces/foto";
import { createApiClient, getAuthHeader } from "./axiosConfig";

const fotoApi = createApiClient("http://127.0.0.1:8000/api_rest/api/v1/fotoServicio/", 'Bearer')

export const createFotoServicio = (foto: Ifoto, token: string) => fotoApi.post("/", foto, {headers: {Authorization: getAuthHeader(token)}});
export const getFotosByServicio = (servicioId: number, token: string) => fotoApi.get(`/?servicio_id=${servicioId}`, {headers: { Authorization: getAuthHeader(token) },});
export const deleteFotoServicio = (fotoId: number, token: string) => fotoApi.delete(`/${fotoId}/`, {headers: { Authorization: getAuthHeader(token) },});
export const updateFotoServicio = (fotoId: number, foto: Ifoto, token: string) => fotoApi.put(`/${fotoId}/`, foto, {headers: { Authorization: getAuthHeader(token) },});