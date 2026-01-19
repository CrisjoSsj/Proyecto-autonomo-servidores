import type { Ilogin } from "../interfaces/login";
import { createApiClient } from "./axiosConfig";

const loginApi = createApiClient("http://localhost:3000")

export const login = (login: Ilogin) => loginApi.post("/auth/login", login);