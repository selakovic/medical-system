const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const logger = require('./logger');
const { errorTypes } = require('./error-handler');

/**
 * Template engine using Handlebars
 */
class TemplateEngine {
  constructor() {
    this.templatesDir = path.join(process.cwd(), 'src', 'templates');
    this.templates = {};
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  registerHelpers() {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date, format) => {
      if (!date) return '';
      
      const d = new Date(date);
      
      // Default format: DD/MM/YYYY
      if (!format) {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      }
      
      // Custom format implementation can be added here
      return d.toLocaleDateString();
    });
    
    // Upper case helper
    Handlebars.registerHelper('uppercase', (str) => {
      return str ? str.toUpperCase() : '';
    });
    
    // Conditional helper
    Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }

  /**
   * Load and compile a template
   * @param {string} templateName - Template name
   * @returns {Function} Compiled template function
   * @throws {ApiError} If template not found
   */
  loadTemplate(templateName) {
    // Return cached template if available
    if (this.templates[templateName]) {
      return this.templates[templateName];
    }
    
    try {
      // Load template file
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile template
      const template = Handlebars.compile(templateSource);
      
      // Cache template
      this.templates[templateName] = template;
      
      return template;
    } catch (error) {
      logger.error(`Error loading template '${templateName}':`, error);
      throw errorTypes.NOT_FOUND(`Template '${templateName}' not found`);
    }
  }

  /**
   * Render template with data
   * @param {string} templateName - Template name
   * @param {Object} data - Data to render
   * @returns {string} Rendered template
   * @throws {ApiError} If template not found or rendering fails
   */
  render(templateName, data = {}) {
    try {
      const template = this.loadTemplate(templateName);
      return template(data);
    } catch (error) {
      // Re-throw not found error
      if (error.statusCode === 404) throw error;
      
      logger.error(`Error rendering template '${templateName}':`, error);
      throw errorTypes.INTERNAL(`Error rendering template '${templateName}'`);
    }
  }

  /**
   * Get all available template names
   * @returns {string[]} Array of template names
   */
  getAvailableTemplates() {
    try {
      const templateFiles = fs.readdirSync(this.templatesDir);
      return templateFiles
        .filter(file => file.endsWith('.hbs'))
        .map(file => file.replace('.hbs', ''));
    } catch (error) {
      logger.error('Error getting available templates:', error);
      return [];
    }
  }
}

module.exports = new TemplateEngine();