/**
 * Admin configuration
 */
const ms = require('ms');

module.exports = {
  // Admin email address (where to send initial admin invitation)
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  
  // Admin invitation expiry time (how long the invitation link is valid)
  invitationExpiry: ms(process.env.ADMIN_INVITATION_EXPIRY || '24h'),
  
  // User invitation expiry time (for regular users)
  userInvitationExpiry: ms(process.env.USER_INVITATION_EXPIRY || '48h')
};