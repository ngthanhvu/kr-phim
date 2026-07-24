<script setup lang="ts">
import { ChevronDown, ChevronUp, CornerDownLeft, Crown, Image, Loader2, MessageSquare, Pin, Send, ThumbsDown, ThumbsUp, Trash2, User, Venus, Mars, Minus } from 'lucide-vue-next'

const props = defineProps<{
  source: string
  slug: string
  movieName?: string
}>()

const { user } = useAuth()
const { fetchComments, postComment, deleteComment, voteComment, togglePinComment } = useComments()
const { getDraft, saveDraft, deleteDraft } = useCommentDraft()

const commentContent = ref('')
const isCommentSubmitting = ref(false)
const hasDraft = ref(false)
const isContentHidden = ref(false)
let draftAutoSaveTimer: ReturnType<typeof setTimeout> | undefined

const comments = ref<any[]>([])
const isCommentsLoading = ref(false)
const replyContent = ref<Record<number, string>>({})
const isReplyingTo = ref<number | null>(null)
const isReplyAnonymous = ref<Record<number, boolean>>({})
const expandedComments = ref<Set<number>>(new Set())
const revealedComments = ref<Set<number>>(new Set())
const commentOffset = ref(0)
const commentTotal = ref(0)
const commentLimit = 5
const isCommentsLoadingMore = ref(false)

function addTimeAgoToReplies(replies: any[]): any[] {
  return replies?.map(r => ({
    ...r,
    timeAgo: timeAgo(r.createdAt),
    replies: r.replies ? addTimeAgoToReplies(r.replies) : []
  })) || []
}

async function loadComments(reset = true) {
  if (!props.slug) return
  if (reset) {
    isCommentsLoading.value = true
    commentOffset.value = 0
  } else {
    isCommentsLoadingMore.value = true
  }
  try {
    const data = await fetchComments(props.source, props.slug, user.value?.id, commentLimit, commentOffset.value)
    const newComments = data.items.map(c => ({
      ...c,
      timeAgo: timeAgo(c.createdAt),
      replies: addTimeAgoToReplies(c.replies || [])
    }))
    if (reset) {
      comments.value = newComments
    } else {
      comments.value = [...comments.value, ...newComments]
    }
    commentTotal.value = data.total
    commentOffset.value += data.items.length
  } finally {
    isCommentsLoading.value = false
    isCommentsLoadingMore.value = false
  }
}

async function loadMoreComments() {
  await loadComments(false)
}

function hasMoreComments() {
  return comments.value.length < commentTotal.value
}

function loadCommentDraft() {
  const draft = getDraft(props.slug, props.source)
  if (draft) {
    commentContent.value = draft.content
    hasDraft.value = true
  }
}

function triggerAutoSaveDraft() {
  if (draftAutoSaveTimer) clearTimeout(draftAutoSaveTimer)
  draftAutoSaveTimer = setTimeout(() => {
    if (!commentContent.value.trim()) return
    saveDraft(props.slug, props.source, commentContent.value.trim(), props.movieName)
    hasDraft.value = true
  }, 1000)
}

function handleDeleteDraft() {
  saveDraft(props.slug, props.source, '', props.movieName)
  deleteDraft(props.slug, props.source)
  commentContent.value = ''
  hasDraft.value = false
}

async function handleSubmitComment() {
  if (!commentContent.value.trim() || isCommentSubmitting.value || !user.value) return
  isCommentSubmitting.value = true
  try {
    const newComment = await postComment(props.source, props.slug, commentContent.value.trim(), props.movieName, undefined, false, isContentHidden.value)
    deleteDraft(props.slug, props.source)
    commentContent.value = ''
    hasDraft.value = false
    isContentHidden.value = false
    const newCommentData = {
      ...newComment,
      userName: user.value.name || 'Ẩn danh',
      userAvatar: user.value.avatar,
      userRole: user.value.role,
      userGender: user.value.gender,
      replies: [],
      timeAgo: 'Vừa xong'
    }
    const pinnedCount = comments.value.filter(c => c.pinned).length
    comments.value.splice(pinnedCount, 0, newCommentData)
  } catch (e: any) {
    console.error('Lỗi:', e)
  } finally {
    isCommentSubmitting.value = false
  }
}

