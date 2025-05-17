import type { NormalizedCacheObject } from '@apollo/client/core'
import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'

import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { logErrorMessages } from '@vue/apollo-util'
import { createClient as createWSClient } from 'graphql-ws'
import { pgl } from '../../server/graphserv/pgl'

import { GraphileApolloLink } from './lib/GraphileApolloLink'

const ssrKey = '__apollo_ssr__'

export default defineNuxtPlugin((nuxt) => {
  const { vueApp } = nuxt
  const rootUrl = useRuntimeConfig().public.rootUrl
  console.log('rootUrl', rootUrl)

  // Cache implementation
  const cache = new InMemoryCache()

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
      console.log('nuxt.payload[ssrKey]', nuxt.payload[ssrKey])
    })
  }

  // Handle errors
  const errorLink = onError((error) => {
    logErrorMessages(error)
  })
  if (!nuxt.ssrContext?.event) {
    throw new Error('No event')
  }
  const apolloClient = new ApolloClient({
    cache,
    link: errorLink.concat(
      new GraphileApolloLink({
        event: nuxt.ssrContext?.event,
        pgl,
      }),
    ),
  })

  nuxt.provide('apollo', apolloClient)
  vueApp.provide(DefaultApolloClient, apolloClient)
})

declare module '#app' {
  interface NuxtApp {
    $apollo: ApolloClient<NormalizedCacheObject>
  }
}
