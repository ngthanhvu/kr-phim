import { mysqlTable, varchar, text, int, boolean, timestamp, json } from 'drizzle-orm/mysql-core'

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 200 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  avatar: text('avatar'),
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
  quality: varchar('quality', { length: 50 }),
  lang: varchar('lang', { length: 50 }),
  type: varchar('type', { length: 50 }),
  rating: int('rating'),
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

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Movie = typeof movies.$inferSelect
export type NewMovie = typeof movies.$inferInsert
