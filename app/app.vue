<template>
  <UApp :locale="en">
    <NuxtLayout>
      <NuxtLoadingIndicator color="#0080FF" />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
<script setup lang="ts">
import { en } from '@nuxt/ui/locale'

const { subscribe } = await useAuth()

subscribe()

</script>
