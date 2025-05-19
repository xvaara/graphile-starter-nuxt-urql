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
  // const rootUrl = useRuntimeConfig().public.rootUrl

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
    ssrMode: true,
  })

  nuxt.provide('apollo', apolloClient)
  vueApp.provide(DefaultApolloClient, apolloClient)
})

declare module '#app' {
  interface NuxtApp {
    $apollo: ApolloClient<NormalizedCacheObject>
  }
}
