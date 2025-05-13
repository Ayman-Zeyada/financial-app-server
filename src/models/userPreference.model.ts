import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserPreferenceAttributes {
  id: number;
  userId: number;
  currency: string;
  theme: string;
  language: string;
  notifications: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPreferenceCreationAttributes
  extends Optional<UserPreferenceAttributes, 'id'> {}

class UserPreference
  extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes>
  implements UserPreferenceAttributes
{
  public id!: number;
  public userId!: number;
  public currency!: string;
  public theme!: string;
  public language!: string;
  public notifications!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserPreference.init(
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
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    theme: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'light',
    },
    language: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'en',
    },
    notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'user_preferences',
    sequelize,
  },
);

export default UserPreference;
