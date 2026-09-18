import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import {
  getStats,
  getUsers,
  updateUserStatus,
  getReports,
  updateReportStatus,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Admin Login Endpoint
router.post('/auth/login', adminLogin);

// Protected Admin Routes
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/reports', getReports);
router.patch('/reports/:id', updateReportStatus);

export default router;
