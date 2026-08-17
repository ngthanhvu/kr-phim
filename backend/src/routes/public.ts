import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { useDb } from '../utils/db.js'
import { appSettings } from '../database/schema.js'

const router = Router()

// GET /api/public/settings — no auth required, public use
router.get('/settings', async (_req, res) => {
  const db = useDb()
  const rows = await db.select().from(appSettings)
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value
  
  // Defaults
  settings.siteName = settings.siteName || 'CineK'
  settings.siteDescription = settings.siteDescription || ''
  settings.maintenanceMode = settings.maintenanceMode === '1' ? 'true' : 'false'
  settings.allowRegistration = settings.allowRegistration !== '0' ? 'true' : 'false'
  settings.siteLogo = settings.siteLogo || ''
  settings.siteFavicon = settings.siteFavicon || '/favicon.ico'
  settings.contactEmail = settings.contactEmail || 'support@cinek.app'
  settings.facebookUrl = settings.facebookUrl || ''
  settings.telegramUrl = settings.telegramUrl || ''
  settings.tiktokUrl = settings.tiktokUrl || ''
  settings.youtubeUrl = settings.youtubeUrl || ''
  
  return res.json(settings)
})

export default router
