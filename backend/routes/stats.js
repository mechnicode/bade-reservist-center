import { Router } from 'express'
import { getStats } from '../controllers/stats.js'
import * as auth from '../middleware/auth.js'

const router = Router()

router.get('/', auth.jwt, auth.isAdmin, getStats)

export default router
