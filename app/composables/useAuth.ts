// initialized is only used on client side

import type { Subscription } from 'wonka'

let initialized = false
const globalUser = ref<SharedLayout_UserFragment | null>(null)
// let subscription: Subscription | null = null

export async function useAuth(refresh: boolean = false) {
  const nuxtApp = useNuxtApp()
  const client = nuxtApp.$apollo

  // Create a local ref on server side
  const user = import.meta.server ? ref<SharedLayout_UserFragment | null>(null) : globalUser

  // on the client side revalidate the current user
  if (!initialized || refresh) {
    const { data } = await client.query<SharedQuery>({ query: SharedDocument, variables: {}, options: { requestPolicy: refresh ? 'network-only' : (!initialized && import.meta.client) ? 'cache-and-network' : undefined } })
    if (data?.currentUser) {
      user.value = data?.currentUser
    }
    else {
      user.value = null
    }
    if (import.meta.client) {
      initialized = true
    }
  }

  function subscribe() {
    useCurrentUserUpdatedSubscription({ pause: computed(() => !user.value) })
  }
  async function logout() {
    return client
      .mutate({ mutation: LogoutDocument })
      .then(async () => {
        // await client.query(SharedDocument, {}, { requestPolicy: 'network-only' }).toPromise()
        user.value = null
        // if (subscription) {
        //   subscription.unsubscribe()
        //   subscription = null
        // }
        client.resetStore()
        initialized = false
        const toast = useToast()

        toast.add({
          title: 'Logged out',
          description: 'You have been successfully logged out',
          icon: 'i-heroicons-check-circle',
          color: 'success',
        })
        // nuxtApp.$refreshClient()
        navigateTo('/')
      })
  }

  return {
    isAuthenticated: computed(() => !!unref(user)),
    user: import.meta.server ? readonly(user) : user,
    subscribe,
    logout,
  }
}
