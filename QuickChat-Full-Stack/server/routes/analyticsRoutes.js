import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getAnalytics, getUserActivity } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/', verifyToken, getAnalytics);
router.get('/activity', verifyToken, getUserActivity);

export default router;
