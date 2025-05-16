import { Request, Response, NextFunction } from 'express';
import { Transaction, Category, Budget } from '../models';
import { ApiError } from '../middlewares/errorHandler';
import { Op, Sequelize } from 'sequelize';
import { sendMonthlySummary } from '../utils/email.utils';
import { AggregationResult, DateAggregationResult, TransactionWithCategory } from '../models/types';

export const getIncomeVsExpenses = async (
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

    const { startDate, endDate, groupBy = 'month' } = req.query;

    if (!startDate || !endDate) {
      const error = new Error('Start date and end date are required') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const error = new Error('Invalid date format') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    if (start > end) {
      const error = new Error('Start date must be before end date') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    let dateGroupingExpression;
    let dateFormatting;

    switch (groupBy) {
      case 'day':
        dateGroupingExpression = Sequelize.fn('date_trunc', 'day', Sequelize.col('date'));
        dateFormatting = 'YYYY-MM-DD';
        break;
      case 'week':
        dateGroupingExpression = Sequelize.fn('date_trunc', 'week', Sequelize.col('date'));
        dateFormatting = 'YYYY-MM-DD';
        break;
      case 'month':
        dateGroupingExpression = Sequelize.fn('date_trunc', 'month', Sequelize.col('date'));
        dateFormatting = 'YYYY-MM';
        break;
      case 'quarter':
        dateGroupingExpression = Sequelize.fn('date_trunc', 'quarter', Sequelize.col('date'));
        dateFormatting = 'YYYY-Q';
        break;
      case 'year':
        dateGroupingExpression = Sequelize.fn('date_trunc', 'year', Sequelize.col('date'));
        dateFormatting = 'YYYY';
        break;
      default:
        dateGroupingExpression = Sequelize.fn('date_trunc', 'month', Sequelize.col('date'));
        dateFormatting = 'YYYY-MM';
    }

    const incomeTransactions = await Transaction.findAll({
      attributes: [
        [dateGroupingExpression, 'date'],
        [Sequelize.fn('sum', Sequelize.col('amount')), 'total'],
      ],
      where: {
        userId: req.user.userId,
        type: 'INCOME',
        date: {
          [Op.between]: [start, end],
        },
      },
      group: [dateGroupingExpression],
      order: [[dateGroupingExpression, 'ASC']],
      raw: true,
    });

    const expenseTransactions = await Transaction.findAll({
      attributes: [
        [dateGroupingExpression, 'date'],
        [Sequelize.fn('sum', Sequelize.col('amount')), 'total'],
      ],
      where: {
        userId: req.user.userId,
        type: 'EXPENSE',
        date: {
          [Op.between]: [start, end],
        },
      },
      group: [dateGroupingExpression],
      order: [[dateGroupingExpression, 'ASC']],
      raw: true,
    });

    const formattedIncomeByDate = incomeTransactions.map((item: any) => ({
      date: item.date,
      total: parseFloat(item.total),
    }));

    const formattedExpensesByDate = expenseTransactions.map((item: any) => ({
      date: item.date,
      total: parseFloat(item.total),
    }));

    const mergedResults: any[] = [];
    const allDates = new Set([
      ...formattedIncomeByDate.map((item) => item.date.toISOString()),
      ...formattedExpensesByDate.map((item) => item.date.toISOString()),
    ]);

    allDates.forEach((dateStr) => {
      const date = new Date(dateStr);

      const income = formattedIncomeByDate.find((item) => item.date.toISOString() === dateStr);

      const expense = formattedExpensesByDate.find((item) => item.date.toISOString() === dateStr);

      mergedResults.push({
        date: date,
        formattedDate: formatDate(date, dateFormatting),
        income: income ? income.total : 0,
        expenses: expense ? expense.total : 0,
        netSavings: (income ? income.total : 0) - (expense ? expense.total : 0),
      });
    });

    mergedResults.sort((a, b) => a.date.getTime() - b.date.getTime());

    const totalIncome = formattedIncomeByDate.reduce((sum, item) => sum + item.total, 0);

    const totalExpenses = formattedExpensesByDate.reduce((sum, item) => sum + item.total, 0);

    const totalNetSavings = totalIncome - totalExpenses;

    res.status(200).json({
      status: 'success',
      data: {
        byPeriod: mergedResults,
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          netSavings: totalNetSavings,
          savingsRate: totalIncome > 0 ? (totalNetSavings / totalIncome) * 100 : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpensesByCategory = async (
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

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      const error = new Error('Start date and end date are required') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const error = new Error('Invalid date format') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    if (start > end) {
      const error = new Error('Start date must be before end date') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const expensesByCategory = await Transaction.findAll({
      attributes: ['categoryId', [Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
      where: {
        userId: req.user.userId,
        type: 'EXPENSE',
        date: {
          [Op.between]: [start, end],
        },
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
      group: ['categoryId', 'Category.id', 'Category.name', 'Category.color', 'Category.icon'],
      order: [[Sequelize.fn('sum', Sequelize.col('amount')), 'DESC']],
    });

    const totalExpenses = expensesByCategory.reduce(
      (sum, item) => sum + parseFloat(item.get('total') as string),
      0,
    );

    const formattedResults = expensesByCategory.map((item) => {
      const total = parseFloat(item.get('total') as string);
      const percentage = (total / totalExpenses) * 100;

      return {
        category: (item as TransactionWithCategory).Category,
        total,
        percentage,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        categories: formattedResults,
        totalExpenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyCashFlow = async (
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

    const { year, month } = req.params;

    const yearNumber = parseInt(year);
    const monthNumber = parseInt(month) - 1;

    if (isNaN(yearNumber) || isNaN(monthNumber) || monthNumber < 0 || monthNumber > 11) {
      const error = new Error('Invalid year or month') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const startDate = new Date(yearNumber, monthNumber, 1);
    const endDate = new Date(yearNumber, monthNumber + 1, 0, 23, 59, 59, 999);

    const transactions = (await Transaction.findAll({
      where: {
        userId: req.user.userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon', 'type'],
        },
      ],
      order: [['date', 'ASC']],
    })) as unknown as TransactionWithCategory[];

    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    const categoryDetails: Record<string, any> = {};

    transactions.forEach((transaction: TransactionWithCategory) => {
      if (transaction.type === 'INCOME') {
        totalIncome += Number(transaction.amount);

        const categoryId = transaction.categoryId.toString();
        incomeByCategory[categoryId] =
          (incomeByCategory[categoryId] || 0) + Number(transaction.amount);

        if (!categoryDetails[categoryId] && transaction.Category) {
          categoryDetails[categoryId] = {
            id: transaction.Category.id,
            name: transaction.Category.name,
            color: transaction.Category.color,
            icon: transaction.Category.icon,
          };
        }
      } else if (transaction.type === 'EXPENSE') {
        totalExpenses += Number(transaction.amount);

        const categoryId = transaction.categoryId.toString();
        expensesByCategory[categoryId] =
          (expensesByCategory[categoryId] || 0) + Number(transaction.amount);

        if (!categoryDetails[categoryId] && transaction.Category) {
          categoryDetails[categoryId] = {
            id: transaction.Category.id,
            name: transaction.Category.name,
            color: transaction.Category.color,
            icon: transaction.Category.icon,
          };
        }
      }
    });

    const formattedIncomeByCategory = Object.entries(incomeByCategory).map(
      ([categoryId, total]) => ({
        category: categoryDetails[categoryId],
        total,
        percentage: (total / totalIncome) * 100,
      }),
    );

    const formattedExpensesByCategory = Object.entries(expensesByCategory).map(
      ([categoryId, total]) => ({
        category: categoryDetails[categoryId],
        total,
        percentage: (total / totalExpenses) * 100,
      }),
    );

    formattedIncomeByCategory.sort((a, b) => b.total - a.total);
    formattedExpensesByCategory.sort((a, b) => b.total - a.total);

    const budgets = await Budget.findAll({
      where: {
        userId: req.user.userId,
        [Op.and]: [
          { startDate: { [Op.lte]: endDate } },
          {
            [Op.or]: [{ endDate: { [Op.gte]: startDate } }, { endDate: null as unknown as Date }],
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

    const budgetProgress = budgets.map((budget) => {
      let spent = 0;

      if (budget.categoryId) {
        spent = expensesByCategory[budget.categoryId.toString()] || 0;
      } else {
        spent = totalExpenses;
      }

      const percentage = (spent / Number(budget.amount)) * 100;
      let status = 'within_budget';

      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      return {
        budget,
        progress: {
          spent,
          budgetAmount: budget.amount,
          remainingAmount: Math.max(Number(budget.amount) - spent, 0),
          percentage,
          status,
        },
      };
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    res.status(200).json({
      status: 'success',
      data: {
        period: {
          year: yearNumber,
          month: monthNumber + 1,
          startDate,
          endDate,
        },
        summary: {
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate,
        },
        incomeByCategory: formattedIncomeByCategory,
        expensesByCategory: formattedExpensesByCategory,
        budgets: budgetProgress,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnualReport = async (
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

    const { year } = req.params;

    const yearNumber = parseInt(year);

    if (isNaN(yearNumber)) {
      const error = new Error('Invalid year') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const startDate = new Date(yearNumber, 0, 1);
    const endDate = new Date(yearNumber, 11, 31, 23, 59, 59, 999);

    const monthlyData = await Promise.all(
      Array.from({ length: 12 }, (_, index) => {
        const monthStartDate = new Date(yearNumber, index, 1);
        const monthEndDate = new Date(yearNumber, index + 1, 0, 23, 59, 59, 999);

        const incomePromise = Transaction.findAll({
          attributes: [[Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
          where: {
            userId: req.user?.userId,
            type: 'INCOME',
            date: {
              [Op.between]: [monthStartDate, monthEndDate],
            },
          },
          raw: true,
        });

        const expensePromise = Transaction.findAll({
          attributes: [[Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
          where: {
            userId: req.user?.userId,
            type: 'EXPENSE',
            date: {
              [Op.between]: [monthStartDate, monthEndDate],
            },
          },
          raw: true,
        });

        return Promise.all([incomePromise, expensePromise]).then(
          ([incomeResults, expenseResults]) => {
            const incomeResult = incomeResults[0] as any;
            const expenseResult = expenseResults[0] as any;

            const income = incomeResult && incomeResult.total ? parseFloat(incomeResult.total) : 0;
            const expenses =
              expenseResult && expenseResult.total ? parseFloat(expenseResult.total) : 0;

            return {
              month: index + 1,
              monthName: new Date(yearNumber, index, 1).toLocaleString('default', {
                month: 'long',
              }),
              income,
              expenses,
              netSavings: income - expenses,
              savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
            };
          },
        );
      }),
    );

    const incomeByCategoryPromise = Transaction.findAll({
      attributes: ['categoryId', [Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
      where: {
        userId: req.user.userId,
        type: 'INCOME',
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
      group: ['categoryId', 'Category.id', 'Category.name', 'Category.color', 'Category.icon'],
      order: [[Sequelize.fn('sum', Sequelize.col('amount')), 'DESC']],
    });

    const expensesByCategoryPromise = Transaction.findAll({
      attributes: ['categoryId', [Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
      where: {
        userId: req.user.userId,
        type: 'EXPENSE',
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
      group: ['categoryId', 'Category.id', 'Category.name', 'Category.color', 'Category.icon'],
      order: [[Sequelize.fn('sum', Sequelize.col('amount')), 'DESC']],
    });

    const [incomeByCategory, expensesByCategory] = await Promise.all([
      incomeByCategoryPromise,
      expensesByCategoryPromise,
    ]);

    const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
    const totalNetSavings = totalIncome - totalExpenses;
    const annualSavingsRate = totalIncome > 0 ? (totalNetSavings / totalIncome) * 100 : 0;

    const formattedIncomeByCategory = incomeByCategory.map((item) => {
      const total = parseFloat(item.get('total') as string);
      return {
        category: (item as any).Category,
        total,
        percentage: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
      };
    });

    const formattedExpensesByCategory = expensesByCategory.map((item) => {
      const total = parseFloat(item.get('total') as string);
      return {
        category: (item as any).Category,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        year: yearNumber,
        summary: {
          totalIncome,
          totalExpenses,
          totalNetSavings,
          annualSavingsRate,
        },
        monthlyData,
        incomeByCategory: formattedIncomeByCategory,
        expensesByCategory: formattedExpensesByCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendAnalysis = async (
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

    const { months = 6, categoryId } = req.query;

    const monthsNumber = parseInt(months as string);

    if (isNaN(monthsNumber) || monthsNumber < 1 || monthsNumber > 36) {
      const error = new Error('Invalid months parameter (must be between 1-36)') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNumber);

    const baseWhere: any = {
      userId: req.user.userId,
      date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (categoryId) {
      baseWhere.categoryId = categoryId;
    }

    const incomeByMonth = await Transaction.findAll({
      attributes: [
        [Sequelize.fn('date_trunc', 'month', Sequelize.col('date')), 'month'],
        [Sequelize.fn('sum', Sequelize.col('amount')), 'total'],
      ],
      where: {
        ...baseWhere,
        type: 'INCOME',
      },
      group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('date'))],
      order: [[Sequelize.fn('date_trunc', 'month', Sequelize.col('date')), 'ASC']],
      raw: true,
    });

    const expensesByMonth = await Transaction.findAll({
      attributes: [
        [Sequelize.fn('date_trunc', 'month', Sequelize.col('date')), 'month'],
        [Sequelize.fn('sum', Sequelize.col('amount')), 'total'],
      ],
      where: {
        ...baseWhere,
        type: 'EXPENSE',
      },
      group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('date'))],
      order: [[Sequelize.fn('date_trunc', 'month', Sequelize.col('date')), 'ASC']],
      raw: true,
    });

    const allMonths: Date[] = [];
    const tempDate = new Date(startDate);

    while (tempDate <= endDate) {
      const monthDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
      allMonths.push(monthDate);
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    const trendData = allMonths.map((month) => {
      const monthStr = month.toISOString();

      const income = incomeByMonth.find(
        (item: any) => new Date(item.month).toISOString() === monthStr,
      );

      const expense = expensesByMonth.find(
        (item: any) => new Date(item.month).toISOString() === monthStr,
      );

      const incomeAmount = income ? parseFloat((income as any).total) : 0;
      const expenseAmount = expense ? parseFloat((expense as any).total) : 0;

      return {
        month: month,
        year: month.getFullYear(),
        monthName: month.toLocaleString('default', { month: 'long' }),
        formattedMonth: formatDate(month, 'YYYY-MM'),
        income: incomeAmount,
        expenses: expenseAmount,
        netSavings: incomeAmount - expenseAmount,
        savingsRate: incomeAmount > 0 ? ((incomeAmount - expenseAmount) / incomeAmount) * 100 : 0,
      };
    });

    const calculateTrend = (data: number[]) => {
      if (data.length <= 1) return { trend: 'stable', percentage: 0 };

      const first = data[0];
      const last = data[data.length - 1];
      const average = data.reduce((sum, val) => sum + val, 0) / data.length;

      if (first === 0) return { trend: 'increasing', percentage: 100 };

      const percentage = ((last - first) / first) * 100;

      if (percentage > 5) return { trend: 'increasing', percentage };
      if (percentage < -5) return { trend: 'decreasing', percentage };
      return { trend: 'stable', percentage };
    };

    const incomeTrend = calculateTrend(trendData.map((item) => item.income));
    const expenseTrend = calculateTrend(trendData.map((item) => item.expenses));
    const savingsTrend = calculateTrend(trendData.map((item) => item.netSavings));

    res.status(200).json({
      status: 'success',
      data: {
        period: {
          months: monthsNumber,
          startDate,
          endDate,
        },
        monthly: trendData,
        trends: {
          income: incomeTrend,
          expenses: expenseTrend,
          savings: savingsTrend,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateMonthlySummaryReports = async (): Promise<void> => {
  try {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = prevMonth.getFullYear();
    const month = prevMonth.getMonth() + 1;
    const { User } = require('../models');
    const users = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName'],
      where: {
        isVerified: true,
      },
      include: [
        {
          model: require('../models').UserPreference,
          where: {
            notifications: true,
          },
          required: true,
        },
      ],
    });

    for (const user of users) {
      try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const transactions = await Transaction.findAll({
          where: {
            userId: user.id,
            date: {
              [Op.between]: [startDate, endDate],
            },
          },
          include: [
            {
              model: Category,
              attributes: ['id', 'name', 'type'],
            },
          ],
        });

        let totalIncome = 0;
        let totalExpenses = 0;
        const expensesByCategory: Record<string, number> = {};

        transactions.forEach((transaction) => {
          if (transaction.type === 'INCOME') {
            totalIncome += Number(transaction.amount);
          } else if (transaction.type === 'EXPENSE') {
            totalExpenses += Number(transaction.amount);
            const categoryName = (transaction as any).Category?.name || 'Uncategorized';
            expensesByCategory[categoryName] =
              (expensesByCategory[categoryName] || 0) + Number(transaction.amount);
          }
        });

        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        const topExpenses = Object.entries(expensesByCategory)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        const summaryData = {
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate,
          topExpenses,
          transactionCount: transactions.length,
        };

        await sendMonthlySummary(
          user.id,
          user.email,
          prevMonth.toLocaleString('default', { month: 'long' }),
          year.toString(),
          summaryData,
        );
      } catch (error) {
        console.error(`Error generating summary for user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error generating monthly summary reports:', error);
  }
};

function formatDate(date: Date, format: string): string {
  if (format === 'YYYY-MM') {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  } else if (format === 'YYYY-MM-DD') {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  } else if (format === 'YYYY') {
    return date.getFullYear().toString();
  } else if (format === 'YYYY-Q') {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${date.getFullYear()}-Q${quarter}`;
  }

  return date.toISOString();
}
