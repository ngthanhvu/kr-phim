export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path !== '/thanh-vien') return

  const { data: user, error } = await useFetch('/api/auth/me', {
    headers: useRequestHeaders(['cookie']),
  })

  if (error.value?.statusCode === 401 || !user.value) {
    return navigateTo('/')
  }
})
