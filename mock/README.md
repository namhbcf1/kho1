# 🔧 Mock Files

## Purpose
Mock data and services for testing and development.

### 📁 api/
- Mock API responses
- Test endpoints
- API stubs for offline development

### 📁 database/
- Mock database data
- Test schema
- Seed data for testing

### 📁 services/
- Mock external services
- Payment gateway mocks
- Authentication service mocks

## Usage

### For Claude:
```bash
# Generate mock data
node mock/generate-test-data.js

# Setup mock database
sqlite3 test.db < mock/database/test-schema.sql
```

### For Cursor:
```javascript
// Use mock services in development
import { mockPaymentService } from './mock/services/mock-payment-gateway.js';
```

## Benefits
- Offline development
- Consistent test data
- No external API dependencies
- Fast testing cycles