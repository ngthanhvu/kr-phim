import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/',
  out: './server/database/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'mysql://cinek:cinekpassword@localhost:3306/cinek',
  },
})
