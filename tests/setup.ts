import { sequelize } from '../src/config/database';

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Test database connection established successfully.');

    try {
      await sequelize.sync({ force: true, logging: false });
      console.log('Test database synchronized.');
    } catch (syncError: any) {
      if (
        syncError.name === 'SequelizeUniqueConstraintError' &&
        syncError.message?.includes('_seq')
      ) {
        console.log('Database sequences already exist, ensuring tables...');
        await sequelize.sync({ alter: true, logging: false });
        console.log('Test database synchronized.');
      } else {
        throw syncError;
      }
    }
  } catch (error) {
    console.error('Unable to connect to the test database:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    console.log('Test database connection closed.');
  } catch (error) {
    console.error('Error closing test database connection:', error);
  }
});

afterEach(async () => {
  try {
    const tablesToClear = [
      'transactions',
      'budgets',
      'financial_goals',
      'user_preferences',
      'webhooks',
      'categories',
      'users',
    ];

    for (const table of tablesToClear) {
      try {
        await sequelize.query(`DELETE FROM "${table}";`);
        await sequelize.query(`ALTER SEQUENCE IF EXISTS "${table}_id_seq" RESTART WITH 1;`);
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          console.warn(`Warning: Could not clear table "${table}":`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn('Warning: Error clearing test data:', error);
  }
});

jest.setTimeout(30000);
