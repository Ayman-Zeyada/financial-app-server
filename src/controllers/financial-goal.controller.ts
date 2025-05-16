import { Request, Response, NextFunction } from 'express';
import { FinancialGoal } from '../models';
import { ApiError } from '../middlewares/errorHandler';
import { financialGoalsService } from '../services/financial-goals.service';

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

    const progress = await financialGoalsService.calculateGoalProgress(financialGoal.id);

    res.status(201).json({
      status: 'success',
      message: 'Financial goal created successfully',
      data: {
        goal: financialGoal,
        progress: progress.progress,
      },
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
      order: [['targetDate', 'ASC']],
    });

    const goalsWithProgress = await Promise.all(
      financialGoals.map(async (goal) => {
        const progress = await financialGoalsService.calculateGoalProgress(goal.id);
        return {
          goal,
          progress: progress.progress,
        };
      }),
    );

    res.status(200).json({
      status: 'success',
      count: goalsWithProgress.length,
      data: goalsWithProgress,
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

    const progress = await financialGoalsService.calculateGoalProgress(financialGoal.id);

    res.status(200).json({
      status: 'success',
      data: {
        goal: financialGoal,
        progress: progress.progress,
      },
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

    const oldCurrentAmount = Number(financialGoal.currentAmount);
    let wasUpdated = false;

    if (name !== undefined) {
      financialGoal.name = name;
      wasUpdated = true;
    }

    if (targetAmount !== undefined) {
      financialGoal.targetAmount = targetAmount;
      wasUpdated = true;
    }

    if (currentAmount !== undefined && currentAmount !== oldCurrentAmount) {
      financialGoal.currentAmount = currentAmount;
      wasUpdated = true;
    }

    if (targetDate !== undefined) {
      financialGoal.targetDate = targetDate;
      wasUpdated = true;
    }

    if (description !== undefined) {
      financialGoal.description = description;
      wasUpdated = true;
    }

    if (category !== undefined) {
      financialGoal.category = category;
      wasUpdated = true;
    }

    if (wasUpdated) {
      await financialGoal.save();
    }

    const progress = await financialGoalsService.calculateGoalProgress(financialGoal.id);

    const wasAchieved =
      oldCurrentAmount < Number(financialGoal.targetAmount) &&
      Number(financialGoal.currentAmount) >= Number(financialGoal.targetAmount);

    res.status(200).json({
      status: 'success',
      message: 'Financial goal updated successfully',
      data: {
        goal: financialGoal,
        progress: progress.progress,
        wasAchieved,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGoalProgress = async (
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
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount === 0) {
      const error = new Error('Amount must be a non-zero number') as ApiError;
      error.statusCode = 400;
      throw error;
    }

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

    const result = await financialGoalsService.updateGoalProgress(financialGoal.id, amount);

    res.status(200).json({
      status: 'success',
      message: 'Goal progress updated successfully',
      data: {
        goal: result.goal,
        progress: result.progress,
        wasAchieved: result.wasAchieved,
      },
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
