export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated } = await useAuth()

  // If not authenticated and trying to access a protected route
  if (!isAuthenticated.value && (!['/', '/login', '/register'].includes(to.path)) && !to.meta.public) {
    return navigateTo({
      path: '/login',
      query: {
        returnTo: to.fullPath
      }
    })
  }

  // If authenticated and trying to access login/register
  if (isAuthenticated.value && ['/login', '/register'].includes(to.path)) {
    return navigateTo('/')
  }
})
