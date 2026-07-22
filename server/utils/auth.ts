import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'cinek-secret-key-change-in-production-2024'
const JWT_EXPIRES = '7d'
const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { id: number, email: string, role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token: string): { id: number, email: string, role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number, email: string, role: string }
  } catch {
    return null
  }
}

export function getTokenFromEvent(event: any): string | null {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const cookies = parseCookies(event)
  return cookies.token || null
}

function parseCookies(event: any): Record<string, string> {
  const cookieHeader = getHeader(event, 'cookie') || ''
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach((pair: string) => {
    const [key, ...vals] = pair.trim().split('=')
    if (key) cookies[key] = decodeURIComponent(vals.join('='))
  })
  return cookies
}
