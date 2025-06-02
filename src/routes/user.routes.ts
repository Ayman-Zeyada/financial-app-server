import express, { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  uploadAvatar,
  getAvatar,
  getUserPreferences,
  updateUserPreferences,
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

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         password:
 *                           description: Password is excluded from response
 *                         verificationToken:
 *                           description: Verification token is excluded from response
 *                         resetPasswordToken:
 *                           description: Reset token is excluded from response
 *                         resetPasswordExpires:
 *                           description: Reset expiry is excluded from response
 *             example:
 *               status: success
 *               data:
 *                 id: 1
 *                 username: john_doe
 *                 email: john@example.com
 *                 firstName: John
 *                 lastName: Doe
 *                 isVerified: true
 *                 avatarUrl: /uploads/avatars/user-1-1702123456789.jpg
 *                 createdAt: '2023-12-01T10:30:00.000Z'
 *                 updatedAt: '2023-12-07T14:20:00.000Z'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/profile', authenticate, getUserProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: John
 *                 description: Updated first name
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: Smith
 *                 description: Updated last name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.smith@example.com
 *                 description: Updated email address (will require re-verification)
 *           examples:
 *             update_name:
 *               summary: Update name only
 *               value:
 *                 firstName: John
 *                 lastName: Smith
 *             update_email:
 *               summary: Update email (requires re-verification)
 *               value:
 *                 email: john.smith@example.com
 *             update_all:
 *               summary: Update all fields
 *               value:
 *                 firstName: John
 *                 lastName: Smith
 *                 email: john.smith@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: john.smith@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Smith
 *                     isVerified:
 *                       type: boolean
 *                       example: false
 *                       description: Will be false if email was changed
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/profile', authenticate, updateUserProfile);

/**
 * @swagger
 * /users/profile:
 *   delete:
 *     summary: Delete user account permanently
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/profile', authenticate, deleteUserAccount);

/**
 * @swagger
 * /users/avatar:
 *   post:
 *     summary: Upload user avatar image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, JPEG, PNG, GIF) - max 5MB
 *           encoding:
 *             avatar:
 *               contentType: image/jpeg, image/png, image/gif
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Avatar uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       example: /uploads/avatars/user-1-1702123456789.jpg
 *                       description: URL path to the uploaded avatar
 *       400:
 *         description: No file uploaded or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               no_file:
 *                 summary: No file uploaded
 *                 value:
 *                   status: error
 *                   message: No file uploaded
 *                   statusCode: 400
 *               invalid_file:
 *                 summary: Invalid file type
 *                 value:
 *                   status: error
 *                   message: Only image files are allowed!
 *                   statusCode: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               status: error
 *               message: File too large. Maximum size is 5MB
 *               statusCode: 413
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

/**
 * @swagger
 * /users/avatar:
 *   get:
 *     summary: Get current user's avatar URL
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       example: /uploads/avatars/user-1-1702123456789.jpg
 *                       description: URL path to the user's avatar
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found or no avatar set
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               user_not_found:
 *                 summary: User not found
 *                 value:
 *                   status: error
 *                   message: User not found
 *                   statusCode: 404
 *               no_avatar:
 *                 summary: No avatar found
 *                 value:
 *                   status: error
 *                   message: No avatar found
 *                   statusCode: 404
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/avatar', authenticate, getAvatar);

/**
 * @swagger
 * /users/preferences:
 *   get:
 *     summary: Get user preferences and settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/UserPreference'
 *                     - type: object
 *                       description: If no preferences exist, default values are returned
 *             examples:
 *               existing_preferences:
 *                 summary: User has saved preferences
 *                 value:
 *                   status: success
 *                   data:
 *                     id: 1
 *                     userId: 1
 *                     currency: EUR
 *                     theme: dark
 *                     language: es
 *                     notifications: false
 *                     createdAt: '2023-12-01T10:30:00.000Z'
 *                     updatedAt: '2023-12-07T14:20:00.000Z'
 *               default_preferences:
 *                 summary: Default preferences (no saved preferences)
 *                 value:
 *                   status: success
 *                   data:
 *                     currency: USD
 *                     theme: light
 *                     language: en
 *                     notifications: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/preferences', authenticate, getUserPreferences);

/**
 * @swagger
 * /users/preferences:
 *   put:
 *     summary: Update user preferences and settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 3
 *                 example: EUR
 *                 description: ISO 4217 currency code (3 characters)
 *               theme:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 enum: [light, dark, auto]
 *                 example: dark
 *                 description: UI theme preference
 *               language:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 5
 *                 example: en-US
 *                 description: Language/locale preference (ISO 639-1 format)
 *               notifications:
 *                 type: boolean
 *                 example: false
 *                 description: Enable/disable email notifications
 *           examples:
 *             update_currency:
 *               summary: Change currency only
 *               value:
 *                 currency: EUR
 *             update_theme:
 *               summary: Switch to dark theme
 *               value:
 *                 theme: dark
 *             disable_notifications:
 *               summary: Disable notifications
 *               value:
 *                 notifications: false
 *             update_all:
 *               summary: Update all preferences
 *               value:
 *                 currency: GBP
 *                 theme: dark
 *                 language: en-GB
 *                 notifications: true
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Preferences updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserPreference'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/preferences', authenticate, updateUserPreferences);

export default router;
