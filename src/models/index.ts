import User from './user.model';
import Category from './category.model';
import Transaction from './transaction.model';
import Budget from './budget.model';
import UserPreference from './userPreference.model';
import FinancialGoal from './financialGoal.model';
import { sequelize } from '../config/database';

User.hasMany(Category, { foreignKey: 'userId' });
Category.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId' });
Budget.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Transaction, { foreignKey: 'categoryId' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(Budget, { foreignKey: 'categoryId' });
Budget.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasOne(UserPreference, { foreignKey: 'userId' });
UserPreference.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(FinancialGoal, { foreignKey: 'userId' });
FinancialGoal.belongsTo(User, { foreignKey: 'userId' });

export { sequelize, User, Category, Transaction, Budget, UserPreference, FinancialGoal };
