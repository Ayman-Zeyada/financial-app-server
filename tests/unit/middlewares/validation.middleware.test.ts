import { Request, Response, NextFunction } from 'express';
import { validateBody, ValidationSchema } from '../../../src/middlewares/validation.middleware';

interface MockRequest extends Partial<Request> {
  body: any;
}

interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
}

describe('Validation Middleware', () => {
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    const testSchema: ValidationSchema = {
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
      },
      email: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please provide a valid email address',
      },
      age: {
        type: 'number',
        custom: (value: any) => value >= 18,
      },
      isActive: {
        type: 'boolean',
        message: 'isActive must be a boolean',
      },
    };

    it('should pass validation with valid data', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        isActive: true,
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should fail validation for missing required fields', () => {
      mockRequest.body = {
        age: 25,
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation failed',
        errors: {
          name: 'name is required',
          email: 'Please provide a valid email address',
        },
      });
    });

    it('should fail validation for invalid types', () => {
      mockRequest.body = {
        name: 123,
        email: 'john@example.com',
        age: '25',
        isActive: 'yes',
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation failed',
        errors: {
          name: 'name must be a string',
          age: 'age must be a number',
          isActive: 'isActive must be a boolean',
        },
      });
    });

    it('should fail validation for string length constraints', () => {
      mockRequest.body = {
        name: 'J',
        email: 'john@example.com',
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation failed',
        errors: {
          name: 'name must be at least 2 characters',
        },
      });
    });

    it('should fail validation for pattern mismatch', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'invalid-email',
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation failed',
        errors: {
          email: 'Please provide a valid email address',
        },
      });
    });

    it('should fail validation for custom validation rules', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 16,
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation failed',
        errors: {
          age: 'age is invalid',
        },
      });
    });

    it('should allow optional fields to be undefined', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('auth validation schemas', () => {
    const registerSchema: ValidationSchema = {
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
    };

    it('should validate user registration data', () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const middleware = validateBody(registerSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid username format', () => {
      mockRequest.body = {
        username: 'te',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const middleware = validateBody(registerSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject short password', () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
      };

      const middleware = validateBody(registerSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('financial goal validation', () => {
    const goalSchema: ValidationSchema = {
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
    };

    it('should validate financial goal creation data', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockRequest.body = {
        name: 'Save for vacation',
        targetAmount: 5000,
        currentAmount: 1000,
        targetDate: futureDate.toISOString(),
      };

      const middleware = validateBody(goalSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject negative target amount', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockRequest.body = {
        name: 'Save for vacation',
        targetAmount: -1000,
        targetDate: futureDate.toISOString(),
      };

      const middleware = validateBody(goalSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject past target date', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      mockRequest.body = {
        name: 'Save for vacation',
        targetAmount: 5000,
        targetDate: pastDate.toISOString(),
      };

      const middleware = validateBody(goalSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
