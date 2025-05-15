// initialized is only used on client side

import type { Subscription } from 'wonka'

let initialized = false
const globalUser = ref<SharedLayout_UserFragment | null>(null)
let subscription: Subscription | null = null

export async function useAuth(refresh:boolean = false) {
  const nuxtApp = useNuxtApp()
  const client = unref(nuxtApp.$urql)

  // Create a local ref on server side
  const user = import.meta.server ? ref<SharedLayout_UserFragment | null>(null) : globalUser

  // on the client side revalidate the current user
  if (!initialized || refresh) {
    await new Promise((resolve) => {
      if (subscription) {
        subscription.unsubscribe()
        subscription = null
      }
      subscription = client.query<SharedQuery>(SharedDocument, {}, { requestPolicy: refresh ? 'network-only' : (!initialized && import.meta.client) ? 'cache-and-network' : undefined }).subscribe((result) => {
        if (result.error) {
          console.error('Error fetching current user', result.error)
        }
      if (result.data?.currentUser) {
        user.value = result.data?.currentUser
      } else {
        user.value = null
        }
        resolve(result)
        return result
      })
    })
    if (import.meta.client) {
      initialized = true
    }
  }

  function subscribe() {
    useCurrentUserUpdatedSubscription({pause: computed(() => !user.value)}, )
  }
  async function logout() {
    return client
      .mutation(LogoutDocument, {})
      .toPromise()
      .then(async () => {

        // await client.query(SharedDocument, {}, { requestPolicy: 'network-only' }).toPromise()
        user.value = null
        if (subscription) {
          subscription.unsubscribe()
          subscription = null
        }
        initialized = false
        const toast = useToast()

        toast.add({
          title: 'Logged out',
          description: 'You have been successfully logged out',
          icon: 'i-heroicons-check-circle',
          color: 'success'
        })
        nuxtApp.$refreshClient()
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
