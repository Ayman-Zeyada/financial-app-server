import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Financial App API',
    version: '1.0.0',
    description:
      'A comprehensive financial management API with features for transactions, budgets, goals, and reporting',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === 'production'
          ? 'https://my-financial-app-production-url.com/api' // should be replaced with real production URL
          : `http://localhost:${process.env.PORT || 4000}/api`,
      description:
        process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'john_doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          isVerified: { type: 'boolean', example: true },
          avatarUrl: {
            type: 'string',
            nullable: true,
            example: '/uploads/avatars/user-1-123456789.jpg',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Groceries' },
          description: { type: 'string', example: 'Food and household items' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'EXPENSE' },
          color: { type: 'string', pattern: '^#[0-9A-F]{6}$', example: '#FF5733' },
          icon: { type: 'string', example: 'shopping-cart' },
          userId: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          amount: { type: 'number', format: 'decimal', example: 25.5 },
          description: { type: 'string', example: 'Weekly grocery shopping' },
          date: { type: 'string', format: 'date-time' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE', 'TRANSFER'], example: 'EXPENSE' },
          recurring: { type: 'boolean', example: false },
          recurringInterval: {
            type: 'string',
            enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
            nullable: true,
            example: null,
          },
          userId: { type: 'integer', example: 1 },
          categoryId: { type: 'integer', example: 1 },
          Category: { $ref: '#/components/schemas/Category' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Budget: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Monthly Food Budget' },
          amount: { type: 'number', format: 'decimal', example: 500.0 },
          period: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly', 'yearly'],
            example: 'monthly',
          },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          userId: { type: 'integer', example: 1 },
          categoryId: { type: 'integer', nullable: true, example: 1 },
          Category: { $ref: '#/components/schemas/Category' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      FinancialGoal: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Emergency Fund' },
          targetAmount: { type: 'number', format: 'decimal', example: 10000.0 },
          currentAmount: { type: 'number', format: 'decimal', example: 2500.0 },
          targetDate: { type: 'string', format: 'date-time' },
          description: { type: 'string', example: 'Save for emergency expenses' },
          category: { type: 'string', example: 'Savings' },
          notificationSent: { type: 'boolean', example: false },
          userId: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserPreference: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          currency: { type: 'string', example: 'USD' },
          theme: { type: 'string', example: 'light' },
          language: { type: 'string', example: 'en' },
          notifications: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Webhook: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          url: { type: 'string', format: 'uri', example: 'https://example.com/webhook' },
          description: { type: 'string', example: 'Transaction notifications' },
          events: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'transaction.created',
                'transaction.updated',
                'transaction.deleted',
                'budget.alert',
                'goal.achieved',
                '*',
              ],
            },
            example: ['transaction.created', 'budget.alert'],
          },
          isActive: { type: 'boolean', example: true },
          lastTriggeredAt: { type: 'string', format: 'date-time', nullable: true },
          failCount: { type: 'integer', example: 0 },
          userId: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'An error occurred' },
          statusCode: { type: 'integer', example: 400 },
          stack: { type: 'string', description: 'Only available in development' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'object',
            additionalProperties: { type: 'string' },
            example: { name: 'Name is required', email: 'Invalid email format' },
          },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          pagination: {
            type: 'object',
            properties: {
              totalItems: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 10 },
              currentPage: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              hasNextPage: { type: 'boolean', example: true },
              hasPrevPage: { type: 'boolean', example: false },
            },
          },
          data: { type: 'array', items: { type: 'object' } },
        },
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      },
      StartDateParam: {
        name: 'startDate',
        in: 'query',
        description: 'Start date for filtering (ISO 8601 format)',
        required: false,
        schema: { type: 'string', format: 'date' },
      },
      EndDateParam: {
        name: 'endDate',
        in: 'query',
        description: 'End date for filtering (ISO 8601 format)',
        required: false,
        schema: { type: 'string', format: 'date' },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              status: 'error',
              message: 'Not authenticated',
              statusCode: 401,
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Access forbidden',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              status: 'error',
              message: 'Account not verified',
              statusCode: 403,
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              status: 'error',
              message: 'Resource not found',
              statusCode: 404,
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ValidationError' },
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              status: 'error',
              message: 'Internal server error',
              statusCode: 500,
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Users', description: 'User profile and preferences management' },
    { name: 'Categories', description: 'Transaction categories management' },
    { name: 'Transactions', description: 'Financial transactions management' },
    { name: 'Budgets', description: 'Budget planning and tracking' },
    { name: 'Financial Goals', description: 'Financial goals and savings tracking' },
    { name: 'Reports', description: 'Financial reports and analytics' },
    { name: 'Data Processing', description: 'Import/export functionality' },
    { name: 'Webhooks', description: 'Webhook management and notifications' },
    { name: 'Health', description: 'API health and status endpoints' },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/models/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
