'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user IDs
    const [users] = await queryInterface.sequelize.query(
      'SELECT id from users ORDER BY id ASC LIMIT 2;',
    );

    const userId1 = users[0].id;

    // Get category IDs for user 1 - using "userid" in lowercase
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, name, type FROM categories WHERE "userId" = ${userId1};`,
    );

    const salaryCategory = categories.find((cat) => cat.name === 'Salary');
    const housingCategory = categories.find((cat) => cat.name === 'Housing');
    const foodCategory = categories.find((cat) => cat.name === 'Food');
    const transportCategory = categories.find((cat) => cat.name === 'Transportation');
    const entertainmentCategory = categories.find((cat) => cat.name === 'Entertainment');

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    return queryInterface.bulkInsert('transactions', [
      // Income transactions
      {
        amount: 5000.0,
        description: 'Monthly salary',
        date: now,
        type: 'INCOME',
        recurring: true,
        recurringInterval: 'monthly',
        userId: userId1,
        categoryId: salaryCategory.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        amount: 5000.0,
        description: 'Monthly salary',
        date: lastMonth,
        type: 'INCOME',
        recurring: true,
        recurringInterval: 'monthly',
        userId: userId1,
        categoryId: salaryCategory.id,
        createdAt: lastMonth,
        updatedAt: lastMonth,
      },
      {
        amount: 5000.0,
        description: 'Monthly salary',
        date: twoMonthsAgo,
        type: 'INCOME',
        recurring: true,
        recurringInterval: 'monthly',
        userId: userId1,
        categoryId: salaryCategory.id,
        createdAt: twoMonthsAgo,
        updatedAt: twoMonthsAgo,
      },

      // Expense transactions - current month
      {
        amount: 1500.0,
        description: 'Rent payment',
        date: now,
        type: 'EXPENSE',
        recurring: true,
        recurringInterval: 'monthly',
        userId: userId1,
        categoryId: housingCategory.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        amount: 400.0,
        description: 'Grocery shopping',
        date: now,
        type: 'EXPENSE',
        recurring: false,
        userId: userId1,
        categoryId: foodCategory.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        amount: 150.0,
        description: 'Gas',
        date: now,
        type: 'EXPENSE',
        recurring: false,
        userId: userId1,
        categoryId: transportCategory.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        amount: 80.0,
        description: 'Movie night',
        date: now,
        type: 'EXPENSE',
        recurring: false,
        userId: userId1,
        categoryId: entertainmentCategory.id,
        createdAt: now,
        updatedAt: now,
      },

      // Expense transactions - last month
      {
        amount: 1500.0,
        description: 'Rent payment',
        date: lastMonth,
        type: 'EXPENSE',
        recurring: true,
        recurringInterval: 'monthly',
        userId: userId1,
        categoryId: housingCategory.id,
        createdAt: lastMonth,
        updatedAt: lastMonth,
      },
      {
        amount: 350.0,
        description: 'Grocery shopping',
        date: lastMonth,
        type: 'EXPENSE',
        recurring: false,
        userId: userId1,
        categoryId: foodCategory.id,
        createdAt: lastMonth,
        updatedAt: lastMonth,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('transactions', null, {});
  },
};
