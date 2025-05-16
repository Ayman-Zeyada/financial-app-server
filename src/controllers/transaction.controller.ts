import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Transaction, Category, User } from '../models';
import { ApiError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

export const createTransaction = async (
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

    const {
      amount,
      description,
      date,
      type,
      categoryId,
      recurring = false,
      recurringInterval = null,
    } = req.body;

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

    if (String(category.type) !== type) {
      const error = new Error(
        `Transaction type must match category type (${category.type})`,
      ) as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const transaction = await Transaction.create({
      amount,
      description,
      date: date || new Date(),
      type,
      recurring,
      recurringInterval,
      userId: req.user.userId,
      categoryId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
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

    const {
      startDate,
      endDate,
      type,
      categoryId,
      recurring,
      limit = 50,
      offset = 0,
      sortBy = 'date',
      sortOrder = 'DESC',
    } = req.query;

    const where: any = {
      userId: req.user.userId,
    };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: new Date(startDate as string),
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: new Date(endDate as string),
      };
    }

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (recurring !== undefined) {
      where.recurring = recurring === 'true';
    }

    const transactions = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [[sortBy as string, sortOrder as string]],
    });

    res.status(200).json({
      status: 'success',
      count: transactions.count,
      data: transactions.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
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

    const transaction = await Transaction.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
    });

    if (!transaction) {
      const error = new Error('Transaction not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
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
    const { amount, description, date, type, categoryId, recurring, recurringInterval } = req.body;

    const transaction = await Transaction.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!transaction) {
      const error = new Error('Transaction not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    if (categoryId && categoryId !== transaction.categoryId) {
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

      if (type && category.type !== type) {
        const error = new Error(
          `Transaction type must match category type (${category.type})`,
        ) as ApiError;
        error.statusCode = 400;
        throw error;
      }

      if (!type && String(category.type) !== String(transaction.type)) {
        const error = new Error(
          `New category type (${category.type}) does not match transaction type (${transaction.type})`,
        ) as ApiError;
        error.statusCode = 400;
        throw error;
      }
    }

    if (amount !== undefined) transaction.amount = amount;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = new Date(date);
    if (type !== undefined) transaction.type = type;
    if (categoryId !== undefined) transaction.categoryId = categoryId;
    if (recurring !== undefined) transaction.recurring = recurring;
    if (recurringInterval !== undefined) transaction.recurringInterval = recurringInterval;

    await transaction.save();

    res.status(200).json({
      status: 'success',
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
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

    const transaction = await Transaction.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!transaction) {
      const error = new Error('Transaction not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    await transaction.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const bulkCreateTransactions = async (
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

    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      const error = new Error('Invalid transactions array') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Verify all categories belong to the user
    const categoryIds = [...new Set(transactions.map((t) => t.categoryId))];

    const categories = await Category.findAll({
      where: {
        id: categoryIds,
        userId: req.user.userId,
      },
    });

    if (categories.length !== categoryIds.length) {
      const error = new Error(
        'One or more categories not found or do not belong to user',
      ) as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const transactionsToCreate = transactions.map((t) => ({
      ...t,
      userId: req.user?.userId,
      date: t.date ? new Date(t.date) : new Date(),
    }));

    const createdTransactions = await Transaction.bulkCreate(transactionsToCreate);

    res.status(201).json({
      status: 'success',
      message: `Successfully created ${createdTransactions.length} transactions`,
      count: createdTransactions.length,
      data: createdTransactions,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecurringTransactions = async (
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

    const recurringTransactions = await Transaction.findAll({
      where: {
        userId: req.user.userId,
        recurring: true,
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
      order: [['date', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      count: recurringTransactions.length,
      data: recurringTransactions,
    });
  } catch (error) {
    next(error);
  }
};

export const processRecurringTransactions = async (): Promise<void> => {
  try {
    const today = new Date();
    const users = await User.findAll();

    for (const user of users) {
      const recurringTransactions = await Transaction.findAll({
        where: {
          userId: user.id,
          recurring: true,
        },
      });

      for (const transaction of recurringTransactions) {
        const lastTransactionDate = new Date(transaction.date);
        let createNewTransaction = false;

        switch (transaction.recurringInterval) {
          case 'daily':
            createNewTransaction =
              today.getDate() !== lastTransactionDate.getDate() ||
              today.getMonth() !== lastTransactionDate.getMonth() ||
              today.getFullYear() !== lastTransactionDate.getFullYear();
            break;
          case 'weekly':
            const weekDiff = Math.floor(
              (today.getTime() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
            );
            createNewTransaction = weekDiff >= 1;
            break;
          case 'biweekly':
            const biWeekDiff = Math.floor(
              (today.getTime() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24 * 14),
            );
            createNewTransaction = biWeekDiff >= 1;
            break;
          case 'monthly':
            createNewTransaction =
              today.getMonth() !== lastTransactionDate.getMonth() ||
              today.getFullYear() !== lastTransactionDate.getFullYear();
            break;
          case 'quarterly':
            const quarterDiff =
              today.getMonth() -
              lastTransactionDate.getMonth() +
              (today.getFullYear() - lastTransactionDate.getFullYear()) * 12;
            createNewTransaction = quarterDiff >= 3;
            break;
          case 'yearly':
            createNewTransaction = today.getFullYear() !== lastTransactionDate.getFullYear();
            break;
          default:
            createNewTransaction = false;
        }

        if (createNewTransaction) {
          await Transaction.create({
            amount: transaction.amount,
            description: transaction.description,
            date: today,
            type: transaction.type,
            recurring: true,
            recurringInterval: transaction.recurringInterval,
            userId: user.id,
            categoryId: transaction.categoryId,
          });

          logger.info(
            `Created recurring transaction: ${transaction.description} for user ${user.id}`,
          );
        }
      }
    }

    logger.info('Processed all recurring transactions successfully');
  } catch (error) {
    logger.error(`Error processing recurring transactions: ${error}`);
  }
};
