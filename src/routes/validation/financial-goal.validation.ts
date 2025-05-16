import { ValidationSchema } from '../../middlewares/validation.middleware';

export const financialGoalValidation: Record<string, ValidationSchema> = {
  createFinancialGoal: {
    name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 100,
      message: 'Goal name must be 1-100 characters',
    },
    targetAmount: {
      required: true,
      type: 'number',
      custom: (value: any) => value > 0,
      message: 'Target amount must be a positive number',
    },
    currentAmount: {
      type: 'number',
      custom: (value: any) => value >= 0,
      message: 'Current amount must be a non-negative number',
    },
    targetDate: {
      required: true,
      type: 'string',
      custom: (value: any) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date > new Date();
      },
      message: 'Target date must be in the future',
    },
    description: {
      type: 'string',
      maxLength: 200,
      message: 'Description must be at most 200 characters',
    },
    category: {
      type: 'string',
      maxLength: 50,
      message: 'Category must be at most 50 characters',
    },
  },
  updateFinancialGoal: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      message: 'Goal name must be 1-100 characters',
    },
    targetAmount: {
      type: 'number',
      custom: (value: any) => value > 0,
      message: 'Target amount must be a positive number',
    },
    currentAmount: {
      type: 'number',
      custom: (value: any) => value >= 0,
      message: 'Current amount must be a non-negative number',
    },
    targetDate: {
      type: 'string',
      custom: (value: any) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date > new Date();
      },
      message: 'Target date must be in the future',
    },
    description: {
      type: 'string',
      maxLength: 200,
      message: 'Description must be at most 200 characters',
    },
    category: {
      type: 'string',
      maxLength: 50,
      message: 'Category must be at most 50 characters',
    },
  },
  updateGoalProgress: {
    amount: {
      required: true,
      type: 'number',
      custom: (value: any) => value !== 0,
      message: 'Amount must be a non-zero number',
    },
  },
};
