import { Request, Response, NextFunction } from 'express';
import { Category, Transaction } from '../models';
import { ApiError } from '../middlewares/error-handler.middleware';
import { Op } from 'sequelize';

export const createCategory = async (
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

    const { name, description, type, color, icon } = req.body;

    const existingCategory = await Category.findOne({
      where: {
        name,
        userId: req.user.userId,
      },
    });

    if (existingCategory) {
      const error = new Error(`Category with name '${name}' already exists`) as ApiError;
      error.statusCode = 409;
      throw error;
    }

    const category = await Category.create({
      name,
      description,
      type,
      color: color || '#000000',
      icon,
      userId: req.user.userId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
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

    const { type } = req.query;

    const where: any = {
      userId: req.user.userId,
    };

    if (type) {
      where.type = type;
    }

    const categories = await Category.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (
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

    const category = await Category.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!category) {
      const error = new Error('Category not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
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
    const { name, description, type, color, icon } = req.body;

    const category = await Category.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!category) {
      const error = new Error('Category not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: {
          name,
          userId: req.user.userId,
          id: { [Op.ne]: id }, // Not the current category
        },
      });

      if (existingCategory) {
        const error = new Error(`Category with name '${name}' already exists`) as ApiError;
        error.statusCode = 409;
        throw error;
      }
    }

    if (type && type !== category.type) {
      const transactionsCount = await Transaction.count({
        where: {
          categoryId: id,
          type: { [Op.ne]: type },
        },
      });

      if (transactionsCount > 0) {
        const error = new Error(
          `Cannot change category type because there are ${transactionsCount} transactions ` +
            `with type ${category.type}`,
        ) as ApiError;
        error.statusCode = 400;
        throw error;
      }
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (type !== undefined) category.type = type;
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;

    await category.save();

    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
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

    const category = await Category.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!category) {
      const error = new Error('Category not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const transactionsCount = await Transaction.count({
      where: {
        categoryId: id,
      },
    });

    if (transactionsCount > 0) {
      const error = new Error(
        `Cannot delete category because it is assigned to ${transactionsCount} transactions. ` +
          `Reassign or delete these transactions first.`,
      ) as ApiError;
      error.statusCode = 400;
      throw error;
    }

    await category.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryTransactions = async (
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
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    const category = await Category.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!category) {
      const error = new Error('Category not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const where: any = {
      categoryId: id,
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

    const transactions = await Transaction.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['date', 'DESC']],
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

export const bulkCreateCategories = async (
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

    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      const error = new Error('Invalid categories array') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const categoryNames = categories.map((c) => c.name);
    const uniqueNames = new Set(categoryNames);

    if (uniqueNames.size !== categoryNames.length) {
      const error = new Error('Request contains duplicate category names') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const existingCategories = await Category.findAll({
      where: {
        name: { [Op.in]: categoryNames },
        userId: req.user.userId,
      },
    });

    if (existingCategories.length > 0) {
      const existingNames = existingCategories.map((c) => c.name).join(', ');
      const error = new Error(
        `Categories already exist with the following names: ${existingNames}`,
      ) as ApiError;
      error.statusCode = 409;
      throw error;
    }

    const categoriesToCreate = categories.map((c) => ({
      ...c,
      userId: req.user?.userId,
      color: c.color || '#000000',
    }));

    const createdCategories = await Category.bulkCreate(categoriesToCreate);

    res.status(201).json({
      status: 'success',
      message: `Successfully created ${createdCategories.length} categories`,
      count: createdCategories.length,
      data: createdCategories,
    });
  } catch (error) {
    next(error);
  }
};
