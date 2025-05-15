import { createClient, ssrExchange, fetchExchange, type Client, type SSRData, subscriptionExchange } from '@urql/core';
import { cacheExchange as graphCacheExchange } from '@urql/exchange-graphcache'

import introspectionSchema from '../../utils/introspection';
import type { GraphCacheConfig } from '~~/app/utils/graphql';

import { createClient as createWSClient } from 'graphql-ws';


const ssrKey = '__URQL_DATA__'

export default defineNuxtPlugin(nuxt => {
  const { vueApp } = nuxt

  const ssr = ssrExchange({
    isClient: import.meta.client
  })


  // when app is created in browser, restore SSR state from nuxt payload
  if (import.meta.client) {
    nuxt.hook('app:created', () => {
      ssr.restoreData(nuxt.payload[ssrKey] as SSRData)
    })
  }

  // when app has rendered in server, send SSR state to client
  if (import.meta.server) {
    nuxt.hook('app:rendered', () => {
      nuxt.payload[ssrKey] = ssr.extractData()
    })
  }

  // use urql graphcache
  const cacheConfig: GraphCacheConfig = {
    schema: introspectionSchema,
    keys: {
      // Country: (data) => data.code || null
    },
    resolvers: {
      Query: {
        // country: (_, args) => ({__typename: "Country", code: args.code})
      }
    }
    // storage: process.client ? makeDefaultStorage() : undefined
  }
  const cache = graphCacheExchange(cacheConfig)

const wsClient = createWSClient({
  url: '/api/graphql/ws',
});

    const { csrf } = useCsrf();


  const rootUrl = useRuntimeConfig().public.rootUrl || 'http://localhost:3000'
  const headers = useRequestHeaders(['cookie', 'authorization'])
  const newClient = () => createClient({
    url: rootUrl + '/api/graphql',
    fetchOptions: {
      headers: {
        ...headers,
        'csrf-token': csrf,
      },
    },
    exchanges: [
      cache,
      ssr, // Add `ssr` in front of the `fetchExchange`
      fetchExchange,
      subscriptionExchange({
        forwardSubscription(request) {
          const input = { ...request, query: request.query || '' };
          return {
            subscribe(sink) {
              const unsubscribe = wsClient.subscribe(input, sink);
              return { unsubscribe };
            },
          };
        },
      }),
    ]
  })
  const client = ref(newClient())

  const refreshClient = () => {
    client.value = newClient()
  }

  nuxt.provide('urql', ref(client))
  vueApp.provide('$urql', ref(client))
  nuxt.provide('refreshClient', refreshClient)
})

declare module '#app' {
  interface NuxtApp {
    $urql: Client
    $refreshClient: () => void
  }
}
