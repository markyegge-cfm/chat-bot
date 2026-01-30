import express from 'express';
import StatsController from '../controllers/statsController';

const router = express.Router();

router.get('/api/stats', StatsController.getDashboardStats);

export default router;
