export function useAuth() {
  const user = useState<any>('auth-user', () => null)
  const loading = useState('auth-loading', () => true)

  async function fetchUser() {
    try {
      loading.value = true
      const data = await $fetch('/api/auth/me')
      user.value = data
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  return { user, loading, fetchUser, logout }
}
