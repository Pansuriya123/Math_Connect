import express from 'express';
import { getQuestions, getQuestionById, getUserQuestions, createUserQuestion, deleteQuestion } from '../controllers/questions-controllers.js';
const router = express.Router();

router.get('/', getQuestions);
router.get('/:id', getQuestionById);
router.get('/:username/', getUserQuestions);
router.post('/:username/', createUserQuestion);
router.delete('/:id', deleteQuestion);

export default router;
