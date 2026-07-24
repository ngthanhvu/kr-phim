<script setup lang="ts">
import { CornerDownLeft, Crown, Loader2, MessageSquare, Send, ThumbsDown, ThumbsUp, Trash2, User } from 'lucide-vue-next'

const props = defineProps<{
  source: string
  slug: string
  movieName?: string
}>()

const { user } = useAuth()
const { fetchComments, postComment, deleteComment, voteComment } = useComments()
const { getDraft, saveDraft, deleteDraft } = useCommentDraft()

const commentContent = ref('')
const isCommentSubmitting = ref(false)
const hasDraft = ref(false)
const isAnonymous = ref(false)
let draftAutoSaveTimer: ReturnType<typeof setTimeout> | undefined

const comments = ref<any[]>([])
const isCommentsLoading = ref(false)
const replyContent = ref<Record<number, string>>({})
const isReplyingTo = ref<number | null>(null)
const expandedComments = ref<Set<number>>(new Set())

async function loadComments() {
  if (!props.slug) return
  isCommentsLoading.value = true
  try {
    comments.value = await fetchComments(props.source, props.slug, user.value?.id)
  } finally {
    isCommentsLoading.value = false
  }
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
    await postComment(props.source, props.slug, commentContent.value.trim(), props.movieName, undefined, false, isAnonymous.value)
    deleteDraft(props.slug, props.source)
    commentContent.value = ''
    hasDraft.value = false
    isAnonymous.value = false
    await loadComments()
  } catch (e: any) {
    console.error('Lỗi:', e)
  } finally {
    isCommentSubmitting.value = false
  }
}

async function handleDeleteComment(id: number) {
  try {
    await deleteComment(id)
    await loadComments()
  } catch (e: any) {
    console.error('Lỗi:', e)
  }
}

function startReply(commentId: number) {
  if (!user.value) return
  isReplyingTo.value = commentId
  replyContent.value[commentId] = ''
}

function cancelReply() {
  isReplyingTo.value = null
}

async function submitReply(commentId: number) {
  const content = replyContent.value[commentId]?.trim()
  if (!content || !user.value) return
  try {
    await postComment(props.source, props.slug, content, props.movieName, commentId, false, isAnonymous.value)
    replyContent.value[commentId] = ''
    isReplyingTo.value = null
    isAnonymous.value = false
    await loadComments()
  } catch (e: any) {
    console.error('Lỗi:', e)
  }
}

