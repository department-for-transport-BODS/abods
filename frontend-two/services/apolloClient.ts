import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  HttpLink,
  InMemoryCache,
  ServerError,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";

const signOutAndRedirect = () => {
  // Clear session so they can re authenticate
  localStorage.removeItem("session");
  // Navigate to login
  const pathname = window.location.pathname || "/";
  const search = window.location.search || "";

  if (!pathname.startsWith("/login")) {
    const returnUrl = encodeURIComponent(pathname + search);
    window.location.href = `/login?returnUrl=${returnUrl}`;
  }
};

export function createApolloClient() {
  const errorLink = new ErrorLink(({ error, operation }) => {
    if (ServerError.is(error)) {
      console.log(
        `Server returned status: ${error.statusCode} with response body: ${error.bodyText}`,
      );

      if (error.statusCode === 401) {
        signOutAndRedirect();
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
        uri: process.env.NEXT_GRAPHQL_API_BASE_URL,
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
