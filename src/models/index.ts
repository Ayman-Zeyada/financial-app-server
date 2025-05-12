import { sequelize } from '../config/database';
import User from './user.model';
import Category from './category.model';
import Transaction from './transaction.model';
import Budget from './budget.model';

// Define associations
User.hasMany(Category, {
  sourceKey: 'id',
  foreignKey: 'userId',
  as: 'categories',
});

User.hasMany(Transaction, {
  sourceKey: 'id',
  foreignKey: 'userId',
  as: 'transactions',
});

User.hasMany(Budget, {
  sourceKey: 'id',
  foreignKey: 'userId',
  as: 'budgets',
});

Category.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Category.hasMany(Transaction, {
  sourceKey: 'id',
  foreignKey: 'categoryId',
  as: 'transactions',
});

Category.hasMany(Budget, {
  sourceKey: 'id',
  foreignKey: 'categoryId',
  as: 'budgets',
});

Transaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Transaction.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

Budget.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Budget.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

export { sequelize, User, Category, Transaction, Budget };
