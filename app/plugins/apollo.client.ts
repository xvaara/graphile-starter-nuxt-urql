import type { NormalizedCacheObject } from '@apollo/client/core'
import type { Client as WSClient } from 'graphql-ws'
import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'

import { onError } from '@apollo/client/link/error'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { logErrorMessages } from '@vue/apollo-util'
import { createClient as createWSClient } from 'graphql-ws'

const ssrKey = '__apollo_ssr__'

export default defineNuxtPlugin((nuxt) => {
  const { vueApp } = nuxt
  const rootUrl = useRuntimeConfig().public.rootUrl || 'http://localhost:3000'

  // Cache implementation
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        queryType: true,
      },
    },
  })

  // when app is created in browser, restore SSR state from nuxt payload
  if (import.meta.client) {
    nuxt.hook('app:created', () => {
      cache.restore(nuxt.payload[ssrKey] as NormalizedCacheObject)
    })
  }

  // when app has rendered in server, send SSR state to client
  if (import.meta.server) {
    nuxt.hook('app:rendered', () => {
      nuxt.payload[ssrKey] = cache.extract()
    })
  }
  const { csrf } = useCsrf()
  const headers = useRequestHeaders(['cookie', 'authorization'])

  // HTTP connection to the API
  const httpLink = createHttpLink({
    // You should use an absolute URL here
    uri: `${rootUrl}/api/graphql`,
    headers: {
      ...headers,
      'csrf-token': csrf,
    },
  })
  const wsClient = createWSClient({
    url: `${rootUrl}/api/graphql/ws`,
    connectionParams: {
      headers: {
        ...headers,
        'csrf-token': csrf,
      },
    },
  })
  const wsLink = new GraphQLWsLink(wsClient)

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return (
        definition.kind === 'OperationDefinition'
        && definition.operation === 'subscription'
      )
    },
    wsLink,
    httpLink,
  )

  // Handle errors
  const errorLink = onError((error) => {
    const { graphQLErrors, networkError, operation } = error

    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}, Operation: ${operation.operationName}`,
        )
      })
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`)
    }

    // Still use the standard logging
    logErrorMessages(error)
  })

  const apolloClient = new ApolloClient({
    cache,
    link: errorLink.concat(splitLink),
    connectToDevTools: import.meta.dev,
    devtools: {
      enabled: import.meta.dev,
    },
  })

  nuxt.provide('apollo', apolloClient)
  nuxt.provide('apolloWSClient', wsClient)
  vueApp.provide(DefaultApolloClient, apolloClient)
})

declare module '#app' {
  interface NuxtApp {
    $apollo: ApolloClient<NormalizedCacheObject>
    $apolloWSClient: WSClient
  }
}
