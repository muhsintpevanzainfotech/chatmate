import express from 'express';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  createReport,
} from '../controllers/blockReportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/users/:id/block', protect, blockUser);
router.delete('/users/:id/block', protect, unblockUser);
router.get('/users/blocked', protect, getBlockedUsers);
router.post('/reports', protect, createReport);

export default router;
