export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return

  const { data: user, error } = await useFetch('/api/auth/me', {
    headers: useRequestHeaders(['cookie']),
  })

  if (error.value?.statusCode === 401 || !user.value) {
    return navigateTo('/admin/login')
  }

  if (user.value.role !== 'admin') {
    return navigateTo('/')
  }
})
