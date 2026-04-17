import express from 'express';
import { getAISolution } from '../controllers/ai-controller.js';
import { isAuth } from '../controllers/users-controllers.js';

const router = express.Router();

// Get AI solution for a math problem
// Protected by auth to prevent abuse
router.post('/solve', isAuth, getAISolution);

export default router;
