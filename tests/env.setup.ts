process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.JWT_EXPIRES_IN = '3600'; // 1 hour
process.env.JWT_REFRESH_EXPIRES_IN = '7200'; // 2 hours

process.env.TEST_DB_HOST = 'localhost';
process.env.TEST_DB_PORT = '5432';
process.env.TEST_DB_USER = 'financial_app';
process.env.TEST_DB_PASSWORD = '12345678';
process.env.TEST_DB_NAME = 'financial_app_test';

process.env.CLIENT_URL = 'http://localhost:3000';
process.env.PORT = '4001';