async function handleVote(commentId: number, vote: number, isReply = false, parentId?: number) {
  if (!user.value) return
  try {
    const result = await voteComment(commentId, vote) as any
    if (isReply && parentId) {
      const comment = comments.value.find((c: any) => c.id === parentId)
      const reply = comment?.replies?.find((r: any) => r.id === commentId)
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
          <textarea
            v-model="commentContent"
            @input="triggerAutoSaveDraft"
            placeholder="Viết bình luận..."
            rows="3"
            maxlength="1000"
            class="w-full rounded-lg bg-[#0d0f17] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cinek-500/50 focus:outline-none resize-none transition"
          />
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500">Công khai</span>
              <button
                type="button"
                @click="isAnonymous = !isAnonymous"
                class="relative w-9 h-5 rounded-full transition-colors"
                :class="isAnonymous ? 'bg-cinek-500' : 'bg-white/20'"
              >
                <span
                  class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform"
                  :class="isAnonymous ? 'translate-x-4' : 'translate-x-0'"
                />
              </button>
              <span class="text-xs" :class="isAnonymous ? 'text-cinek-400' : 'text-slate-500'">Ẩn danh</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-600">{{ commentContent.length }} / 1000</span>
              <button
                type="button"
                :disabled="!commentContent.trim() || isCommentSubmitting"
                @click="handleSubmitComment"
                class="flex items-center gap-1.5 rounded-lg bg-cinek-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cinek-400 disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
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
            <button type="button" @click="handleDeleteDraft" class="text-xs text-slate-500 hover:text-red-400 transition">Xóa nháp</button>
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

    <div v-else-if="comments.length" class="space-y-1">
      <div v-for="comment in comments" :key="comment.id">
        <div v-if="comment.pinned" class="flex items-center gap-1.5 mb-2 px-2">
          <span class="text-xs font-bold text-cinek-400">📌 Ghim bởi Admin</span>
        </div>
        <div class="rounded-xl p-4 border-t border-white/5" :class="comment.pinned ? 'bg-yellow-500/10 border border-yellow-500/20' : ''">
          <div class="flex gap-3">
            <div class="shrink-0 relative">
              <div class="size-10 rounded-full bg-white/10 flex items-center justify-center" :class="comment.userRole === 'admin' && !comment.anonymous ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#0d0f17]' : ''">
                <img v-if="comment.userAvatar && !comment.anonymous" :src="comment.userAvatar" class="size-10 rounded-full object-cover" alt="" />
                <User v-else class="size-5 text-slate-500" />
              </div>
              <div v-if="comment.userRole === 'admin' && !comment.anonymous" class="absolute -top-1 -left-1 size-4 bg-cinek-500 rounded-full flex items-center justify-center">
                <Crown class="size-2.5 text-slate-950" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span v-if="comment.userRole === 'admin' && !comment.anonymous" class="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-400 text-slate-900 shadow-sm">ADMIN</span>
                <span class="text-sm font-semibold text-white">{{ comment.userName }}</span>
                <span v-if="comment.anonymous" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-slate-400">Ẩn danh</span>
                <span class="text-xs text-slate-600">{{ timeAgo(comment.createdAt) }}</span>
              </div>
              <p class="text-sm text-slate-300 whitespace-pre-wrap break-words">{{ comment.content }}</p>
              <div class="flex items-center gap-3 mt-2.5">
                <button type="button" @click="handleVote(comment.id, comment.userVote === 1 ? 0 : 1)" class="flex items-center gap-1 text-xs" :class="comment.userVote === 1 ? 'text-cinek-400' : 'text-slate-500 hover:text-slate-300'">
                  <ThumbsUp class="size-3.5" /><span>{{ comment.likeCount || 0 }}</span>
                </button>
                <button type="button" @click="handleVote(comment.id, comment.userVote === -1 ? 0 : -1)" class="flex items-center gap-1 text-xs" :class="comment.userVote === -1 ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'">
                  <ThumbsDown class="size-3.5" /><span>{{ comment.dislikeCount || 0 }}</span>
                </button>
                <button type="button" @click="startReply(comment.id)" class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300">
                  <CornerDownLeft class="size-3.5" /><span>Trả lời</span>
                </button>
                <button v-if="user && (user.id === comment.userId || user.role === 'admin')" type="button" @click="handleDeleteComment(comment.id)" class="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400">
                  <Trash2 class="size-3.5" />
                </button>
              </div>
              <div v-if="isReplyingTo === comment.id" class="mt-3 flex items-start gap-2">
                <div class="size-7 rounded-full bg-white/10 flex items-center justify-center shrink-0"><User class="size-3.5 text-slate-500" /></div>
                <div class="flex-1">
                  <textarea v-model="replyContent[comment.id]" rows="2" maxlength="1000" class="w-full rounded-lg bg-[#0d0f17] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cinek-500/50 focus:outline-none resize-none transition" placeholder="Viết trả lời..." />
                  <div class="flex items-center gap-2 mt-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-slate-500">Công khai</span>
                      <button type="button" @click="isAnonymous = !isAnonymous" class="relative w-8 h-4 rounded-full transition-colors" :class="isAnonymous ? 'bg-cinek-500' : 'bg-white/20'">
                        <span class="absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow transition-transform" :class="isAnonymous ? 'translate-x-4' : 'translate-x-0'" />
                      </button>
                      <span class="text-xs" :class="isAnonymous ? 'text-cinek-400' : 'text-slate-500'">Ẩn danh</span>
                    </div>
                    <button type="button" @click="submitReply(comment.id)" class="px-3 py-1 rounded-lg bg-cinek-500 text-xs font-bold text-slate-950 hover:bg-cinek-400 transition">Trả lời</button>
                    <button type="button" @click="cancelReply" class="px-3 py-1 rounded-lg text-xs text-slate-500 hover:text-white transition">Hủy</button>
                  </div>
                </div>
              </div>
              <div v-if="comment.replies?.length" class="mt-4">
                <button @click="toggleExpand(comment.id)" class="flex items-center gap-1.5 text-xs text-cinek-400 hover:text-cinek-300 transition mb-2">
                  <span>{{ expandedComments.has(comment.id) ? '▲' : '▼' }}</span>
                  <span>{{ expandedComments.has(comment.id) ? 'Ẩn phản hồi' : `Hiển thị ${comment.replies.length} phản hồi` }}</span>
                </button>
                <div class="space-y-3 pl-3 border-r-2 border-white/10" :class="!expandedComments.has(comment.id) ? 'max-h-0 overflow-hidden' : ''">
                  <div v-for="reply in comment.replies" :key="reply.id" class="flex items-start gap-2">
                    <div class="shrink-0 relative">
                      <div class="size-7 rounded-full bg-white/10 flex items-center justify-center" :class="reply.userRole === 'admin' && !reply.anonymous ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-[#0d0f17]' : ''">
                        <img v-if="reply.userAvatar && !reply.anonymous" :src="reply.userAvatar" class="size-7 rounded-full object-cover" alt="" />
                        <User v-else class="size-3.5 text-slate-500" />
                      </div>
                      <div v-if="reply.userRole === 'admin' && !reply.anonymous" class="absolute -top-0.5 -left-0.5 size-3.5 bg-cinek-500 rounded-full flex items-center justify-center">
                        <Crown class="size-2 text-slate-950" />
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex flex-wrap items-center gap-2 mb-0.5">
                        <span v-if="reply.userRole === 'admin' && !reply.anonymous" class="px-1.5 py-0.5 rounded text-[9px] font-black bg-yellow-400 text-slate-900">ADMIN</span>
                        <span class="text-xs font-semibold text-white">{{ reply.userName }}</span>
                        <span v-if="reply.anonymous" class="px-1 py-0.5 rounded text-[9px] font-medium bg-white/10 text-slate-400">Ẩn danh</span>
                        <span class="text-xs text-slate-600">{{ timeAgo(reply.createdAt) }}</span>
                      </div>
                      <p class="text-xs text-slate-400 whitespace-pre-wrap break-words">{{ reply.content }}</p>
                      <div class="flex items-center gap-3 mt-1.5">
                        <button type="button" @click="handleVote(reply.id, reply.userVote === 1 ? 0 : 1, true, comment.id)" class="flex items-center gap-1 text-xs" :class="reply.userVote === 1 ? 'text-cinek-400' : 'text-slate-600 hover:text-slate-400'">
                          <ThumbsUp class="size-3" /><span>{{ reply.likeCount || 0 }}</span>
                        </button>
                        <button type="button" @click="handleVote(reply.id, reply.userVote === -1 ? 0 : -1, true, comment.id)" class="flex items-center gap-1 text-xs" :class="reply.userVote === -1 ? 'text-red-400' : 'text-slate-600 hover:text-slate-400'">
                          <ThumbsDown class="size-3" /><span>{{ reply.dislikeCount || 0 }}</span>
                        </button>
                        <button type="button" @click="startReply(reply.id)" class="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400">
                          <CornerDownLeft class="size-3" /><span>Trả lời</span>
                        </button>
                        <button v-if="user && (user.id === reply.userId || user.role === 'admin')" type="button" @click="handleDeleteComment(reply.id)" class="text-xs text-slate-600 hover:text-red-400">
                          <Trash2 class="size-3" />
                        </button>
                      </div>
                      <div v-if="isReplyingTo === reply.id" class="mt-2 flex items-start gap-2">
                        <div class="size-6 rounded-full bg-white/10 flex items-center justify-center shrink-0"><User class="size-3 text-slate-500" /></div>
                        <div class="flex-1">
                          <textarea v-model="replyContent[reply.id]" rows="2" maxlength="1000" class="w-full rounded-lg bg-[#0d0f17] border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cinek-500/50 focus:outline-none resize-none transition" placeholder="Viết trả lời..." />
                          <div class="flex items-center gap-2 mt-1.5">
                            <button type="button" @click="submitReply(reply.id)" class="px-2 py-0.5 rounded bg-cinek-500 text-[10px] font-bold text-slate-950 hover:bg-cinek-400 transition">Trả lời</button>
                            <button type="button" @click="cancelReply" class="px-2 py-0.5 rounded text-[10px] text-slate-500 hover:text-white transition">Hủy</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <MessageSquare class="size-10 text-white/10 mb-3" />
      <p class="text-slate-400 text-sm">Chưa có bình luận nào.</p>
    </div>
  </div>
</template>
