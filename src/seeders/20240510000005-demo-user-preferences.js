'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [users] = await queryInterface.sequelize.query(
      'SELECT id from users ORDER BY id ASC LIMIT 2;',
    );

    const userId1 = users[0].id;
    const userId2 = users[1].id;

    const now = new Date();

    return queryInterface.bulkInsert('user_preferences', [
      {
        userId: userId1,
        currency: 'USD',
        theme: 'dark',
        language: 'en',
        notifications: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: userId2,
        currency: 'EUR',
        theme: 'light',
        language: 'fr',
        notifications: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('user_preferences', null, {});
  },
};
