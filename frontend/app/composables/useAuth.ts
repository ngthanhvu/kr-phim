import { apiFetch } from '~/utils/api'

export function useAuth() {
  const user = useState<any>('auth-user', () => null)
  const loading = useState('auth-loading', () => true)

  async function fetchUser() {
    try {
      loading.value = true
      const data = await apiFetch('/api/auth/me')
      user.value = data
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    user.value = null
  }

  return { user, loading, fetchUser, logout }
}
