#!/usr/bin/env node

const http = require('http');
const https = require('https');

class SecurityTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.vulnerabilities = [];
  }

  async makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SecurityTester/1.0',
          ...headers
        }
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData,
            url: url.href
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  addVulnerability(type, severity, description, evidence) {
    this.vulnerabilities.push({
      type,
      severity,
      description,
      evidence,
      timestamp: new Date().toISOString()
    });
  }

  async testXSS() {
    console.log('\n🔒 Testing for XSS vulnerabilities...');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      '";alert("XSS");//',
      '&lt;script&gt;alert("XSS")&lt;/script&gt;',
      '&#60;script&#62;alert("XSS")&#60;/script&#62;'
    ];

    for (const payload of xssPayloads) {
      try {
        // Test in search query
        const response = await this.makeRequest('/api/locations/search', 'POST', {
          query: payload
        });

        if (response.body.includes(payload) && !response.body.includes('&lt;') && !response.body.includes('&quot;')) {
          this.addVulnerability(
            'XSS',
            'HIGH',
            'Reflected XSS in search query',
            `Payload: ${payload}, Response contains unescaped payload`
          );
        }

        // Test in location name
        const locationResponse = await this.makeRequest('/api/locations', 'POST', {
          name: payload,
          address: 'Test Address',
          lat: 0,
          lon: 0
        });

        if (locationResponse.body.includes(payload) && !locationResponse.body.includes('&lt;')) {
          this.addVulnerability(
            'XSS',
            'HIGH',
            'Stored XSS in location name',
            `Payload: ${payload}, Response contains unescaped payload`
          );
        }

      } catch (error) {
        console.log(`   ⚠️  Error testing XSS payload: ${payload}`);
      }
    }
  }

  async testSQLInjection() {
    console.log('\n🔒 Testing for SQL injection vulnerabilities...');
    
    const sqlPayloads = [
      "' OR 1=1--",
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users--",
      "1' OR '1' = '1' LIMIT 1--",
      "admin'--",
      "1' AND (SELECT COUNT(*) FROM users) > 0--",
      "' OR 1=1#",
      "' OR 1=1/*",
      "'; EXEC xp_cmdshell('dir');--"
    ];

    for (const payload of sqlPayloads) {
      try {
        // Test in search query
        const response = await this.makeRequest('/api/locations/search', 'POST', {
          query: payload
        });

        // Check for SQL error messages
        const sqlErrors = [
          'SQL syntax',
          'mysql_fetch',
          'ORA-',
          'PostgreSQL',
          'SQLite',
          'Microsoft SQL',
          'syntax error',
          'unclosed quotation mark'
        ];

        for (const error of sqlErrors) {
          if (response.body.toLowerCase().includes(error.toLowerCase())) {
            this.addVulnerability(
              'SQL Injection',
              'CRITICAL',
              'SQL injection in search query',
              `Payload: ${payload}, Error: ${error}`
            );
            break;
          }
        }

        // Test in authentication
        const authResponse = await this.makeRequest('/api/auth/login', 'POST', {
          email: payload,
          password: 'password'
        });

        for (const error of sqlErrors) {
          if (authResponse.body.toLowerCase().includes(error.toLowerCase())) {
            this.addVulnerability(
              'SQL Injection',
              'CRITICAL',
              'SQL injection in authentication',
              `Payload: ${payload}, Error: ${error}`
            );
            break;
          }
        }

      } catch (error) {
        console.log(`   ⚠️  Error testing SQL injection payload: ${payload}`);
      }
    }
  }

  async testInputValidation() {
    console.log('\n🔒 Testing input validation...');
    
    const testCases = [
      {
        field: 'query',
        payload: 'a'.repeat(10000),
        description: 'Extremely long search query'
      },
      {
        field: 'email',
        payload: 'a'.repeat(1000) + '@example.com',
        description: 'Extremely long email'
      },
      {
        field: 'password',
        payload: 'a'.repeat(1000),
        description: 'Extremely long password'
      },
      {
        field: 'name',
        payload: 'a'.repeat(1000),
        description: 'Extremely long name'
      }
    ];

    for (const testCase of testCases) {
      try {
        let data = {};
        data[testCase.field] = testCase.payload;

        const response = await this.makeRequest('/api/locations/search', 'POST', data);

        if (response.statusCode === 200 && response.body.length > 1000000) {
          this.addVulnerability(
            'Input Validation',
            'MEDIUM',
            `No length limit on ${testCase.field}`,
            `${testCase.description} - Response size: ${response.body.length} bytes`
          );
        }

        // Check for server errors that might indicate buffer overflow
        if (response.statusCode >= 500) {
          this.addVulnerability(
            'Input Validation',
            'HIGH',
            `Server error with ${testCase.field}`,
            `${testCase.description} - Status: ${response.statusCode}`
          );
        }

      } catch (error) {
        console.log(`   ⚠️  Error testing input validation: ${testCase.description}`);
      }
    }
  }

  async testAuthentication() {
    console.log('\n🔒 Testing authentication security...');
    
    try {
      // Test accessing protected routes without authentication
      const protectedRoutes = [
        '/dashboard',
        '/api/trips',
        '/api/locations',
        '/api/expenses'
      ];

      for (const route of protectedRoutes) {
        const response = await this.makeRequest(route, 'GET');
        
        if (response.statusCode !== 401 && response.statusCode !== 403) {
          this.addVulnerability(
            'Authentication',
            'HIGH',
            `Protected route accessible without authentication`,
            `Route: ${route}, Status: ${response.statusCode}`
          );
        }
      }

      // Test weak password requirements
      const weakPasswords = [
        '123',
        'abc',
        'password',
        'qwerty',
        '123456'
      ];

      for (const password of weakPasswords) {
        const response = await this.makeRequest('/api/auth/signup', 'POST', {
          name: 'Test User',
          email: 'test@example.com',
          password: password
        });

        if (response.statusCode === 200) {
          this.addVulnerability(
            'Authentication',
            'MEDIUM',
            'Weak password accepted',
            `Password: ${password}`
          );
        }
      }

    } catch (error) {
      console.log(`   ⚠️  Error testing authentication: ${error.message}`);
    }
  }

  async testCSRF() {
    console.log('\n🔒 Testing for CSRF vulnerabilities...');
    
    try {
      // Test if endpoints accept requests without proper CSRF tokens
      const csrfRoutes = [
        { path: '/api/trips', method: 'POST', data: { name: 'Test Trip' } },
        { path: '/api/locations', method: 'POST', data: { name: 'Test Location' } },
        { path: '/api/expenses', method: 'POST', data: { amount: 100, description: 'Test' } }
      ];

      for (const route of csrfRoutes) {
        const response = await this.makeRequest(route.path, route.method, route.data);
        
        // If we get a 200/201 without proper authentication, it might be vulnerable
        if (response.statusCode >= 200 && response.statusCode < 300) {
          this.addVulnerability(
            'CSRF',
            'MEDIUM',
            `Potential CSRF vulnerability in ${route.path}`,
            `Method: ${route.method}, Status: ${response.statusCode}`
          );
        }
      }

    } catch (error) {
      console.log(`   ⚠️  Error testing CSRF: ${error.message}`);
    }
  }

  async testInformationDisclosure() {
    console.log('\n🔒 Testing for information disclosure...');
    
    try {
      // Test for sensitive information in error messages
      const testRoutes = [
        '/api/nonexistent',
        '/api/auth/login',
        '/api/locations/search'
      ];

      for (const route of testRoutes) {
        const response = await this.makeRequest(route, 'POST', { invalid: 'data' });
        
        const sensitiveInfo = [
          'database',
          'password',
          'secret',
          'key',
          'token',
          'connection',
          'query',
          'sql',
          'stack trace',
          'exception'
        ];

        for (const info of sensitiveInfo) {
          if (response.body.toLowerCase().includes(info.toLowerCase())) {
            this.addVulnerability(
              'Information Disclosure',
              'MEDIUM',
              `Sensitive information in error response`,
              `Route: ${route}, Info: ${info}`
            );
          }
        }
      }

      // Test for directory listing
      const directoryRoutes = [
        '/src/',
        '/config/',
        '/.env',
        '/package.json',
        '/README.md'
      ];

      for (const route of directoryRoutes) {
        const response = await this.makeRequest(route, 'GET');
        
        if (response.statusCode === 200) {
          this.addVulnerability(
            'Information Disclosure',
            'LOW',
            `Directory/file accessible`,
            `Route: ${route}, Status: ${response.statusCode}`
          );
        }
      }

    } catch (error) {
      console.log(`   ⚠️  Error testing information disclosure: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🔒 Starting Security Tests for Vakay Trip Planner');
    console.log('================================================');
    
    try {
      await this.testXSS();
      await this.testSQLInjection();
      await this.testInputValidation();
      await this.testAuthentication();
      await this.testCSRF();
      await this.testInformationDisclosure();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Security test failed:', error);
      process.exit(1);
    }
  }

  generateReport() {
    console.log('\n📋 Security Test Report');
    console.log('========================');
    
    if (this.vulnerabilities.length === 0) {
      console.log('✅ No security vulnerabilities found!');
      return;
    }

    // Group by severity
    const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL');
    const high = this.vulnerabilities.filter(v => v.severity === 'HIGH');
    const medium = this.vulnerabilities.filter(v => v.severity === 'MEDIUM');
    const low = this.vulnerabilities.filter(v => v.severity === 'LOW');

    console.log(`\n🚨 Critical: ${critical.length}`);
    critical.forEach(v => {
      console.log(`   • ${v.description}`);
      console.log(`     Evidence: ${v.evidence}`);
    });

    console.log(`\n🔴 High: ${high.length}`);
    high.forEach(v => {
      console.log(`   • ${v.description}`);
      console.log(`     Evidence: ${v.evidence}`);
    });

    console.log(`\n🟡 Medium: ${medium.length}`);
    medium.forEach(v => {
      console.log(`   • ${v.description}`);
      console.log(`     Evidence: ${v.evidence}`);
    });

    console.log(`\n🟢 Low: ${low.length}`);
    low.forEach(v => {
      console.log(`   • ${v.description}`);
      console.log(`     Evidence: ${v.evidence}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total Vulnerabilities: ${this.vulnerabilities.length}`);
    console.log(`   Critical: ${critical.length}`);
    console.log(`   High: ${high.length}`);
    console.log(`   Medium: ${medium.length}`);
    console.log(`   Low: ${low.length}`);

    // Save report to file
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.vulnerabilities.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length
      },
      vulnerabilities: this.vulnerabilities
    };

    fs.writeFileSync('security-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to security-report.json');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runAllTests();
}

module.exports = SecurityTester;
