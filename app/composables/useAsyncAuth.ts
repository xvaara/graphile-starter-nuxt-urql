import type { FetchPolicy, WatchQueryFetchPolicy } from '@apollo/client/core/watchQueryOptions'

export async function useAsyncAuth(fetchPolicy: WatchQueryFetchPolicy | FetchPolicy = 'cache-first'): Promise<{
  isAuthenticated: ComputedRef<boolean>
  user: ComputedRef<SharedLayout_UserFragment | null>
}> {
  const nuxtApp = useNuxtApp()
  const client = nuxtApp.$apollo
  const user = import.meta.client ? useState<SharedLayout_UserFragment | null>('user', () => null) : ref<SharedLayout_UserFragment | null>(null)

  if (!getCurrentInstance()) {
    if (fetchPolicy === 'cache-and-network') {
      fetchPolicy = 'cache-first'
    }
    const { data } = await client.query<SharedQuery>({ query: SharedDocument, fetchPolicy })
    user.value = data?.currentUser
    return {
      isAuthenticated: computed(() => !!user.value),
      user: computed(() => user.value),
    }
  }
  else {
    return new Promise((resolve) => {
      const { onResult } = useSharedQuery({ fetchPolicy })
      onResult(({ data }) => {
        user.value = data?.currentUser
        resolve({
          isAuthenticated: computed(() => !!user.value),
          user: computed(() => user.value),
        })
      })
    })
  }
}
