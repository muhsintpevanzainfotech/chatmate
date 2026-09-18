import express from 'express';
import {
  discoverUsers,
  getUserById,
  updateProfileAndPrivacy,
  deleteAccount,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/discover', protect, discoverUsers);
router.get('/:id', protect, getUserById);
router.patch('/me', protect, updateProfileAndPrivacy);
router.delete('/me', protect, deleteAccount);

export default router;
