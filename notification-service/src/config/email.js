/**
 * Email configuration
 */
module.exports = {
  // Email provider (aws_ses or smtp)
  provider: process.env.EMAIL_PROVIDER || 'smtp',

  // AWS SES Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sourceEmail: process.env.AWS_SES_SOURCE_EMAIL
  },

  // SMTP Configuration (e.g. Mailtrap)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT, 10) || 2525,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },

  // Sender information
  from: {
    email: process.env.SMTP_FROM_EMAIL || 'noreply@cancer-data-platform.com',
    name: process.env.SMTP_FROM_NAME || 'Cancer Data Platform'
  },

  // Email templates configuration
  templates: {
    adminInvitation: {
      subject: 'Admin Invitation to Cancer Data Platform',
      template: 'admin-invitation'
    },
    userInvitation: {
      subject: 'Invitation to Cancer Data Platform',
      template: 'user-invitation'
    },
    processComplete: {
      subject: 'File Processing Complete',
      template: 'process-complete'
    },
    passwordReset: {
      subject: 'Password Reset for Cancer Data Platform',
      template: 'password-reset'
    }
  }
};