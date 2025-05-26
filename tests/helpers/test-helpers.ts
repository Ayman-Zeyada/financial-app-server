import { User, Category, Transaction, Budget, FinancialGoal } from '../../src/models';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../../src/utils/token.utils';
import { CategoryType } from '../../src/models/category.model';
import { TransactionType } from '../../src/models/transaction.model';

export const createTestUser = async (overrides: Partial<any> = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    firstName: 'Test',
    lastName: 'User',
    isVerified: true,
    ...overrides,
  };

  return await User.create(defaultUser);
};

export const createTestCategory = async (userId: number, overrides: Partial<any> = {}) => {
  const defaultCategory = {
    name: 'Test Category',
    description: 'Test category description',
    type: CategoryType.EXPENSE,
    color: '#FF0000',
    icon: 'test-icon',
    userId,
    ...overrides,
  };

  return await Category.create(defaultCategory);
};

export const createTestTransaction = async (
  userId: number,
  categoryId: number,
  overrides: Partial<any> = {},
) => {
  const defaultTransaction = {
    amount: 100.0,
    description: 'Test transaction',
    date: new Date(),
    type: TransactionType.EXPENSE,
    recurring: false,
    userId,
    categoryId,
    ...overrides,
  };

  return await Transaction.create(defaultTransaction);
};

export const createTestBudget = async (
  userId: number,
  categoryId?: number,
  overrides: Partial<any> = {},
) => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const defaultBudget = {
    name: 'Test Budget',
    amount: 1000.0,
    period: 'monthly' as const,
    startDate: now,
    endDate: endOfMonth,
    userId,
    categoryId: categoryId || undefined,
    ...overrides,
  };

  return await Budget.create(defaultBudget);
};

export const createTestFinancialGoal = async (userId: number, overrides: Partial<any> = {}) => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const defaultGoal = {
    name: 'Test Goal',
    targetAmount: 10000.0,
    currentAmount: 2000.0,
    targetDate: futureDate,
    description: 'Test financial goal',
    category: 'Savings',
    userId,
    ...overrides,
  };

  return await FinancialGoal.create(defaultGoal);
};

export const createAuthenticatedUser = async (overrides: Partial<any> = {}) => {
  const user = await createTestUser(overrides);
  const accessToken = generateAccessToken({
    id: user.id,
    username: user.username,
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    isVerified: user.isVerified,
  });

  return {
    user,
    accessToken,
    authHeader: `Bearer ${accessToken}`,
  };
};

export const cleanupDatabase = async () => {
  await Transaction.destroy({ where: {} });
  await Budget.destroy({ where: {} });
  await FinancialGoal.destroy({ where: {} });
  await Category.destroy({ where: {} });
  await User.destroy({ where: {} });
};

export const expectValidationError = (response: any, field?: string) => {
  expect(response.body).toHaveProperty('status', 'error');
  expect(response.body).toHaveProperty('message', 'Validation failed');
  expect(response.body).toHaveProperty('errors');

  if (field) {
    expect(response.body.errors).toHaveProperty(field);
  }
};

export const expectAuthError = (response: any) => {
  expect(response.body).toHaveProperty('status', 'error');
  expect(response.body.message).toMatch(/not authenticated|invalid.*token|unauthorized/i);
};

export const expectNotFoundError = (response: any, resource?: string) => {
  expect(response.body).toHaveProperty('status', 'error');
  if (resource) {
    expect(response.body.message).toContain(resource);
    expect(response.body.message).toContain('not found');
  }
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const generateUserData = (overrides: Partial<any> = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  ...overrides,
});

export const generateCategoryData = (overrides: Partial<any> = {}) => ({
  name: 'Test Category',
  description: 'Test category description',
  type: CategoryType.EXPENSE,
  color: '#FF0000',
  icon: 'test-icon',
  ...overrides,
});

export const generateTransactionData = (categoryId: number, overrides: Partial<any> = {}) => ({
  amount: 100.0,
  description: 'Test transaction',
  date: new Date().toISOString(),
  type: TransactionType.EXPENSE,
  categoryId,
  recurring: false,
  ...overrides,
});

export const generateBudgetData = (overrides: Partial<any> = {}) => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    name: 'Test Budget',
    amount: 1000.0,
    period: 'monthly',
    startDate: now.toISOString(),
    endDate: endOfMonth.toISOString(),
    ...overrides,
  };
};

export const generateFinancialGoalData = (overrides: Partial<any> = {}) => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  return {
    name: 'Test Goal',
    targetAmount: 10000.0,
    currentAmount: 2000.0,
    targetDate: futureDate.toISOString(),
    description: 'Test financial goal',
    category: 'Savings',
    ...overrides,
  };
};

export const validateUserObject = (user: any) => {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('username');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('firstName');
  expect(user).toHaveProperty('lastName');
  expect(user).toHaveProperty('isVerified');
  expect(user).not.toHaveProperty('password');
  expect(user).not.toHaveProperty('resetPasswordToken');
  expect(user).not.toHaveProperty('verificationToken');
};

export const validateTransactionObject = (transaction: any) => {
  expect(transaction).toHaveProperty('id');
  expect(transaction).toHaveProperty('amount');
  expect(transaction).toHaveProperty('description');
  expect(transaction).toHaveProperty('date');
  expect(transaction).toHaveProperty('type');
  expect(transaction).toHaveProperty('categoryId');
  expect(transaction).toHaveProperty('userId');
};

export const validateCategoryObject = (category: any) => {
  expect(category).toHaveProperty('id');
  expect(category).toHaveProperty('name');
  expect(category).toHaveProperty('type');
  expect(category).toHaveProperty('color');
  expect(category).toHaveProperty('userId');
};

export const validateBudgetObject = (budget: any) => {
  expect(budget).toHaveProperty('id');
  expect(budget).toHaveProperty('name');
  expect(budget).toHaveProperty('amount');
  expect(budget).toHaveProperty('period');
  expect(budget).toHaveProperty('startDate');
  expect(budget).toHaveProperty('userId');
};

export const validateFinancialGoalObject = (goal: any) => {
  expect(goal).toHaveProperty('id');
  expect(goal).toHaveProperty('name');
  expect(goal).toHaveProperty('targetAmount');
  expect(goal).toHaveProperty('currentAmount');
  expect(goal).toHaveProperty('targetDate');
  expect(goal).toHaveProperty('userId');
};
