export function useAuth() {
  const nuxtApp = useNuxtApp()
  const client = nuxtApp.$apollo

  // Ensure we're in a Vue lifecycle context
  if (!getCurrentInstance()) {
    throw new Error('useUser must be called within a Vue component setup function')
  }

  const { result, refetch, onResult } = useSharedQuery()

  const user = import.meta.client ? useState<SharedLayout_UserFragment | null>('user', () => result.value?.currentUser as SharedLayout_UserFragment | null) : ref<SharedLayout_UserFragment | null>(result.value?.currentUser as SharedLayout_UserFragment | null)

  onResult(({ data }) => {
    if (data?.currentUser) {
      user.value = data?.currentUser as SharedLayout_UserFragment
    }
  })

  function subscribe() {
    const { onResult: onCurrentUserUpdated } = useCurrentUserUpdatedSubscription({ enabled: toRef(() => !!user.value) })
    onCurrentUserUpdated(({ data }) => {
      if (data?.currentUserUpdated?.user) {
        user.value = data?.currentUserUpdated?.user as SharedLayout_UserFragment
      }
    })
  }
  if (import.meta.client) {
    callOnce('subscribe', subscribe)
  }
  function logout() {
    return client
      .mutate({ mutation: LogoutDocument })
      .then(async () => {
        client.resetStore()
        nuxtApp.$apolloWSClient.terminate()
        const toast = useToast()
        user.value = null

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
  async function refetchUser() {
    await refetch()
    user.value = result.value?.currentUser as SharedLayout_UserFragment
  }

  return {
    isAuthenticated: computed(() => !!user.value),
    user,
    subscribe,
    logout,
    refetchUser,
  }
}
