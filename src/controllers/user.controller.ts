import { Request, Response, NextFunction } from 'express';
import { User, UserPreference, FinancialGoal } from '../models';
import { ApiError } from '../middlewares/errorHandler';
import { sendNotificationEmail } from '../utils/email.utils';

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findByPk(req.user.userId, {
      attributes: {
        exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'],
      },
    });

    if (!user) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { firstName, lastName, email } = req.body;

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email && email !== user.email) {
      user.email = email;
      user.isVerified = false;
      const verificationToken =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user.verificationToken = verificationToken;

      await sendNotificationEmail(email, 'verify_email', { token: verificationToken });
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    await user.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    if (!req.file) {
      const error = new Error('No file uploaded') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await User.update({ avatarUrl }, { where: { id: user.id } });

    res.status(200).json({
      status: 'success',
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    if (!user.avatarUrl) {
      const error = new Error('No avatar found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: {
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const userPreferences = await UserPreference.findOne({
      where: { userId: req.user.userId },
    });

    if (!userPreferences) {
      res.status(200).json({
        status: 'success',
        data: {
          currency: 'USD',
          theme: 'light',
          language: 'en',
          notifications: true,
        },
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: userPreferences,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { currency, theme, language, notifications } = req.body;

    let userPreferences = await UserPreference.findOne({
      where: { userId: req.user.userId },
    });

    if (!userPreferences) {
      userPreferences = await UserPreference.create({
        userId: req.user.userId,
        currency: currency || 'USD',
        theme: theme || 'light',
        language: language || 'en',
        notifications: notifications !== undefined ? notifications : true,
      });
    } else {
      if (currency !== undefined) userPreferences.currency = currency;
      if (theme !== undefined) userPreferences.theme = theme;
      if (language !== undefined) userPreferences.language = language;
      if (notifications !== undefined) userPreferences.notifications = notifications;
      await userPreferences.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Preferences updated successfully',
      data: userPreferences,
    });
  } catch (error) {
    next(error);
  }
};

export const createFinancialGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { name, targetAmount, currentAmount, targetDate, description, category } = req.body;

    const financialGoal = await FinancialGoal.create({
      userId: req.user.userId,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      targetDate,
      description,
      category,
    });

    res.status(201).json({
      status: 'success',
      message: 'Financial goal created successfully',
      data: financialGoal,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserFinancialGoals = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const financialGoals = await FinancialGoal.findAll({
      where: { userId: req.user.userId },
    });

    res.status(200).json({
      status: 'success',
      count: financialGoals.length,
      data: financialGoals,
    });
  } catch (error) {
    next(error);
  }
};

export const getFinancialGoalById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;

    const financialGoal = await FinancialGoal.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!financialGoal) {
      const error = new Error('Financial goal not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: financialGoal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFinancialGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;
    const { name, targetAmount, currentAmount, targetDate, description, category } = req.body;

    const financialGoal = await FinancialGoal.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!financialGoal) {
      const error = new Error('Financial goal not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    if (name !== undefined) financialGoal.name = name;
    if (targetAmount !== undefined) financialGoal.targetAmount = targetAmount;
    if (currentAmount !== undefined) financialGoal.currentAmount = currentAmount;
    if (targetDate !== undefined) financialGoal.targetDate = targetDate;
    if (description !== undefined) financialGoal.description = description;
    if (category !== undefined) financialGoal.category = category;

    await financialGoal.save();

    res.status(200).json({
      status: 'success',
      message: 'Financial goal updated successfully',
      data: financialGoal,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFinancialGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;

    const financialGoal = await FinancialGoal.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!financialGoal) {
      const error = new Error('Financial goal not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    await financialGoal.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Financial goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
