import { createClient, ssrExchange, fetchExchange, type Client, type SSRData,  } from '@urql/core';
import { grafastExchange } from './lib/grafastExchange';
import { defineNuxtPlugin } from '#app'

// import { createClient as createWSClient } from 'graphql-ws';

import { pgl } from '../../server/graphserv/pgl'


const ssrKey = '__URQL_DATA__'

export default defineNuxtPlugin(async nuxt => {
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



  const { csrf } = useCsrf();
  const headers = useRequestHeaders(['cookie', 'authorization'])


  const rootUrl = useRuntimeConfig().public.rootUrl || 'http://localhost:3000'
  const client = createClient({
    url: rootUrl + '/api/graphql',
    fetchOptions: {
      headers: {
        ...headers,
        'csrf-token': csrf,
      },
    },


    exchanges: [
      // debugExchange,
      // cache,
      ssr, // Add `ssr` in front of the `fetchExchange`
      ...nuxt.ssrContext?.event
        ? [grafastExchange(pgl, { h3v1: { event: nuxt.ssrContext.event } })]
        : [fetchExchange]

    ]
  })

  nuxt.provide('urql', client)
  vueApp.provide('$urql', ref(client))

})

declare module '#app' {
  interface NuxtApp {
    $urql: Client
  }
}
