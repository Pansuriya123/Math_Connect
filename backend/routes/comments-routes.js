import express from 'express';
import { getComments, postComments } from '../controllers/comments-controllers.js';
import * as userController from '../controllers/users-controllers.js';
const router = express.Router();

router.get('/:answerId', userController.isAuth, getComments);
router.post('/:answerId', userController.isAuth, postComments);

export default router;
