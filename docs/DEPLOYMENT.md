# WMO Translation Checker - Deployment Guide

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Anthropic API key obtained
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Backend server running
- [ ] Frontend deployed

---

## Installation Steps

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/yourorg/wmo-translation-checker.git
cd wmo-translation-checker

# Install dependencies
npm install

# Or with yarn
yarn install
```

### 2. Environment Setup

Create `.env` file in root directory:

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
PORT=3001
NODE_ENV=development
```

### 3. Run Development Server

```bash
# Backend
npm run dev

# Frontend (in separate terminal)
npm start
```

Access at: `http://localhost:3000`

---

## Production Deployment

### Option 1: Vercel (Recommended for Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Add ANTHROPIC_API_KEY
```

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

### Option 2: AWS Deployment

#### Frontend (S3 + CloudFront)

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync build/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Backend (EC2 or ECS)

```bash
# Build Docker image
docker build -t wmo-api .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
docker tag wmo-api:latest YOUR_ECR_URL/wmo-api:latest
docker push YOUR_ECR_URL/wmo-api:latest

# Deploy to ECS or EB
```

### Option 3: Heroku

```bash
# Login
heroku login

# Create app
heroku create wmo-translation-checker

# Set config
heroku config:set ANTHROPIC_API_KEY=your_key_here

# Deploy
git push heroku main

# Open
heroku open
```

### Option 4: Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Database Setup (Optional)

### PostgreSQL Schema

```sql
-- Create database
CREATE DATABASE wmo_translations;

-- Connect to database
\c wmo_translations

-- Create tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE translation_checks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  source_lang VARCHAR(2) NOT NULL,
  target_lang VARCHAR(2) NOT NULL,
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  score INTEGER,
  issues JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wmo_terminology (
  id SERIAL PRIMARY KEY,
  term_en VARCHAR(255) NOT NULL,
  term_fr VARCHAR(255),
  term_es VARCHAR(255),
  term_ar VARCHAR(255),
  term_zh VARCHAR(255),
  term_ru VARCHAR(255),
  category VARCHAR(100),
  source VARCHAR(255),
  reference_url TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_translation_checks_user_id ON translation_checks(user_id);
CREATE INDEX idx_translation_checks_created_at ON translation_checks(created_at);
CREATE INDEX idx_wmo_terminology_term_en ON wmo_terminology(term_en);
```

### Import WMO Terminology

```sql
-- Sample data import
COPY wmo_terminology(term_en, term_fr, term_es, term_ar, term_zh, term_ru, category)
FROM '/path/to/wmo_terms.csv'
DELIMITER ','
CSV HEADER;
```

---

## Monitoring & Logging

### Application Monitoring

**Using PM2:**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name wmo-api

# Monitor
pm2 monit

# View logs
pm2 logs wmo-api

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

### Error Tracking with Sentry

```javascript
// Install
npm install @sentry/node

// Add to server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### Logging with Winston

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

---

## Performance Optimization

### 1. Caching with Redis

```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Cache UNTERM lookups
async function getCachedTerm(term) {
  const cached = await client.get(`term:${term}`);
  if (cached) return JSON.parse(cached);
  
  const result = await fetchUNTerminology(term);
  await client.setEx(`term:${term}`, 3600, JSON.stringify(result));
  return result;
}
```

### 2. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

### 3. Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### 4. CDN Configuration

**CloudFront Settings:**
- Origin: S3 bucket or API Gateway
- Cache behavior: Cache based on query strings
- TTL: 1 hour for static assets, 5 minutes for API
- Compression: Enabled
- HTTPS: Required

---

## Security Best Practices

### 1. API Key Protection

```javascript
// Never expose API keys in frontend
// Use backend proxy
app.post('/api/check-translation', async (req, res) => {
  // API key is only in backend environment
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  // ... rest of code
});
```

### 2. Input Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/check-translation', [
  body('sourceText').trim().isLength({ min: 1, max: 10000 }),
  body('targetText').trim().isLength({ min: 1, max: 10000 }),
  body('sourceLang').isIn(['English', 'French', 'Spanish', 'Arabic', 'Simplified Chinese', 'Russian']),
  body('targetLang').isIn(['English', 'French', 'Spanish', 'Arabic', 'Simplified Chinese', 'Russian']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... proceed with check
});
```

### 3. CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(','),
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### 4. Helmet for Security Headers

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## Testing

### Unit Tests (Jest)

```javascript
// __tests__/translation.test.js
const { checkTranslationQuality } = require('../utils/translation');

describe('Translation Quality Checker', () => {
  test('should detect missing terminology', () => {
    const result = checkTranslationQuality(
      'The atmosphere is warming',
      'L'air est chaud',
      'English',
      'French'
    );
    
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].type).toBe('terminology');
  });

  test('should give high score for correct translation', () => {
    const result = checkTranslationQuality(
      'The atmosphere is warming',
      "L'atmosphère se réchauffe",
      'English',
      'French'
    );
    
    expect(result.overallScore).toBeGreaterThan(80);
  });
});
```

### Integration Tests

```javascript
const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  test('POST /api/check-translation should return analysis', async () => {
    const response = await request(app)
      .post('/api/check-translation')
      .send({
        sourceText: 'The climate is changing',
        targetText: 'Le climat change',
        sourceLang: 'English',
        targetLang: 'French'
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('overallScore');
    expect(response.body).toHaveProperty('issues');
  });
});
```

### Run Tests

```bash
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Review error logs
   - Check API usage and costs
   - Monitor performance metrics

2. **Monthly:**
   - Update dependencies: `npm update`
   - Review and update terminology database
   - Analyze user feedback

3. **Quarterly:**
   - Security audit: `npm audit`
   - Performance optimization review
   - Update documentation

### Backup Strategy

```bash
# Database backup
pg_dump wmo_translations > backup_$(date +%Y%m%d).sql

# Automated daily backups
0 2 * * * /usr/bin/pg_dump wmo_translations | gzip > /backups/wmo_$(date +\%Y\%m\%d).sql.gz
```

---

## Troubleshooting

### Common Issues

**Issue: API calls fail**
```
Error: Anthropic API authentication failed
```
**Solution:** Check ANTHROPIC_API_KEY in .env

**Issue: File upload fails**
```
Error: File size too large
```
**Solution:** Increase `express.json({ limit: '50mb' })`

**Issue: CORS errors**
```
Error: CORS policy blocked
```
**Solution:** Add origin to ALLOWED_ORIGINS in .env

**Issue: Slow performance**
```
Response time > 5 seconds
```
**Solution:** 
- Implement Redis caching
- Enable compression
- Optimize database queries

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Or specific namespace
DEBUG=wmo:* npm run dev
```

---

## Support & Resources

### Documentation
- [Anthropic API Docs](https://docs.anthropic.com/)
- [UNTERM Database](https://unterm.un.org/)
- [WMO Resources](https://public.wmo.int/)

### Community
- GitHub Issues: [Report bugs](https://github.com/yourorg/wmo-translation-checker/issues)
- Discord: [Join community](https://discord.gg/yourserver)
- Email: support@example.com

---

## Cost Estimation

### Anthropic API Costs
- Input: $3 per million tokens
- Output: $15 per million tokens
- Average translation check: ~1,500 tokens
- Estimated cost per check: $0.03

### Infrastructure (AWS Example)
- EC2 t3.medium: ~$30/month
- RDS PostgreSQL: ~$25/month
- S3 + CloudFront: ~$10/month
- **Total: ~$65/month + API costs**

---

**Version:** 1.0  
**Last Updated:** October 2025  
**Maintainer:** Development Team
