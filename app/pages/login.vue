<script setup>
definePageMeta({
  layout: 'auth',
  public: true,
})

const toast = useToast()
const route = useRoute()

const state = reactive({
  email: '',
  password: '',
})

// Get returnTo from query and validate it's internal
const returnTo = computed(() => {
  const to = route.query.returnTo?.toString()
  // Only allow internal URLs (starting with /)
  return to?.startsWith('/') ? to : '/'
})

const { mutate: login, loading } = useLoginMutation()

async function handleSubmit() {
  try {
    const result = await login({
      username: state.username,
      password: state.password,
    })
    // console.log('Login result:', result)
    if (result.data.login?.user) {
      toast.add({
        title: 'Logged in successfully',
        description: `Welcome back, ${result.data.login.user.name}!`,
        icon: 'i-heroicons-check-circle',
        color: 'green',
      })
      await useAuth(true)
      navigateTo(returnTo.value)
    }
    else {
      toast.add({
        title: 'Login failed',
        description: result.error?.message || 'Invalid credentials',
        icon: 'i-heroicons-exclamation-circle',
        color: 'red',
      })
    }
  }
  catch (e) {
    console.error('Login error:', e)
    const code = getCodeFromError(e)
    toast.add({
      title: 'An error occurred',
      description: `Please try again later. Error code: ${code}`,
      icon: 'i-heroicons-exclamation-circle',
      color: 'red',
    })
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold text-center">
          Welcome Back
        </h1>
        <p class="text-gray-500 text-center mt-2">
          Sign in to your account
        </p>
      </template>

      <UForm :state="state" class="space-y-4" @submit="handleSubmit">
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.username"
            type="text"
            placeholder="username"
            icon="i-heroicons-envelope"
            :ui="{ icon: { trailing: { pointer: '' } } }"
            autocomplete="username"
            required
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            icon="i-heroicons-lock-closed"
            :ui="{ icon: { trailing: { pointer: '' } } }"
            autocomplete="current-password"
            required
          />
        </UFormField>

        <div class="flex justify-end mb-2">
          <UButton
            variant="link"
            color="primary"
            size="xs"
            to="#"
            class="!p-0"
          >
            Forgot password?
          </UButton>
        </div>

        <UButton
          type="submit"
          color="primary"
          block
          :loading="loading"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </UButton>
      </UForm>

      <template #footer>
        <div class="text-center">
          <span class="text-gray-500">Don't have an account? </span>
          <UButton
            variant="link"
            color="primary"
            to="/register"
            class="!p-0"
          >
            Create one
          </UButton>
        </div>
      </template>
    </UCard>

    <div class="mt-8 text-center text-gray-500 text-sm">
      <p>Demo accounts:</p>
      <p>Email: user@example.com | Password: password123</p>
      <p>Email: admin@example.com | Password: admin123</p>
    </div>
  </div>
</template>
