import { ValidationSchema } from '../../middlewares/validation.middleware';

export const categoryValidation: Record<string, ValidationSchema> = {
  createCategory: {
    name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'Name must be 1-50 characters',
    },
    description: {
      type: 'string',
      maxLength: 200,
      message: 'Description must be at most 200 characters',
    },
    type: {
      required: true,
      type: 'string',
      custom: (value: any) => ['INCOME', 'EXPENSE'].includes(value),
      message: 'Type must be INCOME or EXPENSE',
    },
    color: {
      type: 'string',
      pattern: /^#[0-9A-F]{6}$/i,
      message: 'Color must be a valid hex color code (e.g., #RRGGBB)',
    },
    icon: {
      type: 'string',
      maxLength: 50,
      message: 'Icon must be at most 50 characters',
    },
  },
  updateCategory: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'Name must be 1-50 characters',
    },
    description: {
      type: 'string',
      maxLength: 200,
      message: 'Description must be at most 200 characters',
    },
    type: {
      type: 'string',
      custom: (value: any) => ['INCOME', 'EXPENSE'].includes(value),
      message: 'Type must be INCOME or EXPENSE',
    },
    color: {
      type: 'string',
      pattern: /^#[0-9A-F]{6}$/i,
      message: 'Color must be a valid hex color code (e.g., #RRGGBB)',
    },
    icon: {
      type: 'string',
      maxLength: 50,
      message: 'Icon must be at most 50 characters',
    },
  },
  bulkCreateCategories: {
    categories: {
      required: true,
      type: 'array',
      custom: (value: any) => Array.isArray(value) && value.length > 0,
      message: 'Categories must be a non-empty array',
    },
  },
};
