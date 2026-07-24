export type CommentReply = {
  id: number
  userId: number
  userName: string
  userAvatar?: string
  parentId: number
  content: string
  likeCount: number
  dislikeCount: number
  createdAt: string
  userVote: number
  pinned: boolean
  spoiler: boolean
  anonymous: boolean
}

export type Comment = {
  id: number
  userId: number
  userName: string
  userAvatar?: string
  source: string
  slug: string
  movieName?: string
  content: string
  likeCount: number
  dislikeCount: number
  createdAt: string
  userVote: number
  replies: CommentReply[]
  pinned: boolean
  spoiler: boolean
  anonymous: boolean
}

export function useComments() {
  async function fetchComments(source: string, slug: string, userId?: number) {
    try {
      const data = await $fetch('/api/comments', {
        query: { source, slug, userId },
      })
      return data.items as Comment[]
    } catch {
      return [] as Comment[]
    }
  }

  async function postComment(
    source: string,
    slug: string,
    content: string,
    movieName?: string,
    parentId?: number,
    spoiler?: boolean,
    anonymous?: boolean,
  ) {
    return $fetch('/api/comments', {
      method: 'POST',
      body: { source, slug, content, movieName, parentId, spoiler, anonymous },
    })
  }

  async function deleteComment(id: number) {
    return $fetch(`/api/comments/${id}`, {
      method: 'DELETE',
    })
  }

  async function voteComment(commentId: number, vote: number) {
    return $fetch('/api/comments/vote', {
      method: 'POST',
      body: { commentId, vote },
    })
  }

  async function togglePinComment(id: number) {
    return $fetch(`/api/comments/${id}/pin`, {
      method: 'POST',
    })
  }

  return { fetchComments, postComment, deleteComment, voteComment, togglePinComment }
}
