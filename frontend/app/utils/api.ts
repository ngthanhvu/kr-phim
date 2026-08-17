/**
 * API wrapper — tất cả gọi /api/* đều qua Express backend
 */

export function getBaseUrl(): string {
  // Client-only app (SSR false), dùng runtime config hoặc fallback tương đối
  if (typeof window !== 'undefined') {
    const nuxtConfig = (window as any).__NUXT__?.config?.public
    if (nuxtConfig?.backendUrl) return nuxtConfig.backendUrl
  }
  return ''
}

function getAuthToken(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

export async function apiFetch(path: string, options?: Record<string, any>) {
  const url = `${getBaseUrl()}${path}`
  const opts: Record<string, any> = { ...options }

  // Build headers properly
  const headers: Record<string, string> = { ...opts.headers }

  // Always include auth token from localStorage or cookie
  if (typeof localStorage !== 'undefined') {
    const localToken = localStorage.getItem('auth_token')
    if (localToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${localToken}`
    }
  }
  // Also check for cookie-based token as fallback
  if (typeof document !== 'undefined' && !headers['Authorization']) {
    const match = document.cookie.match(/token=([^;]+)/)
    if (match) {
      headers['Cookie'] = `token=${decodeURIComponent(match[1])}`
    }
  }

  opts.headers = headers

  // Forward cookies from client request during SSR/server execution
  if (import.meta.server) {
    try {
      const reqHeaders = useRequestHeaders(['cookie']) as Record<string, string>
      if (reqHeaders?.cookie) {
        opts.headers = {
          cookie: reqHeaders.cookie,
          ...opts.headers,
        }
      }
    } catch {}
  }

  if (!opts.credentials && !opts._bypassCredentials) {
    opts.credentials = 'include'
  }
  
  console.log('[apiFetch]', path, 'hasAuth:', !!headers['Authorization'])
  return $fetch(url, opts)
}

export function apiUrl(path: string): string {
  return `${getBaseUrl()}${path}`
}
