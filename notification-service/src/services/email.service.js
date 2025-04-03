const nodemailer = require('nodemailer');
const { SESClient, SendEmailCommand, ListIdentitiesCommand } = require('@aws-sdk/client-ses');
const emailConfig = require('../config/email');
const templateEngine = require('../utils/template-engine');
const logger = require('../utils/logger');
const { errorTypes } = require('../utils/error-handler');

/**
 * Email service for sending notifications
 */
class EmailService {
  constructor() {
    this.initialize();
  }

  /**
   * Initialize email service based on configuration
   */
  initialize() {
    this.provider = emailConfig.provider;
    
    if (this.provider === 'aws_ses') {
      this.initializeAwsSes();
    } else {
      this.initializeSmtp();
    }
    
    logger.info(`Email service initialized with provider: ${this.provider}`);
  }

  /**
   * Initialize AWS SES client
   */
  initializeAwsSes() {
    this.sesClient = new SESClient({
      region: emailConfig.aws.region,
      credentials: {
        accessKeyId: emailConfig.aws.accessKeyId,
        secretAccessKey: emailConfig.aws.secretAccessKey
      }
    });
  }

  /**
   * Initialize SMTP transport
   */
  initializeSmtp() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.smtp.auth.user,
        pass: emailConfig.smtp.auth.pass
      }
    });
  }

  /**
   * Send email with AWS SES
   * @param {Object} mailOptions - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendWithAwsSes(mailOptions) {
    try {
      const command = new SendEmailCommand({
        Source: `"${emailConfig.from.name}" <${emailConfig.aws.sourceEmail}>`,
        Destination: {
          ToAddresses: [mailOptions.to]
        },
        Message: {
          Subject: {
            Data: mailOptions.subject
          },
          Body: {
            Html: {
              Data: mailOptions.html
            },
            Text: {
              Data: mailOptions.text || 'Please view this email in an HTML-compatible client.'
            }
          }
        }
      });

      const result = await this.sesClient.send(command);
      logger.info(`Email sent with AWS SES to ${mailOptions.to}, MessageId: ${result.MessageId}`);
      return { messageId: result.MessageId };
    } catch (error) {
      logger.error(`Error sending email with AWS SES:`, error);
      throw errorTypes.INTERNAL('Failed to send email');
    }
  }

  /**
   * Send email with SMTP
   * @param {Object} mailOptions - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendWithSmtp(mailOptions) {
    try {
      // Add from details
      mailOptions.from = mailOptions.from || `"${emailConfig.from.name}" <${emailConfig.from.email}>`;
      
      // For development, log the email content
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`[DEV] Email to: ${mailOptions.to}`);
        logger.debug(`[DEV] Email subject: ${mailOptions.subject}`);
        logger.debug(`[DEV] Email content length: ${mailOptions.html ? mailOptions.html.length : 0} chars`);
      }
      
      // Mock sending in development if no SMTP credentials
      if (process.env.NODE_ENV === 'development' && 
          (!emailConfig.smtp.auth.user || !emailConfig.smtp.auth.pass)) {
        logger.info(`[DEV] Mock email sent to ${mailOptions.to}`);
        return { messageId: `mock-${Date.now()}` };
      }
      
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent with SMTP to ${mailOptions.to}, MessageId: ${info.messageId}`);
      return { messageId: info.messageId };
    } catch (error) {
      logger.error(`Error sending email with SMTP:`, error);
      throw errorTypes.INTERNAL('Failed to send email');
    }
  }

  /**
   * Send email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(to, subject, templateName, data = {}) {
    try {
      // Add current date to data for templating
      const templateData = {
        ...data,
        now: new Date()
      };
      
      // Render HTML content from template
      let html;
      try {
        html = templateEngine.render(templateName, templateData);
      } catch (error) {
        // If template not found, create a simple HTML message
        logger.warn(`Template '${templateName}' not found, using simple message`);
        html = `<p>This is an automated message from Cancer Data Platform.</p>
                <p>Please contact support if you have any questions.</p>`;
      }
      
      // Configure mail options
      const mailOptions = {
        to,
        subject,
        html
      };
      
      // Send with appropriate provider
      if (this.provider === 'aws_ses') {
        return await this.sendWithAwsSes(mailOptions);
      } else {
        return await this.sendWithSmtp(mailOptions);
      }
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error(`Error sending email:`, error);
      throw errorTypes.INTERNAL('Failed to send email');
    }
  }

  /**
   * Verify email configuration is working
   * @returns {Promise<boolean>} True if successful
   */
  async verifyConnection() {
    try {
      if (this.provider === 'aws_ses') {
        // Za AWS SES, samo ćemo vratiti true jer je teže testirati vezu
        logger.info(`Email service using AWS SES in region: ${emailConfig.aws.region}`);
        return true;
      } else {
        // Verify SMTP connection if credentials are provided
        if (emailConfig.smtp.auth.user && emailConfig.smtp.auth.pass) {
          await this.transporter.verify();
          logger.info(`Email service connection verified for SMTP: ${emailConfig.smtp.host}`);
        } else {
          logger.warn('No SMTP credentials provided, emails will be mocked in development mode');
        }
        return true;
      }
    } catch (error) {
      logger.error(`Email service connection failed for provider: ${this.provider}`, error);
      throw errorTypes.INTERNAL('Email service configuration is invalid');
    }
  }
}

module.exports = new EmailService();