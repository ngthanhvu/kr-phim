export type CommentDraft = {
  slug: string
  source: string
  content: string
  movieName?: string
  savedAt: number
}

const draftKey = 'cinek-comment-drafts'

function readDrafts(): CommentDraft[] {
  if (!import.meta.client) return []
  try {
    const raw = window.localStorage.getItem(draftKey)
    const drafts = raw ? JSON.parse(raw) : []
    return Array.isArray(drafts) ? drafts : []
  } catch {
    return []
  }
}

function writeDrafts(drafts: CommentDraft[]) {
  if (!import.meta.client) return
  window.localStorage.setItem(draftKey, JSON.stringify(drafts))
}

function findDraftKey(slug: string, source: string) {
  return `${source}::${slug}`
}

export function useCommentDraft() {
  function getDraft(slug: string, source: string): CommentDraft | null {
    const drafts = readDrafts()
    const key = findDraftKey(slug, source)
    return drafts.find(d => findDraftKey(d.slug, d.source) === key) || null
  }

  function saveDraft(slug: string, source: string, content: string, movieName?: string) {
    const drafts = readDrafts()
    const key = findDraftKey(slug, source)
    const filtered = drafts.filter(d => findDraftKey(d.slug, d.source) !== key)
    filtered.unshift({ slug, source, content, movieName, savedAt: Date.now() })
    writeDrafts(filtered.slice(0, 50))
  }

  function deleteDraft(slug: string, source: string) {
    const drafts = readDrafts()
    const key = findDraftKey(slug, source)
    const filtered = drafts.filter(d => findDraftKey(d.slug, d.source) !== key)
    writeDrafts(filtered)
  }

  function getAllDrafts(): CommentDraft[] {
    return readDrafts()
  }

  function clearAllDrafts() {
    if (import.meta.client) {
      window.localStorage.removeItem(draftKey)
    }
  }

  function clearExpiredDrafts(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    const drafts = readDrafts().filter(d => Date.now() - d.savedAt < maxAgeMs)
    writeDrafts(drafts)
  }

  return { getDraft, saveDraft, deleteDraft, getAllDrafts, clearAllDrafts, clearExpiredDrafts }
}
