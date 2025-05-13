import express, { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  uploadAvatar,
  getAvatar,
  getUserPreferences,
  updateUserPreferences,
  createFinancialGoal,
  getUserFinancialGoals,
  getFinancialGoalById,
  updateFinancialGoal,
  deleteFinancialGoal,
} from '../controllers/user.controller';
import { authenticate, isVerified } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const router: Router = express.Router();

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req: any, file: any, cb: any) => {
    const userId = req.user?.userId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `user-${userId}-${timestamp}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);
router.delete('/profile', authenticate, deleteUserAccount);

router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.get('/avatar', authenticate, getAvatar);

router.get('/preferences', authenticate, getUserPreferences);
router.put('/preferences', authenticate, updateUserPreferences);

router.post('/goals', authenticate, isVerified, createFinancialGoal);
router.get('/goals', authenticate, getUserFinancialGoals);
router.get('/goals/:id', authenticate, getFinancialGoalById);
router.put('/goals/:id', authenticate, isVerified, updateFinancialGoal);
router.delete('/goals/:id', authenticate, isVerified, deleteFinancialGoal);

export default router;
