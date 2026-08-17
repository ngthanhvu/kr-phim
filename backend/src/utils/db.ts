import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../database/schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function useDb() {
  if (_db) return _db

  const url = process.env.DATABASE_URL || 'mysql://cinek:cinekpassword@localhost:3306/cinek'
  const pool = mysql.createPool(url)

  _db = drizzle(pool, { mode: 'default', schema })
  return _db
}
