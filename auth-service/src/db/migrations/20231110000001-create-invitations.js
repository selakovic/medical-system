'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create role enum type if not exists
    await queryInterface.sequelize.query('CREATE TYPE "enum_invitations_role" AS ENUM (\'admin\', \'user\');');

    await queryInterface.createTable('invitations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      token: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'user'),
        defaultValue: 'user'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      invitedById: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      isAccepted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      acceptedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('invitations', ['token']);
    await queryInterface.addIndex('invitations', ['email']);
    await queryInterface.addIndex('invitations', ['isAccepted', 'expiresAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invitations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invitations_role";');
  }
};