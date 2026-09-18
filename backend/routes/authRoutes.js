import express from 'express';
import { createProfile, getSession, clearSession } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/profile', createProfile);
router.get('/session', protect, getSession);
router.post('/leave', protect, clearSession);

export default router;
