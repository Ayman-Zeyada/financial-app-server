import { ValidationSchema } from '../../middlewares/validation.middleware';

export const budgetValidation: Record<string, ValidationSchema> = {
  createBudget: {
    name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 100,
      message: 'Name must be 1-100 characters',
    },
    amount: {
      required: true,
      type: 'number',
      custom: (value: any) => value > 0,
      message: 'Amount must be a positive number',
    },
    period: {
      required: true,
      type: 'string',
      custom: (value: any) => ['daily', 'weekly', 'monthly', 'yearly'].includes(value),
      message: 'Period must be daily, weekly, monthly, or yearly',
    },
    startDate: {
      required: true,
      type: 'string',
      custom: (value: any) => !isNaN(new Date(value).getTime()),
      message: 'Start date must be a valid date',
    },
    endDate: {
      type: 'string',
      custom: (value: any) => {
        if (!value) return true;
        const endDate = new Date(value);
        if (isNaN(endDate.getTime())) return false;
        return true;
      },
      message: 'End date must be a valid date',
    },
    categoryId: {
      type: 'number',
      custom: (value: any) => !value || value > 0,
      message: 'Invalid category ID',
    },
  },
  updateBudget: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      message: 'Name must be 1-100 characters',
    },
    amount: {
      type: 'number',
      custom: (value: any) => value > 0,
      message: 'Amount must be a positive number',
    },
    period: {
      type: 'string',
      custom: (value: any) => ['daily', 'weekly', 'monthly', 'yearly'].includes(value),
      message: 'Period must be daily, weekly, monthly, or yearly',
    },
    startDate: {
      type: 'string',
      custom: (value: any) => !value || !isNaN(new Date(value).getTime()),
      message: 'Start date must be a valid date',
    },
    endDate: {
      type: 'string',
      custom: (value: any) => {
        if (!value) return true;
        const endDate = new Date(value);
        if (isNaN(endDate.getTime())) return false;
        return true;
      },
      message: 'End date must be a valid date',
    },
    categoryId: {
      type: 'number',
      custom: (value: any) => value === null || value > 0,
      message: 'Invalid category ID',
    },
  },
};
