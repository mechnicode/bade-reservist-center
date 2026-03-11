import { Router } from 'express'
import { create, getUserRegistrations, getAllRegistrations, deleteRegistration, update } from '../controllers/registrations.js'
import { jwt, isAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/', jwt, create)
router.get('/me', jwt, getUserRegistrations)
router.get('/', jwt, isAdmin, getAllRegistrations) // New admin route for getting all registrations
router.patch('/:id', jwt, isAdmin, update) // New admin route for updating registration status
router.delete('/:id', jwt, isAdmin, deleteRegistration) // New admin route for deleting registration

export default router
