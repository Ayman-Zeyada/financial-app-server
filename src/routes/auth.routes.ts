import express, { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody, authValidation } from '../middlewares/validation.middleware';

const router: Router = express.Router();

router.post('/register', validateBody(authValidation.register), register);
router.post('/login', validateBody(authValidation.login), login);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post(
  '/request-password-reset',
  validateBody(authValidation.requestPasswordReset),
  requestPasswordReset,
);
router.post('/reset-password/:token', validateBody(authValidation.resetPassword), resetPassword);

router.get('/me', authenticate, getCurrentUser);

export default router;
