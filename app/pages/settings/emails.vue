<script setup lang="ts">
definePageMeta({ public: false })
const toast = useToast()

const { result, loading, error } = useSettingsEmailsQuery()
const showAddEmailForm = ref(false)
const newEmail = ref('')
const addEmailError = ref('')

const { mutate: addEmailMutation } = useAddEmailMutation()
async function addEmail() {
  addEmailError.value = ''
  try {
    await addEmailMutation({ email: newEmail.value })
    showAddEmailForm.value = false
    newEmail.value = ''
  }
  catch (e: Error | unknown) {
    addEmailError.value = e instanceof Error ? e.message : String(e)
  }
}
const { mutate: deleteEmailMutation } = useDeleteEmailMutation()
async function deleteEmail(id: string) {
  try {
    await deleteEmailMutation({ emailId: id })
  }
  catch (e: Error | unknown) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : String(e),
    })
  }
}
const { mutate: makePrimaryMutation } = useMakeEmailPrimaryMutation()
async function makePrimary(id: string) {
  try {
    await makePrimaryMutation({ emailId: id })
  }
  catch (e: Error | unknown) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : String(e),
    })
  }
}
const { mutate: resendVerificationMutation } = useResendEmailVerificationMutation()
async function resendVerification(id: string) {
  try {
    await resendVerificationMutation({ emailId: id })
  }
  catch (e: Error | unknown) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : String(e),
    })
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-10">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">
          Email addresses
        </h1>
      </template>
      <div v-if="loading">
        Loading...
      </div>
      <div v-else-if="error">
        Error loading emails
      </div>
      <ul v-else class="space-y-4">
        <li v-for="email in result?.currentUser?.userEmails?.nodes || []" :key="email.id" class="flex items-center justify-between">
          <span>
            {{ email.email }}
            <span v-if="email.isPrimary">(Primary)</span>
            <span v-else-if="!email.isVerified" class="text-red-500">(unverified)</span>
          </span>
          <div class="flex gap-2">
            <UButton v-if="!email.isPrimary && (result?.currentUser?.userEmails?.nodes && result.currentUser.userEmails.nodes.length > 1)" color="error" @click="deleteEmail(email.id)">
              Delete
            </UButton>
            <UButton v-if="!email.isVerified" color="primary" @click="resendVerification(email.id)">
              Resend verification
            </UButton>
            <UButton v-if="email.isVerified && !email.isPrimary" color="primary" @click="makePrimary(email.id)">
              Make primary
            </UButton>
          </div>
        </li>
      </ul>
      <div class="mt-6">
        <UButton v-if="!showAddEmailForm" color="primary" @click="showAddEmailForm = true">
          Add email
        </UButton>
        <form v-else class="flex gap-2 items-center" @submit.prevent="addEmail">
          <UInput v-model="newEmail" placeholder="New email" required />
          <UButton type="submit" color="primary">
            Add
          </UButton>
          <UButton type="button" color="neutral" @click="showAddEmailForm = false">
            Cancel
          </UButton>
        </form>
        <div v-if="addEmailError" class="text-red-500 mt-2">
          {{ addEmailError }}
        </div>
      </div>
    </UCard>
  </div>
</template>
