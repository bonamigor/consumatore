export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated || auth.isExpired()) {
    auth.clearSession()
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
