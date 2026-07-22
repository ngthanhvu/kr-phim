export type WatchHistoryItem = {
  source: string
  slug: string
  name: string
  originName?: string
  thumb?: string
  poster?: string
  episodeName?: string
  episodeIndex?: number
  serverIndex?: number
  progressSeconds?: number
  durationSeconds?: number
  updatedAt?: number
}

const watchHistoryKey = 'cinek-watch-history'
const legacyWatchHistoryKey = 'kr-phim-watch-history'

function normalizeHistoryItem(item: any): WatchHistoryItem | null {
  const slug = item?.slug
  const name = item?.name

  if (!slug || !name) return null

  return {
    source: String(item.source || ''),
    slug: String(slug),
    name: String(name),
    originName: item.originName || item.origin_name || undefined,
    thumb: item.thumb || undefined,
    poster: item.poster || undefined,
    episodeName: item.episodeName || item.episode_name || undefined,
    episodeIndex: Number(item.episodeIndex ?? item.episode_index ?? 0),
    serverIndex: Number(item.serverIndex ?? item.server_index ?? 0),
    progressSeconds: Math.max(Number(item.progressSeconds ?? item.progress_seconds ?? 0), 0),
    durationSeconds: Math.max(Number(item.durationSeconds ?? item.duration_seconds ?? 0), 0),
    updatedAt: typeof item.updatedAt === 'number'
      ? item.updatedAt
      : new Date(item.updated_at || Date.now()).getTime(),
  }
}

function readLocalHistory() {
  if (!import.meta.client) return []

  try {
    const raw = window.localStorage.getItem(watchHistoryKey) || window.localStorage.getItem(legacyWatchHistoryKey)
    const history = raw ? JSON.parse(raw) : []

    return Array.isArray(history)
      ? history
        .map(normalizeHistoryItem)
        .filter(Boolean) as WatchHistoryItem[]
      : []
  } catch {
    return []
  }
}

function writeLocalHistory(items: WatchHistoryItem[]) {
  if (!import.meta.client) return
  window.localStorage.setItem(watchHistoryKey, JSON.stringify(items))
}

export function useWatchHistory() {
  async function loadWatchHistory(limit = 12) {
    const localItems = readLocalHistory()

    return localItems
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, limit)
  }

  async function saveWatchHistory(item: WatchHistoryItem) {
    const normalizedItem = normalizeHistoryItem({
      ...item,
      updatedAt: item.updatedAt || Date.now(),
    })

    if (!normalizedItem) return

    const localItems = [
      normalizedItem,
      ...readLocalHistory().filter((historyItem) => !(historyItem.slug === normalizedItem.slug && historyItem.source === normalizedItem.source)),
    ].slice(0, 20)

    writeLocalHistory(localItems)
  }

  async function clearWatchHistory() {
    if (import.meta.client) {
      window.localStorage.removeItem(watchHistoryKey)
      window.localStorage.removeItem(legacyWatchHistoryKey)
    }
  }

  return {
    loadWatchHistory,
    saveWatchHistory,
    clearWatchHistory,
  }
}
