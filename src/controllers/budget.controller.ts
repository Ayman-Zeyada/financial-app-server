import { Request, Response, NextFunction } from 'express';
import { Budget, Category, Transaction } from '../models';
import { ApiError } from '../middlewares/errorHandler';
import { Op } from 'sequelize';
import { sendBudgetAlert } from '../utils/email.utils';

export const createBudget = async (
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

    const { name, amount, period, startDate, endDate, categoryId } = req.body;

    if (categoryId) {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          userId: req.user.userId,
        },
      });

      if (!category) {
        const error = new Error('Category not found or does not belong to user') as ApiError;
        error.statusCode = 404;
        throw error;
      }

      if (category.type !== 'EXPENSE') {
        const error = new Error('Budgets can only be created for expense categories') as ApiError;
        error.statusCode = 400;
        throw error;
      }
    }

    const budget = await Budget.create({
      name,
      amount,
      period,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      userId: req.user.userId,
      categoryId: categoryId || null,
    });

    res.status(201).json({
      status: 'success',
      message: 'Budget created successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (
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

    const { active, period, categoryId } = req.query;

    const where: any = {
      userId: req.user.userId,
    };

    if (active === 'true') {
      const now = new Date();
      where.startDate = { [Op.lte]: now };
      where.endDate = {
        [Op.or]: [{ [Op.gt]: now }, { [Op.eq]: null }],
      };
    }

    if (period) {
      where.period = period;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const budgets = await Budget.findAll({
      where,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
          required: false,
        },
      ],
      order: [['startDate', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      count: budgets.length,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgetById = async (
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

    const budget = await Budget.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
          required: false,
        },
      ],
    });

    if (!budget) {
      const error = new Error('Budget not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (
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
    const { name, amount, period, startDate, endDate, categoryId } = req.body;

    const budget = await Budget.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!budget) {
      const error = new Error('Budget not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    if (categoryId !== undefined && categoryId !== budget.categoryId) {
      if (categoryId === null) {
        budget.categoryId = undefined;
      } else {
        const category = await Category.findOne({
          where: {
            id: categoryId,
            userId: req.user.userId,
          },
        });

        if (!category) {
          const error = new Error('Category not found or does not belong to user') as ApiError;
          error.statusCode = 404;
          throw error;
        }

        if (category.type !== 'EXPENSE') {
          const error = new Error('Budgets can only be created for expense categories') as ApiError;
          error.statusCode = 400;
          throw error;
        }

        budget.categoryId = categoryId;
      }
    }

    if (name !== undefined) budget.name = name;
    if (amount !== undefined) budget.amount = amount;
    if (period !== undefined) budget.period = period;
    if (startDate !== undefined) budget.startDate = new Date(startDate);
    if (endDate !== undefined) budget.endDate = endDate ? new Date(endDate) : undefined;

    await budget.save();

    res.status(200).json({
      status: 'success',
      message: 'Budget updated successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (
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

    const budget = await Budget.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!budget) {
      const error = new Error('Budget not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    await budget.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgetProgress = async (
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

    const budget = await Budget.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
          required: false,
        },
      ],
    });

    if (!budget) {
      const error = new Error('Budget not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const now = new Date();
    let startPeriodDate: Date;
    let endPeriodDate: Date;

    if (budget.startDate && budget.endDate) {
      startPeriodDate = new Date(budget.startDate);
      endPeriodDate = new Date(budget.endDate);
    } else {
      switch (budget.period) {
        case 'daily':
          startPeriodDate = new Date(now.setHours(0, 0, 0, 0));
          endPeriodDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'weekly':
          const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
          startPeriodDate = new Date(now);
          startPeriodDate.setDate(now.getDate() - dayOfWeek);
          startPeriodDate.setHours(0, 0, 0, 0);

          endPeriodDate = new Date(startPeriodDate);
          endPeriodDate.setDate(startPeriodDate.getDate() + 6);
          endPeriodDate.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'yearly':
          startPeriodDate = new Date(now.getFullYear(), 0, 1);
          endPeriodDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
    }

    const where: any = {
      userId: req.user.userId,
      date: {
        [Op.between]: [startPeriodDate, endPeriodDate],
      },
      type: 'EXPENSE',
    };

    if (budget.categoryId) {
      where.categoryId = budget.categoryId;
    }

    const transactions = await Transaction.findAll({
      where,
      attributes: ['id', 'amount', 'date', 'description'],
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
    });

    const totalSpent = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    const progressPercentage = (totalSpent / Number(budget.amount)) * 100;

    let status = 'within_budget';
    if (progressPercentage >= 100) {
      status = 'exceeded';
    } else if (progressPercentage >= 80) {
      status = 'warning';
    }

    res.status(200).json({
      status: 'success',
      data: {
        budget,
        period: {
          start: startPeriodDate,
          end: endPeriodDate,
        },
        progress: {
          totalSpent,
          budgetAmount: budget.amount,
          remainingAmount: Math.max(Number(budget.amount) - totalSpent, 0),
          percentage: progressPercentage,
          status,
        },
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBudgetsProgress = async (
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

    const now = new Date();

    const budgets = await Budget.findAll({
      where: {
        userId: req.user.userId,
        [Op.and]: [
          { startDate: { [Op.lte]: now } },
          {
            [Op.or]: [{ endDate: { [Op.gt]: now } }, { endDate: null as unknown as Date }],
          },
        ],
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
          required: false,
        },
      ],
    });

    const budgetProgress = await Promise.all(
      budgets.map(async (budget) => {
        let startPeriodDate: Date;
        let endPeriodDate: Date;

        if (budget.startDate && budget.endDate) {
          startPeriodDate = new Date(budget.startDate);
          endPeriodDate = new Date(budget.endDate);
        } else {
          switch (budget.period) {
            case 'daily':
              startPeriodDate = new Date(now.setHours(0, 0, 0, 0));
              endPeriodDate = new Date(now.setHours(23, 59, 59, 999));
              break;
            case 'weekly':
              const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
              startPeriodDate = new Date(now);
              startPeriodDate.setDate(now.getDate() - dayOfWeek);
              startPeriodDate.setHours(0, 0, 0, 0);

              endPeriodDate = new Date(startPeriodDate);
              endPeriodDate.setDate(startPeriodDate.getDate() + 6);
              endPeriodDate.setHours(23, 59, 59, 999);
              break;
            case 'monthly':
              startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
              endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
              break;
            case 'yearly':
              startPeriodDate = new Date(now.getFullYear(), 0, 1);
              endPeriodDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
              break;
            default:
              startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
              endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          }
        }

        const where: any = {
          userId: req.user?.userId,
          date: {
            [Op.between]: [startPeriodDate, endPeriodDate],
          },
          type: 'EXPENSE',
        };

        if (budget.categoryId) {
          where.categoryId = budget.categoryId;
        }

        const transactions = await Transaction.findAll({
          where,
          attributes: ['id', 'amount'],
        });

        const totalSpent = transactions.reduce(
          (sum, transaction) => sum + Number(transaction.amount),
          0,
        );

        const progressPercentage = (totalSpent / Number(budget.amount)) * 100;

        let status = 'within_budget';
        if (progressPercentage >= 100) {
          status = 'exceeded';
        } else if (progressPercentage >= 80) {
          status = 'warning';
        }

        return {
          budget,
          period: {
            start: startPeriodDate,
            end: endPeriodDate,
          },
          progress: {
            totalSpent,
            budgetAmount: budget.amount,
            remainingAmount: Math.max(Number(budget.amount) - totalSpent, 0),
            percentage: progressPercentage,
            status,
          },
        };
      }),
    );

    res.status(200).json({
      status: 'success',
      count: budgetProgress.length,
      data: budgetProgress,
    });
  } catch (error) {
    next(error);
  }
};

export const checkBudgetAlerts = async (): Promise<void> => {
  try {
    const budgetProgress = await getAllBudgetsWithProgress();

    for (const item of budgetProgress) {
      const { budget, progress } = item;

      if (progress.status === 'exceeded' || progress.status === 'warning') {
        const { User } = require('../models');
        const user = await User.findByPk(budget.userId);

        if (user && user.email) {
          await sendBudgetAlert(
            user.id,
            user.email,
            budget.name,
            progress.totalSpent - Number(budget.amount),
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error);
  }
};

const getAllBudgetsWithProgress = async () => {
  const now = new Date();

  const budgets = await Budget.findAll({
    where: {
      [Op.and]: [
        { startDate: { [Op.lte]: now } },
        {
          [Op.or]: [{ endDate: { [Op.gt]: now } }, { endDate: null as unknown as Date }],
        },
      ],
    },
    include: [
      {
        model: Category,
        attributes: ['id', 'name', 'color', 'icon'],
        required: false,
      },
    ],
  });

  const budgetProgress = await Promise.all(
    budgets.map(async (budget) => {
      let startPeriodDate: Date;
      let endPeriodDate: Date;

      if (budget.startDate && budget.endDate) {
        startPeriodDate = new Date(budget.startDate);
        endPeriodDate = new Date(budget.endDate);
      } else {
        switch (budget.period) {
          case 'daily':
            startPeriodDate = new Date(now.setHours(0, 0, 0, 0));
            endPeriodDate = new Date(now.setHours(23, 59, 59, 999));
            break;
          case 'weekly':
            const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
            startPeriodDate = new Date(now);
            startPeriodDate.setDate(now.getDate() - dayOfWeek);
            startPeriodDate.setHours(0, 0, 0, 0);

            endPeriodDate = new Date(startPeriodDate);
            endPeriodDate.setDate(startPeriodDate.getDate() + 6);
            endPeriodDate.setHours(23, 59, 59, 999);
            break;
          case 'monthly':
            startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
          case 'yearly':
            startPeriodDate = new Date(now.getFullYear(), 0, 1);
            endPeriodDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
          default:
            startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
      }

      const where: any = {
        userId: budget.userId,
        date: {
          [Op.between]: [startPeriodDate, endPeriodDate],
        },
        type: 'EXPENSE',
      };

      if (budget.categoryId) {
        where.categoryId = budget.categoryId;
      }

      const transactions = await Transaction.findAll({
        where,
        attributes: ['id', 'amount'],
      });

      const totalSpent = transactions.reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0,
      );

      const progressPercentage = (totalSpent / Number(budget.amount)) * 100;

      let status = 'within_budget';
      if (progressPercentage >= 100) {
        status = 'exceeded';
      } else if (progressPercentage >= 80) {
        status = 'warning';
      }

      return {
        budget,
        period: {
          start: startPeriodDate,
          end: endPeriodDate,
        },
        progress: {
          totalSpent,
          budgetAmount: budget.amount,
          remainingAmount: Math.max(Number(budget.amount) - totalSpent, 0),
          percentage: progressPercentage,
          status,
        },
      };
    }),
  );

  return budgetProgress;
};
