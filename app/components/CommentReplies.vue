<script setup lang="ts">
import { CornerDownLeft, Crown, Image, Loader2, ThumbsDown, ThumbsUp, Trash2, User, Venus, Mars, Minus } from 'lucide-vue-next'

const props = defineProps<{
  replies: any[]
  depth?: number
  user: any
  parentId: number
  isReplyingTo: number | null
  replyContent: Record<number, string>
  isReplyAnonymous: Record<number, boolean>
  isSubmittingReply?: Record<number, boolean>
}>()

const emit = defineEmits<{
  'start-reply': [id: number]
  'cancel-reply': [id: number]
  'submit-reply': [id: number]
  'vote': [commentId: number, vote: number, isReply: boolean, parentId: number]
  'delete': [id: number]
}>()

const depth = props.depth ?? 0
const maxDepth = 10
const revealedReplies = ref<Set<number>>(new Set())

function handleVote(replyId: number, vote: number) {
  emit('vote', replyId, vote, true, props.parentId)
}

function formatMentions(content: string) {
  return content.replace(/@(\S+)/g, '<span class="text-cinek-400 font-medium">@$1</span>')
}
</script>

<template>
  <TransitionGroup name="reply-list" tag="div" :style="{ marginLeft: depth > 0 ? '12px' : '0' }">
    <div v-for="reply in replies" :key="reply.id" class="flex items-start gap-3 py-3">
    <div class="shrink-0 relative">
      <div class="size-8 rounded-full bg-white/10 flex items-center justify-center"
        :class="reply.userRole === 'admin' ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-[#0d0f17]' : ''">
        <img v-if="reply.userAvatar" :src="reply.userAvatar"
          class="size-8 rounded-full object-cover" alt="" />
        <User v-else class="size-3.5 text-slate-500" />
      </div>
      <div v-if="reply.userRole === 'admin'"
        class="absolute -top-0.5 -left-0.5 size-3.5 bg-cinek-500 rounded-full flex items-center justify-center">
        <Crown class="size-2 text-slate-950" />
      </div>
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-2 mb-1">
        <span v-if="reply.userRole === 'admin'"
          class="px-1.5 py-0.5 rounded text-[9px] font-black bg-yellow-400 text-slate-900">ADMIN</span>
        <span class="text-xs font-semibold text-white">{{ reply.userName }}</span>
        <Venus v-if="reply.userGender === 'female'" class="size-3 text-pink-400" />
        <Mars v-if="reply.userGender === 'male'" class="size-3 text-blue-400" />
        <Minus v-if="reply.userGender === 'other'" class="size-3 text-purple-400" />
        <span class="text-xs text-slate-600">{{ reply.timeAgo || '' }}</span>
      </div>
      <p class="text-xs text-slate-400 whitespace-pre-wrap wrap-break-word leading-relaxed cursor-pointer select-none py-1 transition-all duration-200"
        :class="reply.anonymous && !revealedReplies.has(reply.id) ? 'blur-sm opacity-60' : ''"
        v-html="formatMentions(reply.content)"
        @click="reply.anonymous && (revealedReplies.has(reply.id) ? revealedReplies.delete(reply.id) : revealedReplies.add(reply.id))">
      </p>
      <div class="flex items-center gap-3 mt-2">
        <button type="button" @click="handleVote(reply.id, reply.userVote === 1 ? 0 : 1)"
          class="flex items-center gap-1 text-xs"
          :class="reply.userVote === 1 ? 'text-cinek-400' : 'text-slate-600 hover:text-slate-400'">
          <ThumbsUp class="size-3" /><span v-if="reply.likeCount">{{ reply.likeCount }}</span>
        </button>
        <button type="button" @click="handleVote(reply.id, reply.userVote === -1 ? 0 : -1)"
          class="flex items-center gap-1 text-xs"
          :class="reply.userVote === -1 ? 'text-red-400' : 'text-slate-600 hover:text-slate-400'">
          <ThumbsDown class="size-3" /><span v-if="reply.dislikeCount">{{ reply.dislikeCount }}</span>
        </button>
        <button v-if="depth < maxDepth" type="button" @click="emit('start-reply', reply.id)"
          class="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400">
          <CornerDownLeft class="size-3" /><span>Trả lời</span>
        </button>
        <button v-if="user && (user.id === reply.userId || user.role === 'admin')" type="button"
          @click="emit('delete', reply.id)" class="text-xs text-slate-600 hover:text-red-400 disabled:opacity-50"
          :disabled="props.isDeleting?.has(reply.id)">
          <Loader2 v-if="props.isDeleting?.has(reply.id)" class="size-3 animate-spin" />
          <Trash2 v-else class="size-3" />
        </button>
      </div>
      <!-- Reply form -->
      <div v-if="isReplyingTo === reply.id" class="mt-3">
        <div class="rounded-xl border border-white/10 bg-[#13151f] p-4">
          <textarea v-model="replyContent[reply.id]" rows="2" maxlength="1000"
            class="w-full rounded-lg bg-[#0d0f17] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cinek-500/50 focus:outline-none resize-none transition"
            placeholder="Viết trả lời..." />
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <button type="button" @click="isReplyAnonymous[reply.id] = !isReplyAnonymous[reply.id]"
                  class="relative w-9 h-5 rounded-full transition-colors"
                  :class="(isReplyAnonymous[reply.id] ?? false) ? 'bg-cinek-500' : 'bg-white/20'">
                  <span class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform"
                    :class="(isReplyAnonymous[reply.id] ?? false) ? 'translate-x-4' : 'translate-x-0'" />
                </button>
                <span class="text-xs text-slate-500">Tiết lộ</span>
              </div>
              <button type="button" class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
                <Image class="size-4" /><span>GIF</span>
              </button>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-600">{{ (replyContent[reply.id] || '').length }} / 1000</span>
              <button type="button" @click="emit('cancel-reply', reply.id)"
                class="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white transition">Hủy</button>
              <button type="button" @click="emit('submit-reply', reply.id)"
                class="px-4 py-1.5 rounded-lg bg-cinek-500 text-xs font-bold text-slate-950 hover:bg-cinek-400 transition"
                :disabled="props.isSubmittingReply?.[reply.id]">
                <Loader2 v-if="props.isSubmittingReply?.[reply.id]" class="size-3 animate-spin inline" />
                <span v-else>Gửi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Nested replies (recursive) -->
      <div v-if="reply.replies?.length" class="mt-3 pl-4 border-l-2 border-white/10">
        <CommentReplies :replies="reply.replies" :depth="depth + 1" :user="user" :parent-id="reply.id"
          :is-replying-to="isReplyingTo" :reply-content="replyContent" :is-reply-anonymous="isReplyAnonymous"
          @start-reply="emit('start-reply', $event)" @cancel-reply="emit('cancel-reply', $event)"
          @submit-reply="emit('submit-reply', $event)" @vote="emit('vote', $event)" @delete="emit('delete', $event)" />
      </div>
    </div>
  </div>
  </TransitionGroup>
</template>

<style scoped>
.reply-list-move,
.reply-list-enter-active,
.reply-list-leave-active {
  transition: all 0.35s ease;
}
.reply-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.reply-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  max-height: 0;
  overflow: hidden;
}
.reply-list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
