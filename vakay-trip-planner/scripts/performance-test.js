#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

class PerformanceTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async makeRequest(path, method = 'GET', data = null) {
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
          'User-Agent': 'PerformanceTester/1.0'
        }
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const startTime = performance.now();
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          resolve({
            statusCode: res.statusCode,
            duration: duration,
            size: Buffer.byteLength(responseData),
            headers: res.headers
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

  async testEndpoint(path, method = 'GET', data = null, iterations = 10) {
    console.log(`\n🧪 Testing ${method} ${path} (${iterations} iterations)`);
    
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.makeRequest(path, method, data);
        results.push(result);
        
        // Progress indicator
        process.stdout.write('.');
      } catch (error) {
        console.error(`\n❌ Error on iteration ${i + 1}:`, error.message);
        results.push({ error: error.message, duration: 0 });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n');
    
    // Calculate statistics
    const successfulResults = results.filter(r => !r.error);
    const durations = successfulResults.map(r => r.duration);
    
    if (durations.length > 0) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const sorted = durations.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      
      const stats = {
        path,
        method,
        iterations,
        successful: successfulResults.length,
        failed: results.length - successfulResults.length,
        average: avg.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        median: median.toFixed(2),
        p95: p95.toFixed(2),
        p99: p99.toFixed(2),
        averageSize: successfulResults.length > 0 ? 
          (successfulResults.reduce((a, b) => a + b.size, 0) / successfulResults.length).toFixed(0) : 0
      };
      
      console.log(`📊 Results for ${method} ${path}:`);
      console.log(`   Success Rate: ${((successfulResults.length / results.length) * 100).toFixed(1)}%`);
      console.log(`   Average Response Time: ${stats.average}ms`);
      console.log(`   Median Response Time: ${stats.median}ms`);
      console.log(`   95th Percentile: ${stats.p95}ms`);
      console.log(`   99th Percentile: ${stats.p99}ms`);
      console.log(`   Min/Max: ${stats.min}ms / ${stats.max}ms`);
      console.log(`   Average Response Size: ${stats.averageSize} bytes`);
      
      this.results.push(stats);
      return stats;
    } else {
      console.log(`❌ All requests failed for ${method} ${path}`);
      return null;
    }
  }

  async runLoadTest(path, method = 'GET', data = null, concurrency = 10, duration = 30000) {
    console.log(`\n🚀 Load Test: ${method} ${path}`);
    console.log(`   Concurrency: ${concurrency} concurrent users`);
    console.log(`   Duration: ${duration / 1000} seconds`);
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    const activeRequests = new Set();
    const results = [];
    
    const makeConcurrentRequest = async () => {
      while (Date.now() < endTime) {
        const requestStart = performance.now();
        
        try {
          const result = await this.makeRequest(path, method, data);
          const requestDuration = performance.now() - requestStart;
          
          results.push({
            ...result,
            duration: requestDuration,
            timestamp: Date.now()
          });
        } catch (error) {
          results.push({
            error: error.message,
            duration: 0,
            timestamp: Date.now()
          });
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };
    
    // Start concurrent requests
    const promises = Array(concurrency).fill().map(() => makeConcurrentRequest());
    await Promise.all(promises);
    
    // Calculate load test statistics
    const successfulResults = results.filter(r => !r.error);
    const durations = successfulResults.map(r => r.duration);
    
    if (durations.length > 0) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const rps = results.length / (duration / 1000);
      
      console.log(`\n📊 Load Test Results:`);
      console.log(`   Total Requests: ${results.length}`);
      console.log(`   Successful: ${successfulResults.length}`);
      console.log(`   Failed: ${results.length - successfulResults.length}`);
      console.log(`   Requests per Second: ${rps.toFixed(2)}`);
      console.log(`   Average Response Time: ${avg.toFixed(2)}ms`);
      console.log(`   Success Rate: ${((successfulResults.length / results.length) * 100).toFixed(1)}%`);
    }
    
    return results;
  }

  generateReport() {
    console.log('\n📋 Performance Test Summary Report');
    console.log('=====================================');
    
    if (this.results.length === 0) {
      console.log('No test results to report.');
      return;
    }
    
    // Sort by average response time
    const sortedResults = this.results.sort((a, b) => parseFloat(a.average) - parseFloat(b.average));
    
    console.log('\n🏆 Fastest Endpoints:');
    sortedResults.slice(0, 3).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.method} ${result.path}: ${result.average}ms`);
    });
    
    console.log('\n🐌 Slowest Endpoints:');
    sortedResults.slice(-3).reverse().forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.method} ${result.path}: ${result.average}ms`);
    });
    
    console.log('\n📈 Overall Statistics:');
    const allDurations = this.results.map(r => parseFloat(r.average));
    const overallAvg = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
    const overallMin = Math.min(...allDurations);
    const overallMax = Math.max(...allDurations);
    
    console.log(`   Average Response Time: ${overallAvg.toFixed(2)}ms`);
    console.log(`   Best Response Time: ${overallMin.toFixed(2)}ms`);
    console.log(`   Worst Response Time: ${overallMax.toFixed(2)}ms`);
    console.log(`   Total Endpoints Tested: ${this.results.length}`);
  }
}

// Test scenarios
async function runPerformanceTests() {
  const tester = new PerformanceTester();
  
  console.log('🚀 Starting Performance Tests for Vakay Trip Planner');
  console.log('==================================================');
  
  try {
    // Test basic endpoints
    await tester.testEndpoint('/', 'GET');
    await tester.testEndpoint('/api/health', 'GET');
    
    // Test authentication endpoints
    await tester.testEndpoint('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Test location search (with different query lengths)
    await tester.testEndpoint('/api/locations/search', 'POST', { query: 'Paris' });
    await tester.testEndpoint('/api/locations/search', 'POST', { query: 'New York City Metropolitan Area' });
    
    // Test with invalid data
    await tester.testEndpoint('/api/locations/search', 'POST', { query: '' });
    await tester.testEndpoint('/api/locations/search', 'POST', { query: 'a'.repeat(1000) });
    
    // Run load test on main search endpoint
    await tester.runLoadTest('/api/locations/search', 'POST', { query: 'Paris' }, 5, 10000);
    
    // Generate final report
    tester.generateReport();
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = PerformanceTester;
