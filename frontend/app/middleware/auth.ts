import { apiFetch } from '~/utils/api'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path !== '/thanh-vien') return

  let user = null
  try {
    user = await apiFetch('/api/auth/me')
  } catch {
    return navigateTo('/')
  }

  if (!user) {
    return navigateTo('/')
  }
})
