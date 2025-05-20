import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum WebhookEvent {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_UPDATED = 'transaction.updated',
  TRANSACTION_DELETED = 'transaction.deleted',
  BUDGET_ALERT = 'budget.alert',
  GOAL_ACHIEVED = 'goal.achieved',
  ALL = '*',
}

export interface WebhookAttributes {
  id: number;
  userId: number;
  url: string;
  secret: string;
  description?: string;
  events: WebhookEvent[];
  isActive: boolean;
  lastTriggeredAt?: Date;
  failCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WebhookCreationAttributes
  extends Optional<WebhookAttributes, 'id' | 'failCount'> {}

class Webhook
  extends Model<WebhookAttributes, WebhookCreationAttributes>
  implements WebhookAttributes
{
  public id!: number;
  public userId!: number;
  public url!: string;
  public secret!: string;
  public description?: string;
  public events!: WebhookEvent[];
  public isActive!: boolean;
  public lastTriggeredAt?: Date;
  public failCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Webhook.init(
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
    url: {
      type: DataTypes.STRING(512),
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    secret: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    events: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastTriggeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'webhooks',
    sequelize,
  },
);

export default Webhook;
