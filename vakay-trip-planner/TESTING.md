# 🧪 Testing Guide for Vakay Trip Planner

This document provides comprehensive guidance for testing the Vakay Trip Planner application using the implemented testing infrastructure.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Testing Types](#testing-types)
- [Running Tests](#running-tests)
- [Test Reports](#test-reports)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🎯 Overview

The Vakay Trip Planner includes a comprehensive testing suite covering:

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability assessment
- **Accessibility Tests**: WCAG compliance testing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd vakay-trip-planner

# Install dependencies
npm install

# Run all tests
npm run test:all
```

### Quick Test Commands

```bash
# Run unit tests only
npm test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run all tests with comprehensive reporting
node scripts/run-all-tests.js
```

## 🧪 Testing Types

### 1. Unit Tests (Jest)

**Purpose**: Test individual components and functions in isolation

**Location**: `src/**/__tests__/` and `src/**/*.test.{ts,tsx}`

**Example**:
```typescript
// src/lib/__tests__/locationUtils.test.ts
describe('locationUtils', () => {
  describe('validateNominatimLocation', () => {
    it('should validate a valid location', () => {
      const validLocation = { /* test data */ };
      expect(validateNominatimLocation(validLocation)).toBe(true);
    });
  });
});
```

**Running**:
```bash
npm test                    # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### 2. Integration Tests (Jest + API Routes)

**Purpose**: Test API endpoints and database interactions

**Location**: `src/app/api/__tests__/`

**Example**:
```typescript
// src/app/api/__tests__/locations-search.test.ts
describe('Locations Search API', () => {
  it('should return 400 for missing query parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/locations/search', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### 3. End-to-End Tests (Playwright)

**Purpose**: Test complete user workflows across multiple pages

**Location**: `src/e2e/`

**Example**:
```typescript
// src/e2e/auth.spec.ts
test('should display login form on homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to Vakay' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
});
```

**Running**:
```bash
npm run test:e2e          # Run all E2E tests
npx playwright test       # Run with Playwright CLI
npx playwright test --ui  # Run with Playwright UI
```

### 4. Performance Tests (Custom Scripts)

**Purpose**: Measure API response times and load handling

**Location**: `scripts/performance-test.js`

**Features**:
- Response time measurement
- Load testing with concurrent users
- Performance statistics (avg, median, p95, p99)
- Response size analysis

**Running**:
```bash
node scripts/performance-test.js
```

### 5. Security Tests (Custom Scripts)

**Purpose**: Identify security vulnerabilities

**Location**: `scripts/security-test.js`

**Tests Include**:
- XSS (Cross-Site Scripting)
- SQL Injection
- Input validation
- Authentication bypass
- CSRF vulnerabilities
- Information disclosure

**Running**:
```bash
node scripts/security-test.js
```

### 6. Accessibility Tests (Custom Scripts)

**Purpose**: Ensure WCAG compliance and accessibility

**Location**: `scripts/accessibility-test.js`

**Tests Include**:
- Keyboard navigation
- Color contrast
- Semantic HTML
- Image alt text
- Form labels
- ARIA attributes
- Screen reader compatibility

**Running**:
```bash
node scripts/accessibility-test.js
```

## 🏃‍♂️ Running Tests

### Individual Test Suites

```bash
# Unit Tests
npm test

# E2E Tests
npm run test:e2e

# Performance Tests
node scripts/performance-test.js

# Security Tests
node scripts/security-test.js

# Accessibility Tests
node scripts/accessibility-test.js
```

### Comprehensive Testing

```bash
# Run all tests with reporting
node scripts/run-all-tests.js

# This will:
# 1. Check build status
# 2. Run linting
# 3. Execute all test types
# 4. Generate comprehensive reports
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      - run: node scripts/security-test.js
      - run: node scripts/accessibility-test.js
```

## 📊 Test Reports

### Coverage Reports

- **Location**: `coverage/lcov-report/index.html`
- **Generated by**: `npm run test:coverage`
- **Target**: 80%+ code coverage

### E2E Reports

- **Location**: `playwright-report/index.html`
- **Generated by**: `npm run test:e2e`
- **Features**: Screenshots, videos, traces

### Custom Reports

- **Performance**: `performance-report.json`
- **Security**: `security-report.json`
- **Accessibility**: `accessibility-report.json`
- **Comprehensive**: `comprehensive-test-report.json`

## ⚙️ Configuration

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/e2e',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Environment Variables

```bash
# .env.test
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
NODE_ENV=test
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Test Environment Setup

```bash
# Clear Jest cache
npm run test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. Playwright Issues

```bash
# Reinstall Playwright browsers
npx playwright install

# Clear Playwright cache
npx playwright install --force
```

#### 3. Performance Test Failures

```bash
# Check if app is running
curl http://localhost:3000/api/health

# Increase timeout in performance-test.js
const timeout = 30000; // 30 seconds
```

#### 4. Security Test Failures

```bash
# Check for false positives
# Review security-report.json for details
# Some "vulnerabilities" may be expected behavior
```

### Debug Mode

```bash
# Jest debug mode
npm test -- --verbose --detectOpenHandles

# Playwright debug mode
npx playwright test --debug

# Performance test with detailed logging
DEBUG=* node scripts/performance-test.js
```

## 📚 Best Practices

### Writing Tests

1. **Test Structure**: Use descriptive test names and group related tests
2. **Mocking**: Mock external dependencies and APIs
3. **Assertions**: Use specific assertions and avoid generic ones
4. **Cleanup**: Clean up test data and state after each test

### Test Data Management

```typescript
// Use factories for test data
const createMockTrip = (overrides = {}) => ({
  id: '1',
  name: 'Test Trip',
  start_date: '2024-01-15',
  end_date: '2024-01-17',
  ...overrides
});
```

### Performance Testing

1. **Baseline**: Establish performance baselines
2. **Monitoring**: Track performance trends over time
3. **Thresholds**: Set acceptable performance thresholds
4. **Load Testing**: Test with realistic user loads

### Security Testing

1. **Regular Scans**: Run security tests regularly
2. **False Positives**: Review and validate findings
3. **Dependencies**: Keep dependencies updated
4. **Monitoring**: Monitor for new vulnerabilities

### Accessibility Testing

1. **Standards**: Follow WCAG 2.1 AA guidelines
2. **Tools**: Use automated and manual testing
3. **Users**: Test with actual users when possible
4. **Continuous**: Integrate into development workflow

## 🚀 Next Steps

### Immediate Actions

1. **Run Tests**: Execute the comprehensive test suite
2. **Review Reports**: Analyze generated reports
3. **Fix Issues**: Address any failed tests
4. **Set Up CI/CD**: Automate testing in your workflow

### Long-term Improvements

1. **Coverage Goals**: Increase test coverage to 90%+
2. **Performance**: Set up performance monitoring
3. **Security**: Implement security scanning in CI/CD
4. **Accessibility**: Regular accessibility audits

### Monitoring and Maintenance

1. **Regular Testing**: Schedule regular test runs
2. **Dependency Updates**: Keep testing dependencies current
3. **Test Maintenance**: Update tests as code changes
4. **Performance Tracking**: Monitor performance trends

## 📞 Support

For testing-related issues:

1. Check this documentation
2. Review test output and error messages
3. Check generated reports for details
4. Review test configuration files
5. Consult the testing community

---

**Happy Testing! 🧪✨**
