'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    return queryInterface.bulkInsert('users', [
      {
        username: 'johndoe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'janedoe',
        email: 'jane.doe@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Doe',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  },
};
