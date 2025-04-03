const { DataTypes, Model, Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../db');

class Invitation extends Model {
  /**
   * Check if invitation is expired
   * @returns {boolean} True if expired
   */
  isExpired() {
    return this.expiresAt < new Date();
  }

  /**
   * Mark invitation as accepted
   */
  async markAsAccepted() {
    this.isAccepted = true;
    this.acceptedAt = new Date();
    await this.save();
  }
}

Invitation.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Please enter a valid email address'
      },
      notNull: {
        msg: 'Email is required'
      }
    }
  },
  token: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  invitedById: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Invitation',
  tableName: 'invitations',
  timestamps: true
});

/**
 * Find active invitation by token
 * @param {string} token - Invitation token
 * @returns {Promise<Invitation>} Invitation or null
 */
Invitation.findActiveByToken = async function(token) {
  return await Invitation.findOne({
    where: {
      token,
      isAccepted: false,
      expiresAt: { [Op.gt]: new Date() }
    }
  });
};

/**
 * Find active invitation by email
 * @param {string} email - Email address
 * @returns {Promise<Invitation>} Invitation or null
 */
Invitation.findActiveByEmail = async function(email) {
  return await Invitation.findOne({
    where: {
      email,
      isAccepted: false,
      expiresAt: { [Op.gt]: new Date() }
    }
  });
};

module.exports = Invitation;