import { NgModule } from '@angular/core';
import { InMemoryCache, ServerError } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { ConfigService } from './config/config.service';
import { ApolloLink } from '@apollo/client/link/core';
import { onError } from '@apollo/client/link/error';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { Router } from '@angular/router';

export function createApollo(httpLink: HttpLink, config: ConfigService, router: Router) {
  const error = onError(({ networkError, graphQLErrors }) => {
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) => console.warn('[GraphQL error]', message, locations, path));
    }

    if (networkError) {
      console.warn('[Network error]', networkError);
    }

    if (
      graphQLErrors?.some(({ message }) => message === 'Access denied for unauthenticated user') ||
      (networkError as ServerError)?.statusCode === 401
    ) {
      // Clear session so they can re authenticate
      localStorage.removeItem('session');
      // Navigate to login
      const { url } = router.routerState.snapshot;
      if (!url.startsWith('/login')) {
        router.navigate(['/login'], { queryParams: { returnUrl: url } });
      }
    }
  });

  return {
    link: ApolloLink.from([
      error,
      httpLink.create({
        uri: config.apiUrl,
        withCredentials: true,
      }),
    ]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            userAlert(_, { args, toReference }) {
              return toReference({
                __typename: 'UserAlert',
                id: args?.alertId,
              });
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  };
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink, ConfigService, Router],
    },
  ],
})
export class GraphQLModule {}
