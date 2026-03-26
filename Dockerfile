FROM mcr.microsoft.com/playwright:v1.43.1-jammy

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy source
COPY src/ ./src/

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "src/index.js"]
