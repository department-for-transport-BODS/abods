import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  HttpLink,
  InMemoryCache,
  ServerError,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { clearUserScopedStorage } from "@/utils/authReset";

const signOutAndRedirect = () => {
  // Clear session so they can re authenticate
  clearUserScopedStorage();
  // Navigate to login
  const pathname = window.location.pathname || "/";
  const search = window.location.search || "";

  if (!pathname.startsWith("/login")) {
    const returnUrl = encodeURIComponent(pathname + search);
    window.location.href = `/login?returnUrl=${returnUrl}`;
  }
};

export function createApolloClient() {
  const apiUrl = process.env.NEXT_GRAPHQL_API_BASE_URL;

  if (!apiUrl) {
    console.error("NEXT_GRAPHQL_API_BASE_URL environment variable is not set");
    window.location.href = `/500`;
  }

  const errorLink = new ErrorLink(({ error, operation }) => {
    if (ServerError.is(error)) {
      console.log(
        `Server returned status: ${error.statusCode} with response body: ${error.bodyText}`,
      );

      if (error.statusCode === 401) {
        signOutAndRedirect();
      } else if (error.statusCode >= 500) {
        const pathname = window.location.pathname || "/";
        if (!pathname.startsWith("/500")) {
          window.location.href = "/500";
        }
      }
    } else if (CombinedGraphQLErrors.is(error)) {
      error.errors.forEach(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ),
      );
      if (error.errors.some((e) => e.extensions?.code === "UNAUTHENTICATED")) {
        signOutAndRedirect();
      }
    } else {
      console.error(`[Network error]: ${error}`);
    }
  });

  return new ApolloClient({
    link: ApolloLink.from([
      errorLink,
      new HttpLink({
        uri: apiUrl,
        credentials: "include",
      }),
    ]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            userAlert(_, { args, toReference }) {
              return toReference({
                __typename: "UserAlert",
                id: args?.alertId,
              });
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: { errorPolicy: "all" },
      query: { errorPolicy: "all" },
      mutate: { errorPolicy: "none" },
    },
  });
}

export const apolloClient = createApolloClient();
