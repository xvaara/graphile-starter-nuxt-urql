<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { result, loading, error } = useOrganizationPageQuery({ slug: slug.value })

// Throw 404 error if organization not found, but only after the query completes
watchEffect(() => {
  console.log('onResult', result.value, loading.value, error.value)
  if (!loading.value && result.value && !result.value.organizationBySlug) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Organization Not Found',
      message: 'The organization you are looking for does not exist.',
      fatal: true,
    })
  }
})
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold text-center">
          {{ result?.organizationBySlug?.name || slug }}
        </h1>
      </template>
      <div v-if="loading" class="text-center py-8">
        <span class="i-heroicons-arrow-path animate-spin text-2xl" /> Loading organization...
      </div>
      <div v-else-if="error" class="text-red-500 text-center py-8">
        {{ error.message }}
      </div>
      <div v-else>
        <div class="mb-4 text-center">
          <div class="font-bold">
            Dashboard
          </div>
          <UButton
            v-if="result?.organizationBySlug?.currentUserIsOwner"
            color="primary"
            class="mt-4"
            :to="`/o/${slug}/settings`"
          >
            Organization Settings
          </UButton>
          <!-- Add more organization details here -->
        </div>
      </div>
    </UCard>
  </div>
</template>
