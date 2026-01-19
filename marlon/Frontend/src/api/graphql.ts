export type GraphQLRequestOptions = {
  query: string;
  variables?: Record<string, unknown>;
  token?: string | null;
  endpoint?: string;
};

export async function graphQLRequest<T = any>({
  query,
  variables,
  token,
  endpoint,
}: GraphQLRequestOptions): Promise<T> {
  const url = endpoint || (import.meta as any).env?.VITE_GRAPHQL_URL || "http://localhost:9090/query";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }>; };
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join(" | "));
  }
  if (!json.data) {
    throw new Error("GraphQL response missing data");
  }
  return json.data;
}


