'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user IDs
    const [users] = await queryInterface.sequelize.query(
      'SELECT id from users ORDER BY id ASC LIMIT 2;',
    );

    const userId1 = users[0].id;

    // Get category IDs for user 1 - using double quotes for case sensitivity
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, name, type FROM categories WHERE "userId" = ${userId1};`,
    );

    const housingCategory = categories.find((cat) => cat.name === 'Housing');
    const foodCategory = categories.find((cat) => cat.name === 'Food');
    const transportCategory = categories.find((cat) => cat.name === 'Transportation');
    const entertainmentCategory = categories.find((cat) => cat.name === 'Entertainment');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return queryInterface.bulkInsert('budgets', [
      {
        name: 'Monthly Housing Budget',
        amount: 1600.0,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        userId: userId1,
        categoryId: housingCategory.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Food Budget',
        amount: 500.0,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        userId: userId1,
        categoryId: foodCategory.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Transportation Budget',
        amount: 300.0,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        userId: userId1,
        categoryId: transportCategory.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Entertainment Budget',
        amount: 200.0,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        userId: userId1,
        categoryId: entertainmentCategory.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Overall Monthly Budget',
        amount: 3000.0,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        userId: userId1,
        categoryId: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('budgets', null, {});
  },
};
