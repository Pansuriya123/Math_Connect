import express from 'express';
import { getNotifications, markNotificationRead, markAllRead } from '../controllers/notifications-controllers.js';
import { isAuth } from '../controllers/users-controllers.js';

const router = express.Router();

router.use(isAuth); // Protect all notification routes

router.get('/', getNotifications);
router.patch('/:nid/read', markNotificationRead);
router.patch('/read-all', markAllRead);

export default router;
