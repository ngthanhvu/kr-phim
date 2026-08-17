const STORAGE_KEY = 'app-settings-cache'

interface SettingsCache {
  data: any
  timestamp: number
}

export function useAppSettings() {
  const settings = useState<any>('app-settings', () => null)
  const loading = useState('settings-loading', () => true)

  // Try to load cached settings from localStorage
  function getCachedSettings(): any | null {
    try {
      if (typeof localStorage === 'undefined') return null
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const cache: SettingsCache = JSON.parse(raw)
      // Cache lives for 5 minutes
      if (Date.now() - cache.timestamp < 5 * 60 * 1000) {
        const data = cache.data
        // Ensure correct types
        return {
          ...data,
          maintenanceMode: String(data.maintenanceMode) === '1' || String(data.maintenanceMode) === 'true',
          allowRegistration: String(data.allowRegistration) !== '0' && String(data.allowRegistration) !== 'false',
        }
      }
    } catch {}
    return null
  }

  function saveCachedSettings(data: any) {
    try {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }))
    } catch {}
  }

  async function loadSettings() {
    if (settings.value) return

    // First try cache
    const cached = getCachedSettings()
    if (cached) {
      settings.value = cached
      loading.value = false
      return
    }

    try {
      const { apiFetch } = await import('~/utils/api')
      const data: any = await apiFetch('/api/public/settings')
      saveCachedSettings(data)
      settings.value = {
        siteName: data.siteName || 'CineK',
        siteDescription: data.siteDescription || '',
        maintenanceMode: String(data.maintenanceMode) === '1' || String(data.maintenanceMode) === 'true',
        allowRegistration: String(data.allowRegistration) !== '0' && String(data.allowRegistration) !== 'false',
        siteLogo: data.siteLogo || '',
        siteFavicon: data.siteFavicon || '/favicon.ico',
        contactEmail: data.contactEmail || 'support@cinek.app',
        facebookUrl: data.facebookUrl || '',
        telegramUrl: data.telegramUrl || '',
        tiktokUrl: data.tiktokUrl || '',
        youtubeUrl: data.youtubeUrl || '',
        googleFont: data.googleFont || '',
      }
    } catch (err) {
      console.error('Failed to load app settings:', err)
      settings.value = {
        siteName: 'CineK',
        siteDescription: '',
        maintenanceMode: false,
        allowRegistration: true,
        siteLogo: '',
        siteFavicon: '/favicon.ico',
        contactEmail: 'support@cinek.app',
        facebookUrl: '',
        telegramUrl: '',
        tiktokUrl: '',
        youtubeUrl: '',
        googleFont: '',
      }
    } finally {
      loading.value = false
    }
  }

  // Listen for broadcast events when another tab changes settings
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'cinek-settings-refresh') {
        settings.value = null
        loadSettings()
      }
    })
  }

  return { settings, loading, loadSettings }
}

// Broadcast refresh event across tabs
export function refreshAppSettings() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('app-settings-cache')
    window.dispatchEvent(new StorageEvent('storage', { key: 'cinek-settings-refresh' }))
  }
}
