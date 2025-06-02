# Financial App API Documentation

A comprehensive financial management API built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Ayman-Zeyada/financial-app-server.git
cd financial-app-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration

# Run database migrations
npm run db:create
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

## 📚 API Documentation

### Interactive Documentation
When running in development mode, you can access the interactive Swagger UI documentation at:
- **Swagger UI**: http://localhost:4000/api-docs
- **OpenAPI JSON**: http://localhost:4000/api-docs.json

### Authentication
Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

To get a token:
1. Register a new user via `POST /api/auth/register`
2. Verify your email via `GET /api/auth/verify-email/{token}` (check server logs for the verification link)
3. Login via `POST /api/auth/login` to receive access and refresh tokens

## 🔗 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/verify-email/{token}` - Verify email address
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password/{token}` - Reset password
- `GET /api/auth/me` - Get current user info

### Users & Preferences
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/profile` - Delete user account
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/avatar` - Get avatar URL
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update user preferences

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/{id}` - Get category by ID
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
- `POST /api/categories/bulk` - Bulk create categories
- `GET /api/categories/{id}/transactions` - Get category transactions

### Transactions
- `GET /api/transactions` - List transactions (with pagination and filtering)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/{id}` - Get transaction by ID
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction
- `POST /api/transactions/bulk` - Bulk create transactions
- `GET /api/transactions/recurring` - Get recurring transactions

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/{id}` - Get budget by ID
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget
- `GET /api/budgets/{id}/progress` - Get budget progress
- `GET /api/budgets/progress` - Get all budgets progress

### Financial Goals
- `GET /api/goals` - List financial goals
- `POST /api/goals` - Create financial goal
- `GET /api/goals/{id}` - Get goal by ID
- `PUT /api/goals/{id}` - Update goal
- `DELETE /api/goals/{id}` - Delete goal
- `PATCH /api/goals/{id}/progress` - Update goal progress

### Reports & Analytics
- `GET /api/reports/income-vs-expenses` - Income vs expenses report
- `GET /api/reports/expenses-by-category` - Expenses by category
- `GET /api/reports/monthly/{year}/{month}` - Monthly cash flow
- `GET /api/reports/annual/{year}` - Annual report
- `GET /api/reports/trends` - Trend analysis

### Data Import/Export
- `POST /api/data/import/transactions` - Import transactions from CSV/JSON
- `POST /api/data/import/categories` - Import categories from CSV/JSON
- `POST /api/data/import/budgets` - Import budgets from CSV/JSON
- `POST /api/data/import/goals` - Import financial goals from CSV/JSON
- `GET /api/data/export/transactions` - Export transactions to CSV
- `GET /api/data/export/categories` - Export categories to CSV
- `GET /api/data/export/budgets` - Export budgets to CSV
- `GET /api/data/export/goals` - Export financial goals to CSV
- `POST /api/data/validate` - Validate import file

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks/{id}` - Get webhook by ID
- `PUT /api/webhooks/{id}` - Update webhook
- `DELETE /api/webhooks/{id}` - Delete webhook
- `POST /api/webhooks/{id}/regenerate-secret` - Regenerate webhook secret
- `POST /api/webhooks/{id}/test` - Test webhook

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check with database status

## 📊 Database Schema

### Core Tables
- **users** - User accounts and authentication
- **user_preferences** - User settings and preferences
- **categories** - Transaction categories (income/expense)
- **transactions** - Financial transactions
- **budgets** - Budget planning and limits
- **financial_goals** - Savings goals and targets
- **webhooks** - Webhook configurations for notifications

### Key Relationships
- Users have many Categories, Transactions, Budgets, Goals, and Webhooks
- Transactions belong to Categories and Users
- Budgets can be linked to specific Categories
- All entities include created/updated timestamps

## 🔧 Request/Response Format

### Standard Response Format
```json
{
  "status": "success|error",
  "message": "Descriptive message",
  "data": { /* Response data */ }
}
```

### Paginated Response Format
```json
{
  "status": "success",
  "pagination": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": [ /* Array of items */ ]
}
```

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400,
  "errors": { /* Validation errors if applicable */ }
}
```

## 🔍 Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Filtering (where applicable)
- `startDate` - Filter by start date (ISO 8601 format)
- `endDate` - Filter by end date (ISO 8601 format)
- `type` - Filter by type (INCOME, EXPENSE, TRANSFER)
- `categoryId` - Filter by category ID
- `recurring` - Filter recurring transactions (true/false)

### Sorting
- `sortBy` - Field to sort by (default: varies by endpoint)
- `sortOrder` - Sort direction (ASC/DESC, default: DESC)

## 🚨 Error Codes

- **400** - Bad Request (validation errors)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (duplicate resource)
- **429** - Too Many Requests (rate limiting)
- **500** - Internal Server Error

## 🔐 Security Features

- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt
- Email verification for new accounts
- Password reset functionality
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration for cross-origin requests

## 🎯 Rate Limiting

- Default: 100 requests per 15-minute window per IP/user
- Authenticated users are tracked by user ID
- Anonymous users are tracked by IP address
- Rate limit headers included in responses

## 📤 File Upload/Download

### Supported Formats
- **Import**: CSV, JSON
- **Export**: CSV
- **Avatars**: JPG, JPEG, PNG, GIF (max 5MB)

### File Size Limits
- Import files: 10MB
- Avatar uploads: 5MB

## 🔗 WebSocket Events (Real-time Updates)

Connect to the Socket.IO endpoint with JWT authentication:
- `transaction:created` - New transaction added
- `transaction:updated` - Transaction modified
- `transaction:deleted` - Transaction removed
- `budget:alert` - Budget limit exceeded
- `goal:achieved` - Financial goal reached
- `notification` - General notifications

## 🧪 Testing the API

### Using the Swagger UI
1. Start the development server
2. Navigate to http://localhost:4000/api-docs
3. Click "Authorize" and enter your JWT token
4. Try out the endpoints directly in the browser

### Using curl
```bash
# Register a new user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## 📋 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=financial_app
DB_PASSWORD=your_password
DB_NAME=financial_app_dev

# JWT Configurations
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=86400          # 1 day in seconds
JWT_REFRESH_EXPIRES_IN=604800 # 7 days in seconds
```

---

*This API is designed to be RESTful and follows standard HTTP conventions. All dates should be in ISO 8601 format, and all monetary amounts are stored as decimal values.*