# 🛠️ DEVELOPMENT ENVIRONMENT SETUP

## 📋 PREREQUISITES

### System Requirements
```yaml
Operating_System: Windows 11 with WSL2
WSL_Distribution: Ubuntu 22.04 LTS
Node_Version: 20.x LTS
Python_Version: 3.11+
Docker_Version: 24.x+
Git_Version: 2.40+
```

### Required Tools
```bash
# Essential Development Tools (FREE)
- VS Code + Extensions
- Git + GitHub CLI
- Docker Desktop
- Node.js + npm/yarn
- Python + pip
- AWS CLI v2
- Terraform
- kubectl
```

## 🚀 QUICK START GUIDE

### 1. Clone Repository
```bash
# Clone the main repository
git clone https://github.com/your-org/enterprise-crypto-platform.git
cd enterprise-crypto-platform

# Install dependencies
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables (NEVER commit real values)
code .env.local
```

### 3. Docker Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 PROJECT STRUCTURE

```
enterprise-crypto-platform/
├── services/
│   ├── telegram-bot/          # Telegram bot service
│   ├── web-app/              # Next.js web application
│   ├── trading-engine/       # Core trading engine
│   ├── ml-analytics/         # ML/AI analytics service
│   ├── blockchain-service/   # Multi-chain integration
│   ├── user-management/      # Auth & user service
│   ├── data-pipeline/        # Real-time data processing
│   └── community-platform/   # Social features
├── infrastructure/
│   ├── terraform/            # Infrastructure as Code
│   ├── docker/              # Docker configurations
│   ├── kubernetes/          # K8s manifests (if needed)
│   └── scripts/             # Deployment scripts
├── shared/
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Shared utilities
│   ├── constants/           # Application constants
│   └── schemas/             # Database schemas
├── docs/                    # Documentation
├── tests/                   # Integration tests
└── tools/                   # Development tools
```

## 🔧 SERVICE DEVELOPMENT

### Telegram Bot Service
```bash
cd services/telegram-bot

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Web Application
```bash
cd services/web-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000

# Run tests
npm test

# Build for production
npm run build
```

### Trading Engine
```bash
cd services/trading-engine

# Install dependencies
npm install

# Start development server
npm run dev

# Run load tests
npm run test:load

# Build for production
npm run build
```

## 🐳 DOCKER CONFIGURATION

### Development Docker Compose
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: crypto_platform_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
      
  timescaledb:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_DB: timeseries_dev
      POSTGRES_USER: ts_user
      POSTGRES_PASSWORD: ts_password
    ports:
      - "5433:5432"
    volumes:
      - timescale_data:/var/lib/postgresql/data

volumes:
  postgres_data:
  redis_data:
  timescale_data:
```

### Service Dockerfiles
```dockerfile
# services/telegram-bot/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start application
CMD ["npm", "start"]
```

## 🔐 SECURITY GUIDELINES

### Environment Variables
```bash
# .env.example (Template - safe to commit)
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# Sensitive variables (NEVER commit)
JWT_SECRET=your-jwt-secret
BINANCE_API_KEY=your-binance-key
TELEGRAM_BOT_TOKEN=your-bot-token
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: detect-private-key
      - id: check-added-large-files
      
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### Git Configuration
```bash
# Install pre-commit hooks
npm install -g pre-commit
pre-commit install

# Configure git secrets
git secrets --register-aws
git secrets --install
```

## 🧪 TESTING STRATEGY

### Unit Testing
```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- telegram-bot.test.ts
```

### Integration Testing
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration

# Clean up test environment
docker-compose -f docker-compose.test.yml down
```

### Load Testing
```bash
# Install Artillery (free load testing tool)
npm install -g artillery

# Run load tests
artillery run tests/load/trading-engine.yml

# Generate reports
artillery report test-results.json
```

### End-to-End Testing
```bash
# Install Playwright (free E2E testing)
npm install -g @playwright/test

# Run E2E tests
npx playwright test

# Run tests with UI
npx playwright test --ui
```

## 📊 MONITORING & DEBUGGING

### Local Development Monitoring
```bash
# Install monitoring tools (free)
npm install -g pm2          # Process manager
npm install -g clinic       # Performance profiling
npm install -g autocannon   # HTTP benchmarking

# Start services with PM2
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# Profile performance
clinic doctor -- node app.js
```

### Debugging Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Telegram Bot",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/services/telegram-bot/src/index.ts",
      "outFiles": ["${workspaceFolder}/services/telegram-bot/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## 🔄 CI/CD PIPELINE

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: security-scan-results.sarif
```

### Deployment Scripts
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Starting deployment..."

# Build Docker images
docker build -t telegram-bot:latest services/telegram-bot/
docker build -t trading-engine:latest services/trading-engine/

# Tag for ECR
docker tag telegram-bot:latest $ECR_REGISTRY/telegram-bot:latest
docker tag trading-engine:latest $ECR_REGISTRY/trading-engine:latest

# Push to ECR
docker push $ECR_REGISTRY/telegram-bot:latest
docker push $ECR_REGISTRY/trading-engine:latest

# Update ECS services
aws ecs update-service --cluster production --service telegram-bot --force-new-deployment
aws ecs update-service --cluster production --service trading-engine --force-new-deployment

echo "✅ Deployment completed!"
```

## 🆘 TROUBLESHOOTING

### Common Issues
```bash
# Port already in use
lsof -ti:3000 | xargs kill -9

# Docker issues
docker system prune -a
docker-compose down --volumes

# Node modules issues
rm -rf node_modules package-lock.json
npm install

# Database connection issues
docker-compose restart postgres
npm run db:migrate
```

### Performance Debugging
```bash
# Memory leaks
node --inspect app.js
# Open chrome://inspect

# CPU profiling
clinic flame -- node app.js

# Event loop monitoring
clinic bubbleprof -- node app.js
```

---

**Last Updated**: 2024-06-24  
**Version**: 1.0  
**Status**: Development Setup Ready
