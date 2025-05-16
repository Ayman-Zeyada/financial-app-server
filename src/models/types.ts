import { Transaction as SequelizeTransaction } from 'sequelize';
import { CategoryAttributes } from './category.model';
import { TransactionAttributes } from './transaction.model';

export interface TransactionWithCategory extends TransactionAttributes {
  Category?: CategoryAttributes;
}

export interface AggregationResult {
  [key: string]: any;
  get(key: string): any;
}

export interface TotalAggregationResult {
  total: string;
  [key: string]: any;
}

export interface DateAggregationResult {
  date?: Date;
  month?: Date;
  total: string;
  [key: string]: any;
}

export const withTransaction = async <T>(
  callback: (transaction: SequelizeTransaction) => Promise<T>,
): Promise<T> => {
  const sequelize = (await import('./index')).sequelize;
  const transaction = await sequelize.transaction();

  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
