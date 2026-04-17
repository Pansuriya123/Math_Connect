import express from 'express';
import { check, validationResult } from 'express-validator';
import * as userController from '../controllers/users-controllers.js';
import { signup } from '../controllers/signup-controller.js';
import { basicAuthMiddleware } from '../controllers/auth-controller.js';
const router = express.Router();
import multer from 'multer';

const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB (adjust as needed)
});

router.get('/', userController.getUsers);
router.get('/leaderboard', userController.getLeaderboard);

router.post(
  '/signup',
  [
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[\W_]/)
      .withMessage('Password must contain at least one special character'),
  ],
  signup
);

router.patch("/edit-name/:userId/:Name", userController.editName);


router.post('/login',userController.login);

router.post('/logout', userController.logout);

router.get('/current', userController.isAuth, userController.getCurrentUser);

router.get('/check-auth', userController.isAuth, (req, res) => {
    res.status(200).json({ message: 'Authenticated' });
  });

  router.patch(
    "/:userId/update-password",
    [
      check("currentPassword")
        .not()
        .isEmpty()
        .withMessage("Current password is required"),
      check("newPassword")
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters long"),
    ],
    userController.updatePassword
  );
  
  router.post("/send-otp", userController.sendOtpEmail);
  
  router.post("/verify-otp", userController.verifyOtp);
  
  router.post("/reset-password", userController.resetPassword);

  router.patch("/:userId/update-photo",upload.single('profilePhoto'),userController.editPhoto)

// Remove profile photo
router.delete('/:userId/remove-photo', userController.removePhoto)


export default router;
