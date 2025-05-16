import { ValidationSchema } from '../../middlewares/validation.middleware';

export const transactionValidation: Record<string, ValidationSchema> = {
  createTransaction: {
    amount: {
      required: true,
      type: 'number',
      custom: (value: any) => value > 0,
      message: 'Amount must be a positive number',
    },
    description: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 200,
      message: 'Description must be 1-200 characters',
    },
    date: {
      type: 'string',
      custom: (value: any) => !value || !isNaN(new Date(value).getTime()),
      message: 'Invalid date format',
    },
    type: {
      required: true,
      type: 'string',
      custom: (value: any) => ['INCOME', 'EXPENSE', 'TRANSFER'].includes(value),
      message: 'Type must be INCOME, EXPENSE, or TRANSFER',
    },
    categoryId: {
      required: true,
      type: 'number',
      custom: (value: any) => value > 0,
      message: 'Invalid category ID',
    },
    recurring: {
      type: 'boolean',
      message: 'Recurring must be a boolean',
    },
    recurringInterval: {
      type: 'string',
      custom: (value: any) => {
        if (!value) return true;
        return ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].includes(value);
      },
      message: 'Recurring interval must be daily, weekly, biweekly, monthly, quarterly, or yearly',
    },
  },
  updateTransaction: {
    amount: {
      type: 'number',
      custom: (value: any) => value > 0,
      message: 'Amount must be a positive number',
    },
    description: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      message: 'Description must be 1-200 characters',
    },
    date: {
      type: 'string',
      custom: (value: any) => !value || !isNaN(new Date(value).getTime()),
      message: 'Invalid date format',
    },
    type: {
      type: 'string',
      custom: (value: any) => ['INCOME', 'EXPENSE', 'TRANSFER'].includes(value),
      message: 'Type must be INCOME, EXPENSE, or TRANSFER',
    },
    categoryId: {
      type: 'number',
      custom: (value: any) => value > 0,
      message: 'Invalid category ID',
    },
    recurring: {
      type: 'boolean',
      message: 'Recurring must be a boolean',
    },
    recurringInterval: {
      type: 'string',
      custom: (value: any) => {
        if (!value) return true;
        return ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].includes(value);
      },
      message: 'Recurring interval must be daily, weekly, biweekly, monthly, quarterly, or yearly',
    },
  },
  bulkCreateTransactions: {
    transactions: {
      required: true,
      type: 'array',
      custom: (value: any) => Array.isArray(value) && value.length > 0,
      message: 'Transactions must be a non-empty array',
    },
  },
};
