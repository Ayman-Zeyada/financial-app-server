import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error-handler.middleware';

export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    message?: string;
  };
}

export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: { [key: string]: string } = {};

    for (const field in schema) {
      const rules = schema[field];
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = rules.message || `${field} is required`;
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (rules.type) {
        const valueType = typeof value;
        if (
          (rules.type === 'string' && valueType !== 'string') ||
          (rules.type === 'number' && valueType !== 'number') ||
          (rules.type === 'boolean' && valueType !== 'boolean') ||
          (rules.type === 'object' && valueType !== 'object') ||
          (rules.type === 'array' && !Array.isArray(value))
        ) {
          errors[field] = rules.message || `${field} must be a ${rules.type}`;
          continue;
        }
      }

      if (
        rules.minLength !== undefined &&
        typeof value === 'string' &&
        value.length < rules.minLength
      ) {
        errors[field] = rules.message || `${field} must be at least ${rules.minLength} characters`;
        continue;
      }

      if (
        rules.maxLength !== undefined &&
        typeof value === 'string' &&
        value.length > rules.maxLength
      ) {
        errors[field] = rules.message || `${field} must be at most ${rules.maxLength} characters`;
        continue;
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors[field] = rules.message || `${field} is invalid`;
        continue;
      }

      if (rules.custom && !rules.custom(value)) {
        errors[field] = rules.message || `${field} is invalid`;
        continue;
      }
    }

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed') as ApiError;
      error.statusCode = 400;
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
};

export const authValidation = {
  register: {
    username: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/,
      message:
        'Username must be 3-50 characters and can only contain letters, numbers, and underscores',
    },
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please provide a valid email address',
    },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      message: 'Password must be at least 8 characters',
    },
    firstName: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'First name is required',
    },
    lastName: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'Last name is required',
    },
  },
  login: {
    username: {
      required: true,
      type: 'string',
      message: 'Username or email is required',
    },
    password: {
      required: true,
      type: 'string',
      message: 'Password is required',
    },
  },
  requestPasswordReset: {
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please provide a valid email address',
    },
  },
  resetPassword: {
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      message: 'Password must be at least 8 characters',
    },
  },
};

export const userValidation = {
  updateProfile: {
    firstName: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'First name must be 1-50 characters',
    },
    lastName: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'Last name must be 1-50 characters',
    },
    email: {
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please provide a valid email address',
    },
  },
  updatePreferences: {
    currency: {
      type: 'string',
      minLength: 3,
      maxLength: 3,
      message: 'Currency code must be 3 characters (e.g., USD)',
    },
    theme: {
      type: 'string',
      minLength: 1,
      maxLength: 10,
      message: 'Theme must be 1-10 characters',
    },
    language: {
      type: 'string',
      minLength: 2,
      maxLength: 5,
      message: 'Language code must be 2-5 characters (e.g., en, en-US)',
    },
    notifications: {
      type: 'boolean',
      message: 'Notifications must be a boolean',
    },
  },
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
      custom: (value: any) => new Date(value) > new Date(),
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
      custom: (value: any) => new Date(value) > new Date(),
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
};
