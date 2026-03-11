import { Router } from 'express'
import { create, update, getAll, getById } from '../controllers/activities.js'
import { jwt, isAdmin } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = Router()

router.get('/', getAll)
router.get('/:id', getById) // New route

router.post('/', jwt, isAdmin, upload.single('image'), create)
router.patch('/:id', jwt, isAdmin, upload.single('image'), update)

export default router
