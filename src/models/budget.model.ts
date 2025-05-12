import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface BudgetAttributes {
  id: number;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  userId: number;
  categoryId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BudgetCreationAttributes extends Optional<BudgetAttributes, 'id'> {}

class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
  public id!: number;
  public name!: string;
  public amount!: number;
  public period!: 'daily' | 'weekly' | 'monthly' | 'yearly';
  public startDate!: Date;
  public endDate?: Date;
  public userId!: number;
  public categoryId?: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Budget.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01,
      },
    },
    period: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'budgets',
    sequelize,
  },
);

export default Budget;
