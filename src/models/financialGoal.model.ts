import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface FinancialGoalAttributes {
  id: number;
  userId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  description?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FinancialGoalCreationAttributes
  extends Optional<FinancialGoalAttributes, 'id' | 'currentAmount'> {}

class FinancialGoal
  extends Model<FinancialGoalAttributes, FinancialGoalCreationAttributes>
  implements FinancialGoalAttributes
{
  public id!: number;
  public userId!: number;
  public name!: string;
  public targetAmount!: number;
  public currentAmount!: number;
  public targetDate!: Date;
  public description?: string;
  public category?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FinancialGoal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    targetAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01,
      },
    },
    currentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    targetDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: 'financial_goals',
    sequelize,
  },
);

export default FinancialGoal;
