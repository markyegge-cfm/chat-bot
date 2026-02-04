import express from 'express';
import { getWidgetSettings, updateWidgetSettings } from '../controllers/widgetSettingsController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public route to get widget settings
router.get('/api/widget-settings', getWidgetSettings);

// Protected route to update widget settings (admin only)
router.put('/api/widget-settings', authenticateAdmin, updateWidgetSettings);

export default router;
