import { apiFetch } from '~/utils/api'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return

  // Debug log
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
  console.log('[admin-middleware] path:', to.path, 'hasToken:', !!token)

  let user = null
  try {
    user = await apiFetch('/api/auth/me')
    console.log('[admin-middleware] user fetched:', user)
  } catch (err: any) {
    console.error('[admin-middleware] fetch failed:', err?.message || err)
    // Không đăng nhập → redirect về login
    return navigateTo('/admin/login')
  }

  if (!user) {
    console.warn('[admin-middleware] no user:', user)
    return navigateTo('/admin/login')
  }

  if (user.role !== 'admin') {
    console.warn('[admin-middleware] not admin:', user.role)
    return navigateTo('/')
  }
})
