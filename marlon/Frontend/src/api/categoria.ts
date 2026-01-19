import axios from "axios";
import { graphQLRequest } from "./graphql";
import { QUERY_CATEGORIAS } from "./graphqlQueries";
import { createApiClient } from "./axiosConfig";

const categoriaApi = createApiClient("http://127.0.0.1:8000/api_rest/api/v1/categoria/", 'Bearer')

export const getAllCategorias = () => categoriaApi.get("/");

export async function getCategorias() {
  return graphQLRequest({
    query: QUERY_CATEGORIAS,
    variables: { pagination: { limit: 50, offset: 0 } },
    token: localStorage.getItem("token")
  });
}
