/**
 * Model relationships and exports
 */
const User = require('./user.model');
const Invitation = require('./invitation.model');

// Define relationships
User.hasMany(Invitation, {
  foreignKey: 'invitedById',
  as: 'sentInvitations'
});

Invitation.belongsTo(User, {
  foreignKey: 'invitedById',
  as: 'invitedBy'
});

module.exports = {
  User,
  Invitation
};