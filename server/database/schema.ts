import { mysqlTable, varchar, text, int, boolean, timestamp, json, index } from 'drizzle-orm/mysql-core'

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 200 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  avatar: text('avatar'),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpires: timestamp('reset_token_expires'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})

export const movies = mysqlTable('movies', {
  id: int('id').primaryKey().autoincrement(),
  source: varchar('source', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  originName: varchar('origin_name', { length: 500 }),
  thumb: text('thumb'),
  poster: text('poster'),
  year: int('year'),
  time: varchar('time', { length: 100 }),
  episode: varchar('episode', { length: 100 }),
  episodeTotal: varchar('episode_total', { length: 100 }),
  quality: varchar('quality', { length: 50 }),
  lang: varchar('lang', { length: 50 }),
  type: varchar('type', { length: 50 }),
  rating: int('rating'),
  views: int('views').notNull().default(0),
  content: text('content'),
  categories: json('categories').$type<string[]>(),
  countries: json('countries').$type<string[]>(),
  sources: json('sources').$type<{ source: string, slug: string, name?: string }[]>(),
  customPoster: text('custom_poster'),
  customThumb: text('custom_thumb'),
  customContent: text('custom_content'),
  customEpisodes: json('custom_episodes').$type<{ name: string, linkEmbed?: string, linkM3u8?: string }[]>(),
  active: boolean('active').notNull().default(false),
  apiUpdatedAt: timestamp('api_updated_at'),
  syncedAt: timestamp('synced_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})

export const comments = mysqlTable('comments', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  source: varchar('source', { length: 50 }).notNull().default(''),
  slug: varchar('slug', { length: 500 }).notNull(),
  movieName: varchar('movie_name', { length: 500 }),
  content: text('content').notNull(),
  parentId: int('parent_id'),
  pinned: boolean('pinned').notNull().default(false),
  spoiler: boolean('spoiler').notNull().default(false),
  anonymous: boolean('anonymous').notNull().default(false),
  likeCount: int('like_count').notNull().default(0),
  dislikeCount: int('dislike_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  idxSourceSlug: index('idx_source_slug').on(table.source, table.slug),
  idxUserId: index('idx_user_id').on(table.userId),
  idxParentId: index('idx_parent_id').on(table.parentId),
}))

export const commentVotes = mysqlTable('comment_votes', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  commentId: int('comment_id').notNull(),
  vote: int('vote').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  idxUserComment: index('idx_user_comment').on(table.userId, table.commentId),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Movie = typeof movies.$inferSelect
export type NewMovie = typeof movies.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type CommentVote = typeof commentVotes.$inferSelect
export type NewCommentVote = typeof commentVotes.$inferInsert
