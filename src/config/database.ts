import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import logger from '../utils/logger';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

interface DatabaseConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: string | number;
  dialect: string;
  logging: any;
  dialectOptions?: {
    ssl?: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
}

const dbConfig: Record<string, DatabaseConfig> = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'financial_app_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: (msg: string) => logger.debug(msg),
  },
  test: {
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_NAME || 'financial_app_test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST || '',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

const config = dbConfig[NODE_ENV];

const sequelizeOptions: any = {
  host: config.host,
  port: Number(config.port),
  dialect: 'postgres',
  logging: config.logging,
};

if (config.dialectOptions) {
  sequelizeOptions.dialectOptions = config.dialectOptions;
}

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  sequelizeOptions,
);

export { sequelize };
export default config;
