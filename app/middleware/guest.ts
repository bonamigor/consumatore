export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()

  if (auth.isAuthenticated && !auth.isExpired()) {
    return navigateTo('/')
  }
})
