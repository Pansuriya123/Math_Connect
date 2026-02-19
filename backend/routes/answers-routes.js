import express from 'express';
import { getAllAnswersOfUser, getAllAnswersOfQuestion, createAnswer, deleteAnswer, voteAnswer } from '../controllers/answers-controllers.js';
import * as userController from '../controllers/users-controllers.js';
const router = express.Router();

router.get('/count-votes', userController.isAuth, getAllAnswersOfUser);
router.get('/:questionId', getAllAnswersOfQuestion);
router.post('/:questionId', userController.isAuth, createAnswer);
router.delete('/delete/:answerId', userController.isAuth, deleteAnswer);
router.patch('/:answerId/:voteType', userController.isAuth, voteAnswer);

export default router;
