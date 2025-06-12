<script setup lang="ts">
import { en } from '@nuxt/ui/locale'

const { subscribe } = useAuth()
if (import.meta.client) {
  callOnce('auth:subscribe', subscribe)
}
</script>

<template>
  <UApp :locale="en">
    <NuxtLayout>
      <NuxtLoadingIndicator color="#0080FF" />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
