'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [users] = await queryInterface.sequelize.query(
      'SELECT id from users ORDER BY id ASC LIMIT 2;',
    );

    const userId1 = users[0].id;

    const now = new Date();

    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

    return queryInterface.bulkInsert('financial_goals', [
      {
        userId: userId1,
        name: 'Emergency Fund',
        targetAmount: 10000.0,
        currentAmount: 3500.0,
        targetDate: sixMonthsFromNow,
        description: 'Build a 3-month emergency fund',
        category: 'Savings',
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: userId1,
        name: 'New Car',
        targetAmount: 25000.0,
        currentAmount: 5000.0,
        targetDate: oneYearFromNow,
        description: 'Save for a new car',
        category: 'Transportation',
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: userId1,
        name: 'Home Down Payment',
        targetAmount: 60000.0,
        currentAmount: 15000.0,
        targetDate: twoYearsFromNow,
        description: 'Save for a down payment on a house',
        category: 'Housing',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('financial_goals', null, {});
  },
};
