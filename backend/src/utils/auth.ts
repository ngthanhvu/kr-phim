import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'

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

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  if (req.cookies) {
    return (req.cookies as any).token || null
  }
  
  // Fallback: parse cookies manually if cors middleware didn't handle them
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/)
    if (match) return decodeURIComponent(match[1])
  }
  
  return null
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,   // Set to true in production behind HTTPS
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export interface AuthUser {
  id: number
  email: string
  role: string
}

export function getAuthUser(req: Request): AuthUser | null {
  const token = getTokenFromRequest(req)
  if (!token) return null
  
  const payload = verifyToken(token)
  return payload ? { id: payload.id, email: payload.email, role: payload.role } : null
}
