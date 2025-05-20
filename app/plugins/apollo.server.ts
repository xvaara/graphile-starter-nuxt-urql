import type { NormalizedCacheObject } from '@apollo/client/core'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'

import { DefaultApolloClient } from '@vue/apollo-composable'
import { logErrorMessages } from '@vue/apollo-util'
import { pgl } from '../../server/graphserv/pgl'

import { GraphileApolloLink } from './lib/GraphileApolloLink'

const ssrKey = '__apollo_ssr__'

export default defineNuxtPlugin((nuxt) => {
  const { vueApp } = nuxt

  // Cache implementation
  const cache = new InMemoryCache()

  // when app is created in browser, restore SSR state from nuxt payload
  if (import.meta.client) {
    throw new Error('Apollo server plugin should not be used in the browser')
  }

  // when app has rendered in server, send SSR state to client
  if (import.meta.server) {
    nuxt.hook('app:rendered', () => {
      nuxt.payload[ssrKey] = cache.extract()
    })
  }

  // Handle errors
  const errorLink = onError((error) => {
    logErrorMessages(error)
  })
  if (!nuxt.ssrContext?.event) {
    throw new Error('No event found in Nuxt SSR context, which is required for GraphQL operations')
  }
  let graphileLink
  try {
    graphileLink = new GraphileApolloLink({
      event: nuxt.ssrContext?.event,
      pgl,
    })
  }
  catch (err) {
    console.error('Failed to create GraphileApolloLink:', err)
    if (err instanceof Error) {
      throw new TypeError(`Could not initialize GraphileApolloLink for ApolloClient: ${err.message}`)
    }
    throw new Error('Could not initialize GraphileApolloLink for ApolloClient')
  }
  const apolloClient = new ApolloClient({
    cache,
    link: errorLink.concat(graphileLink),
    ssrMode: true,
    connectToDevTools: import.meta.dev,
    devtools: {
      enabled: import.meta.dev,
    },
  })

  nuxt.provide('apollo', apolloClient)
  vueApp.provide(DefaultApolloClient, apolloClient)
})

declare module '#app' {
  interface NuxtApp {
    $apollo: ApolloClient<NormalizedCacheObject>
  }
}
