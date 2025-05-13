'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_preferences', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      theme: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'light',
      },
      language: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: 'en',
      },
      notifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint('user_preferences', {
      fields: ['userId'],
      type: 'unique',
      name: 'user_preferences_userId_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_preferences');
  },
};
