export interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export const graphqlRequest = async <T>(
  apiUrl: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> => {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed (${response.status})`);
  }

  const payload = (await response.json()) as GraphqlResponse<T>;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "GraphQL error");
  }

  if (!payload.data) {
    throw new Error("Empty GraphQL response");
  }

  return payload.data;
};
