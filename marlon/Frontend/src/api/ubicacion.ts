import axios from "axios";
import type { Iubicacion } from "../interfaces/ubicacion";
import { createApiClient, getAuthHeader } from "./axiosConfig";

const ubicacionApi = createApiClient("http://127.0.0.1:8000/api_rest/api/v1/ubicacion/", 'Bearer')

export const getAllUbicaciones = () => ubicacionApi.get("/");
export const updateUbicacion = (id: number, ubicacion: Partial<Iubicacion>, token: string) => ubicacionApi.patch(`/${id}/`, ubicacion, {  headers: { Authorization: getAuthHeader(token)} });
export const createUbicacion = (ubicacion: Partial<Iubicacion>, token: string) => ubicacionApi.post("/", ubicacion, {  headers: { Authorization: getAuthHeader(token)} });
export const deleteUbicacion = (id: number, token: string) => ubicacionApi.delete(`/${id}/`, {  headers: { Authorization: getAuthHeader(token)} });