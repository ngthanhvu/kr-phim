export type LibraryMovieItem = {
  source: string
  slug: string
  name: string
  originName?: string
  thumb?: string
  poster?: string
  updatedAt?: number
}

const favoriteKey = 'cinek-favorites'
const watchLaterKey = 'cinek-watch-later'
const legacyFavoriteKey = 'kr-phim-favorites'
const legacyWatchLaterKey = 'kr-phim-watch-later'

function normalizeLibraryItem(item: any): LibraryMovieItem | null {
  if (!item?.slug || !item?.name) return null

  return {
    source: String(item.source || ''),
    slug: String(item.slug),
    name: String(item.name),
    originName: item.originName || item.origin_name || undefined,
    thumb: item.thumb || undefined,
    poster: item.poster || undefined,
    updatedAt: typeof item.updatedAt === 'number'
      ? item.updatedAt
      : new Date(item.updated_at || Date.now()).getTime(),
  }
}

function readLocalItems(key: string, legacyKey?: string) {
  if (!import.meta.client) return []

  try {
    const raw = window.localStorage.getItem(key) || (legacyKey ? window.localStorage.getItem(legacyKey) : null)
    const items = raw ? JSON.parse(raw) : []

    return Array.isArray(items)
      ? items.map(normalizeLibraryItem).filter(Boolean) as LibraryMovieItem[]
      : []
  } catch {
    return []
  }
}

function writeLocalItems(key: string, items: LibraryMovieItem[]) {
  if (!import.meta.client) return
  window.localStorage.setItem(key, JSON.stringify(items))
}

function legacyKeyFor(key: string) {
  if (key === favoriteKey) return legacyFavoriteKey
  if (key === watchLaterKey) return legacyWatchLaterKey
  return undefined
}

export function useMovieLibrary() {
  async function loadItems(key: string, limit = 30) {
    const localItems = readLocalItems(key, legacyKeyFor(key))

    return localItems
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, limit)
  }

  async function saveItem(key: string, item: LibraryMovieItem) {
    const normalizedItem = normalizeLibraryItem({
      ...item,
      updatedAt: Date.now(),
    })

    if (!normalizedItem) return false

    const nextItems = [
      normalizedItem,
      ...readLocalItems(key, legacyKeyFor(key)).filter((savedItem) => !(savedItem.slug === normalizedItem.slug && savedItem.source === normalizedItem.source)),
    ].slice(0, 50)

    writeLocalItems(key, nextItems)

    return true
  }

  async function removeItem(key: string, item: LibraryMovieItem) {
    const nextItems = readLocalItems(key, legacyKeyFor(key))
      .filter((savedItem) => !(savedItem.slug === item.slug && savedItem.source === item.source))
    writeLocalItems(key, nextItems)
  }

  async function isSaved(key: string, item: LibraryMovieItem) {
    return readLocalItems(key, legacyKeyFor(key))
      .some((savedItem) => savedItem.slug === item.slug && savedItem.source === item.source)
  }

  return {
    loadFavorites: (limit?: number) => loadItems(favoriteKey, limit),
    saveFavorite: (item: LibraryMovieItem) => saveItem(favoriteKey, item),
    removeFavorite: (item: LibraryMovieItem) => removeItem(favoriteKey, item),
    isFavorite: (item: LibraryMovieItem) => isSaved(favoriteKey, item),
    saveWatchLater: (item: LibraryMovieItem) => saveItem(watchLaterKey, item),
  }
}
