FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Create necessary directories and set permission
RUN mkdir -p logs && \
    mkdir -p src/templates && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3005

# Run database migrations and start server
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node src/server.js"]