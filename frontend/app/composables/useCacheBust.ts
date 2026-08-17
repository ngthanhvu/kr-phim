// Composable để invalidate cached data sau khi edit phim ở admin
const BUST_KEY = 'cinek-cache-version'

function getCacheVersion(): number {
  if (!import.meta.client) return 0
  return Number(localStorage.getItem(BUST_KEY)) || 0
}

let currentVersion = getCacheVersion()

// Tăng version mỗi lần gọi — dùng để invalidate useFetch cache
export function useCacheBust() {
  const version = ref(currentVersion)

  function bust() {
    if (!import.meta.client) return
    currentVersion++
    localStorage.setItem(BUST_KEY, String(currentVersion))
    version.value = currentVersion
    // Dispatch event để các component khác biết cần refresh
    window.dispatchEvent(new CustomEvent('cinek:cache-bust', { detail: { version: currentVersion } }))
  }

  return { version, bust }
}

// Auto-refresh khi có cache bust từ phía admin
export function useAutoRefresh(onDataUpdated?: () => void) {
  const { version } = useCacheBust()

  watch(version, () => {
    onDataUpdated?.()
    if (import.meta.client) {
      window.dispatchEvent(new CustomEvent('cinek:data-updated'))
    }
  })
}