async function handleDeleteComment(id: number) {
  try {
    await deleteComment(id)
    const idx = comments.value.findIndex((c: any) => c.id === id)
    if (idx !== -1) {
      comments.value.splice(idx, 1)
    }
  } catch (e: any) {
    console.error('Lỗi:', e)
  }
}

async function handleTogglePin(id: number) {
  if (!user.value || user.value.role !== 'admin') return
  const idx = comments.value.findIndex((c: any) => c.id === id)
  if (idx === -1) return
  const comment = comments.value[idx]
  const newPinned = !comment.pinned
  comments.value.splice(idx, 1)
  comment.pinned = newPinned
  if (newPinned) {
    comments.value.unshift(comment)
  } else {
    comments.value.push(comment)
  }
  comments.value = [...comments.value]
  try {
    await togglePinComment(id)
  } catch (e: any) {
    const currentIdx = comments.value.findIndex((c: any) => c.id === id)
    comments.value.splice(currentIdx, 1)
    comment.pinned = !newPinned
    if (comment.pinned) {
      comments.value.unshift(comment)
    } else {
      comments.value.splice(idx, 0, comment)
    }
    comments.value = [...comments.value]
    console.error('Lỗi:', e)
  }
}

function startReply(commentId: number) {
  if (!user.value) return
  isReplyingTo.value = commentId
  const targetItem = findItemById(commentId)
  replyContent.value[commentId] = targetItem ? '@' + targetItem.userName + ' ' : ''
  isReplyAnonymous.value[commentId] = false
}

function cancelReply(commentId?: number) {
  const targetId = commentId ?? isReplyingTo.value
  if (targetId !== null) {
    replyContent.value[targetId] = ''
    isReplyAnonymous.value[targetId] = false
  }
  isReplyingTo.value = null
}

function findTopLevelCommentContainingId(id: number): any | null {
  for (const c of comments.value) {
    if (c.id === id) return c
    const findInReplies = (replies: any[]): boolean => {
      if (!replies) return false
      for (const r of replies) {
        if (r.id === id) return true
        if (findInReplies(r.replies)) return true
      }
      return false
    }
    if (findInReplies(c.replies)) return c
  }
  return null
}

function findItemById(id: number): any | null {
  for (const c of comments.value) {
    if (c.id === id) return c
    const findInReplies = (replies: any[]): any | null => {
      if (!replies) return null
      for (const r of replies) {
        if (r.id === id) return r
        const found = findInReplies(r.replies)
        if (found) return found
      }
      return null
    }
    const found = findInReplies(c.replies)
    if (found) return found
  }
  return null
}

const isSubmittingReply = ref<Record<number, boolean>>({})

async function submitReply(parentId: number) {
  let content = replyContent.value[parentId]?.trim()
  if (!content || !user.value || isSubmittingReply.value[parentId]) return

  const targetItem = findItemById(parentId)
  if (targetItem && !content.startsWith('@' + targetItem.userName)) {
    content = '@' + targetItem.userName + ' ' + content
  }

  const isAnon = isReplyAnonymous.value[parentId] ?? false
  isSubmittingReply.value[parentId] = true
  try {
    const savedReply = await postComment(props.source, props.slug, content, props.movieName, parentId, false, isAnon)
    if (targetItem) {
      if (!targetItem.replies) targetItem.replies = []
      targetItem.replies.push({
        ...savedReply,
        userName: user.value.name || 'Ẩn danh',
        userAvatar: user.value.avatar,
        userRole: user.value.role,
        userGender: user.value.gender,
        timeAgo: 'Vừa xong',
        anonymous: isAnon,
        replies: []
      })
      const topLevelComment = findTopLevelCommentContainingId(parentId)
      if (topLevelComment) expandedComments.value.add(topLevelComment.id)
    }
    replyContent.value[parentId] = ''
    isReplyingTo.value = null
    isReplyAnonymous.value[parentId] = false
    comments.value = [...comments.value]
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || String(e)
    console.error('Lỗi reply:', msg)
    alert('Lỗi: ' + msg)
  } finally {
    isSubmittingReply.value[parentId] = false
  }
}

function findReplyInTree(commentId: number): any | null {
  for (const c of comments.value) {
    const findInReplies = (replies: any[]): any | null => {
      if (!replies) return null
      for (const r of replies) {
        if (r.id === commentId) return r
        const found = findInReplies(r.replies)
        if (found) return found
      }
      return null
    }
    const found = findInReplies(c.replies)
    if (found) return found
  }
  return null
}

