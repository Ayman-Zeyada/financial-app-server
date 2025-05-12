'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [users] = await queryInterface.sequelize.query(
      'SELECT id from users ORDER BY id ASC LIMIT 2;',
    );

    const userId1 = users[0].id;
    const userId2 = users[1].id;

    return queryInterface.bulkInsert('categories', [
      // Income categories for user 1
      {
        name: 'Salary',
        description: 'Monthly salary income',
        type: 'INCOME',
        color: '#4CAF50',
        icon: 'money-bill',
        userId: userId1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Investments',
        description: 'Income from investments',
        type: 'INCOME',
        color: '#2196F3',
        icon: 'chart-line',
        userId: userId1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Expense categories for user 1
      {
        name: 'Housing',
        description: 'Rent or mortgage payments',
        type: 'EXPENSE',
        color: '#FF5722',
        icon: 'home',
        userId: userId1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Food',
        description: 'Groceries and dining out',
        type: 'EXPENSE',
        color: '#FFC107',
        icon: 'utensils',
        userId: userId1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Transportation',
        description: 'Car payments, gas, public transport',
        type: 'EXPENSE',
        color: '#673AB7',
        icon: 'car',
        userId: userId1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Entertainment',
        description: 'Movies, events, subscriptions',
        type: 'EXPENSE',
        color: '#E91E63',
        icon: 'film',
        userId: userId1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Categories for user 2
      {
        name: 'Salary',
        description: 'Regular income',
        type: 'INCOME',
        color: '#4CAF50',
        icon: 'money-bill',
        userId: userId2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Housing',
        description: 'Housing expenses',
        type: 'EXPENSE',
        color: '#FF5722',
        icon: 'home',
        userId: userId2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('categories', null, {});
  },
};
