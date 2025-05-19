<script setup lang="ts">
definePageMeta({ public: false })
</script>

<template>
  <div class="max-w-2xl mx-auto py-10">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">
          Settings
        </h1>
      </template>
      <ul class="space-y-4">
        <li>
          <NuxtLink to="/settings/" class="text-primary hover:underline">
            Profile
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/settings/accounts" class="text-primary hover:underline">
            Linked Accounts
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/settings/emails" class="text-primary hover:underline">
            Emails
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/settings/security" class="text-primary hover:underline">
            Security
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/settings/delete" class="text-red-600 hover:underline">
            Delete Account
          </NuxtLink>
        </li>
      </ul>
      <NuxtPage />
    </UCard>
  </div>
</template>