async function handleVote(commentId: number, vote: number, isReply = false, parentId?: number) {
  if (!user.value) return
  try {
    const result = await voteComment(commentId, vote) as any
    if (isReply) {
      const reply = findReplyInTree(commentId)
      if (reply) {
        reply.userVote = result.vote
        reply.likeCount = result.likeCount
        reply.dislikeCount = result.dislikeCount
      }
    } else {
      const comment = comments.value.find((c: any) => c.id === commentId)
      if (comment) {
        comment.userVote = result.vote
        comment.likeCount = result.likeCount
        comment.dislikeCount = result.dislikeCount
      }
    }
  } catch {
    console.error('Lỗi')
  }
}

function countAllReplies(replies: any[]): number {
  let count = replies?.length || 0
  for (const r of replies || []) {
    count += countAllReplies(r.replies)
  }
  return count
}

function toggleExpand(commentId: number) {
  const s = new Set(expandedComments.value)
  if (s.has(commentId)) s.delete(commentId)
  else s.add(commentId)
  expandedComments.value = s
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

function formatMentions(content: string) {
  return content.replace(/@(\S+)/g, '<span class="text-cinek-400 font-medium">@$1</span>')
}

onMounted(() => {
  loadCommentDraft()
  loadComments()
})

watch(() => props.slug, () => {
  loadCommentDraft()
  loadComments()
})
</script>

<template>
  <div class="mt-10 border-t border-white/10 pt-8">
    <div class="flex items-center gap-3 mb-6">
      <MessageSquare class="size-5 text-yellow-300" />
      <h2 class="text-xl font-bold text-white">Bình luận</h2>
      <span class="text-sm text-slate-400">({{ comments.length }})</span>
    </div>

    <div v-if="!user" class="flex items-center gap-3 mb-8 p-4 bg-[#13151f] border border-white/5 rounded-xl">
      <p class="text-sm text-slate-400">Đăng nhập để bình luận về phim này.</p>
    </div>

    <div v-else class="mb-8 p-4 rounded-xl bg-[#13151f] border border-white/5">
      <div class="flex gap-3">
        <div class="size-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <img v-if="user?.avatar" :src="user.avatar" class="size-9 rounded-full object-cover" alt="" />
          <User v-else class="size-5 text-slate-500" />
        </div>
        <div class="flex-1 min-w-0">
          <textarea v-model="commentContent" @input="triggerAutoSaveDraft" placeholder="Viết bình luận..." rows="3"
            maxlength="1000"
            class="w-full rounded-lg bg-[#0d0f17] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cinek-500/50 focus:outline-none resize-none transition" />
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500">Tiết lộ</span>
              <button type="button" @click="isContentHidden = !isContentHidden"
                class="relative w-9 h-5 rounded-full transition-colors"
                :class="isContentHidden ? 'bg-cinek-500' : 'bg-white/20'">
                <span class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform"
                  :class="isContentHidden ? 'translate-x-4' : 'translate-x-0'" />
              </button>
              <span class="text-xs" :class="isContentHidden ? 'text-cinek-400' : 'text-slate-500'">Không tiết lộ</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-600">{{ commentContent.length }} / 1000</span>
              <button type="button" :disabled="!commentContent.trim() || isCommentSubmitting"
                @click="handleSubmitComment"
                class="flex items-center gap-1.5 rounded-lg bg-cinek-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cinek-400 disabled:cursor-not-allowed disabled:opacity-40 transition">
                <Loader2 v-if="isCommentSubmitting" class="size-3.5 animate-spin" />
                <Send class="size-3.5" v-else />
                <span>Gửi</span>
              </button>
            </div>
          </div>
          <div v-if="hasDraft" class="mt-2 flex items-center gap-2">
            <span class="text-xs text-yellow-400/70 flex items-center gap-1">
              <span class="size-1.5 rounded-full bg-yellow-400/50 inline-block" />
              Có nháp đã lưu
            </span>
            <button type="button" @click="handleDeleteDraft"
              class="text-xs text-slate-500 hover:text-red-400 transition">Xóa nháp</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isCommentsLoading" class="space-y-4">
      <div v-for="i in 2" :key="i" class="flex items-start gap-3 p-4 bg-[#13151f] rounded-xl animate-pulse">
        <div class="size-10 rounded-full bg-white/5 shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-white/5 rounded w-20" />
          <div class="h-3 bg-white/5 rounded w-full" />
          <div class="h-3 bg-white/5 rounded w-3/4" />
        </div>
      </div>
    </div>

    <TransitionGroup v-else-if="comments.length" name="comment-list" tag="div" class="space-y-1">
      <div v-for="comment in comments" :key="comment.id" class="mb-2">
        <div class="transition"
          :class="comment.pinned ? 'rounded-xl p-4 bg-yellow-500/5 border border-yellow-500/20' : 'py-4 border-b border-white/5'">
          <div v-if="comment.pinned" class="flex items-center gap-1.5 mb-3 text-xs text-yellow-400/80 font-medium">
            <Pin class="size-3" /> Ghim bởi Admin
          </div>
          <div class="flex gap-3">
            <div class="shrink-0 relative">
              <div class="size-10 rounded-full bg-white/10 flex items-center justify-center"
                :class="comment.userRole === 'admin' ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#0d0f17]' : ''">
                <img v-if="comment.userAvatar" :src="comment.userAvatar"
                  class="size-10 rounded-full object-cover" alt="" />
                <User v-else class="size-5 text-slate-500" />
              </div>
              <div v-if="comment.userRole === 'admin'"
                class="absolute -top-1 -left-1 size-4 bg-cinek-500 rounded-full flex items-center justify-center">
                <Crown class="size-2.5 text-slate-950" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span v-if="comment.pinned"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cinek-500/20 text-cinek-400">
                  <Pin class="size-3" />Đã ghim
                </span>
                <span v-if="comment.userRole === 'admin'"
                  class="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-400 text-slate-900 shadow-sm">ADMIN</span>
                <span class="text-sm font-semibold text-white">{{ comment.userName }}</span>
                <Venus v-if="comment.userGender === 'female'" class="size-3.5 text-pink-400" />
                <Mars v-if="comment.userGender === 'male'" class="size-3.5 text-blue-400" />
                <Minus v-if="comment.userGender === 'other'" class="size-3.5 text-purple-400" />
                <span class="text-xs text-slate-600">{{ timeAgo(comment.createdAt) }}</span>
              </div>
              <div class="relative">
                <p class="text-sm text-slate-300 whitespace-pre-wrap wrap-break-word cursor-pointer select-none py-1.5 transition-all duration-200"
                  :class="comment.anonymous && !revealedComments.has(comment.id) ? 'blur-sm opacity-60' : ''"
                  v-html="formatMentions(comment.content)"
                  @click="comment.anonymous && (revealedComments.has(comment.id) ? revealedComments.delete(comment.id) : revealedComments.add(comment.id))">
                </p>
              </div>
              <div class="flex items-center gap-3 mt-2.5">
                <button type="button" @click="handleVote(comment.id, comment.userVote === 1 ? 0 : 1)"
                  class="flex items-center gap-1 text-xs"
                  :class="comment.userVote === 1 ? 'text-cinek-400' : 'text-slate-500 hover:text-slate-300'">
                  <ThumbsUp class="size-3.5" /><span v-if="comment.likeCount">{{ comment.likeCount }}</span>
                </button>
                <button type="button" @click="handleVote(comment.id, comment.userVote === -1 ? 0 : -1)"
                  class="flex items-center gap-1 text-xs"
                  :class="comment.userVote === -1 ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'">
                  <ThumbsDown class="size-3.5" /><span v-if="comment.dislikeCount">{{ comment.dislikeCount }}</span>
                </button>
                <button type="button" @click="startReply(comment.id)"
                  class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300">
                  <CornerDownLeft class="size-3.5" /><span>Trả lời</span>
                </button>
                <button v-if="user && user.role === 'admin'" type="button" @click="handleTogglePin(comment.id)"
                  class="flex items-center gap-1.5 text-xs"
                  :class="comment.pinned ? 'text-cinek-400 hover:text-cinek-300' : 'text-slate-600 hover:text-slate-400'">
                  <Pin class="size-3.5" /><span>{{ comment.pinned ? 'Bỏ ghim' : 'Ghim' }}</span>
                </button>
                <button v-if="user && (user.id === comment.userId || user.role === 'admin')" type="button"
                  @click="handleDeleteComment(comment.id)"
                  class="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400">
                  <Trash2 class="size-3.5" />
                </button>
              </div>
              <div v-if="isReplyingTo === comment.id" class="mt-4">
                <div class="rounded-xl border border-white/10 bg-[#13151f] p-4">
                  <textarea v-model="replyContent[comment.id]" rows="2" maxlength="1000"
                    class="w-full rounded-lg bg-[#0d0f17] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cinek-500/50 focus:outline-none resize-none transition"
                    placeholder="Viết trả lời..." />
                  <div class="flex items-center justify-between mt-3">
                    <div class="flex items-center gap-4">
                      <div class="flex items-center gap-2">
                        <button type="button" @click="isReplyAnonymous[comment.id] = !isReplyAnonymous[comment.id]"
                          class="relative w-9 h-5 rounded-full transition-colors"
                          :class="(isReplyAnonymous[comment.id] ?? false) ? 'bg-cinek-500' : 'bg-white/20'">
                          <span class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform"
                            :class="(isReplyAnonymous[comment.id] ?? false) ? 'translate-x-4' : 'translate-x-0'" />
                        </button>
                        <span class="text-xs text-slate-500">Tiết lộ</span>
                      </div>
                      <button type="button" class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
                        <Image class="size-4" /><span>GIF</span>
                      </button>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-slate-600">{{ (replyContent[comment.id] || '').length }} / 1000</span>
                      <button type="button" @click="cancelReply(comment.id)"
                        class="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white transition">Hủy</button>
                      <button type="button" @click="submitReply(comment.id)"
                        class="px-4 py-1.5 rounded-lg bg-cinek-500 text-xs font-bold text-slate-950 hover:bg-cinek-400 transition">Gửi</button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="comment.replies?.length" class="mt-4">
                <button @click="toggleExpand(comment.id)"
                  class="flex items-center gap-1.5 text-xs text-cinek-400 hover:text-cinek-300 transition mb-2">
                  <ChevronUp v-if="expandedComments.has(comment.id)" class="size-3" />
                  <ChevronDown v-else class="size-3" />
                  <span>{{ expandedComments.has(comment.id) ? 'Ẩn phản hồi' : `Hiển thị
                    ${countAllReplies(comment.replies)} phản hồi` }}</span>
                </button>
                <div class="replies-container pl-3 border-l-2 border-white/10"
                  :class="expandedComments.has(comment.id) ? 'expanded' : 'collapsed'">
                  <div class="space-y-3">
                    <CommentReplies :replies="comment.replies" :depth="0" :user="user" :parent-id="comment.id"
                      :is-replying-to="isReplyingTo" :reply-content="replyContent"
                      :is-reply-anonymous="isReplyAnonymous" :is-submitting-reply="isSubmittingReply"
                      @start-reply="startReply" @cancel-reply="cancelReply" @submit-reply="submitReply"
                      @vote="handleVote" @delete="handleDeleteComment" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Load More Button -->
    <div v-if="hasMoreComments()" class="flex justify-center mt-6">
      <button type="button" @click="loadMoreComments"
        class="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isCommentsLoadingMore">
        <Loader2 v-if="isCommentsLoadingMore" class="size-4 animate-spin" />
        <span>{{ isCommentsLoadingMore ? 'Đang tải...' : `Xem thêm bình luận (${comments.length}/${commentTotal})`
          }}</span>
      </button>
    </div>

    <div v-if="!hasMoreComments() && comments.length && commentTotal > commentLimit" class="text-center mt-4">
      <span class="text-xs text-slate-600">Đã hiển thị tất cả {{ commentTotal }} bình luận</span>
    </div>

    <div v-if="!comments.length && !isCommentsLoading"
      class="flex flex-col items-center justify-center py-12 text-center">
      <MessageSquare class="size-10 text-white/10 mb-3" />
      <p class="text-slate-400 text-sm">Chưa có bình luận nào.</p>
    </div>
  </div>
</template>

<style scoped>
.replies-container {
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.3s ease;
}

.replies-container.collapsed {
  max-height: 0;
  opacity: 0;
}

.replies-container.expanded {
  max-height: 5000px;
  opacity: 1;
}

.comment-list-move,
.comment-list-enter-active,
.comment-list-leave-active {
  transition: all 0.4s ease;
}

.comment-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.comment-list-leave-to {
  opacity: 0;
  transform: translateX(-50px);
  max-height: 0;
  margin-bottom: 0;
  overflow: hidden;
}

.comment-list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
