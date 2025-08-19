#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 },
      security: { passed: 0, failed: 0, total: 0 },
      accessibility: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description) {
    try {
      this.log(`Running: ${description}`);
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      this.log(`✅ ${description} completed successfully`, 'success');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'error');
      return { success: false, error: error.message, output: error.stdout || error.stderr };
    }
  }

  async runUnitTests() {
    this.log('🧪 Starting Unit Tests...');
    
    try {
      // Install dependencies if needed
      if (!fs.existsSync('node_modules')) {
        this.log('Installing dependencies...');
        await this.runCommand('npm install', 'Dependency installation');
      }

      // Run Jest tests
      const result = await this.runCommand('npm run test:coverage', 'Unit tests with coverage');
      
      if (result.success) {
        this.results.unit.passed = 1;
        this.results.unit.total = 1;
        
        // Parse coverage report
        if (fs.existsSync('coverage/lcov-report/index.html')) {
          this.log('📊 Coverage report generated in coverage/lcov-report/index.html');
        }
      } else {
        this.results.unit.failed = 1;
        this.results.unit.total = 1;
      }
      
    } catch (error) {
      this.log(`Error running unit tests: ${error.message}`, 'error');
      this.results.unit.failed = 1;
      this.results.unit.total = 1;
    }
  }

  async runE2ETests() {
    this.log('🌐 Starting End-to-End Tests...');
    
    try {
      // Check if Playwright is installed
      if (!fs.existsSync('node_modules/.bin/playwright')) {
        this.log('Installing Playwright...');
        await this.runCommand('npx playwright install', 'Playwright installation');
      }

      // Run Playwright tests
      const result = await this.runCommand('npm run test:e2e', 'E2E tests');
      
      if (result.success) {
        this.results.e2e.passed = 1;
        this.results.e2e.total = 1;
        
        // Check for Playwright report
        if (fs.existsSync('playwright-report/index.html')) {
          this.log('📊 E2E test report generated in playwright-report/index.html');
        }
      } else {
        this.results.e2e.failed = 1;
        this.results.e2e.total = 1;
      }
      
    } catch (error) {
      this.log(`Error running E2E tests: ${error.message}`, 'error');
      this.results.e2e.failed = 1;
      this.results.e2e.total = 1;
    }
  }

  async runPerformanceTests() {
    this.log('🚀 Starting Performance Tests...');
    
    try {
      const result = await this.runCommand('node scripts/performance-test.js', 'Performance tests');
      
      if (result.success) {
        this.results.performance.passed = 1;
        this.results.performance.total = 1;
        this.log('📊 Performance test results displayed above');
      } else {
        this.results.performance.failed = 1;
        this.results.performance.total = 1;
      }
      
    } catch (error) {
      this.log(`Error running performance tests: ${error.message}`, 'error');
      this.results.performance.failed = 1;
      this.results.performance.total = 1;
    }
  }

  async runSecurityTests() {
    this.log('🔒 Starting Security Tests...');
    
    try {
      const result = await this.runCommand('node scripts/security-test.js', 'Security tests');
      
      if (result.success) {
        this.results.security.passed = 1;
        this.results.security.total = 1;
        
        // Check for security report
        if (fs.existsSync('security-report.json')) {
          this.log('📊 Security report saved to security-report.json');
        }
      } else {
        this.results.security.failed = 1;
        this.results.security.total = 1;
      }
      
    } catch (error) {
      this.log(`Error running security tests: ${error.message}`, 'error');
      this.results.security.failed = 1;
      this.results.security.total = 1;
    }
  }

  async runAccessibilityTests() {
    this.log('♿ Starting Accessibility Tests...');
    
    try {
      const result = await this.runCommand('node scripts/accessibility-test.js', 'Accessibility tests');
      
      if (result.success) {
        this.results.accessibility.passed = 1;
        this.results.accessibility.total = 1;
        
        // Check for accessibility report
        if (fs.existsSync('accessibility-report.json')) {
          this.log('📊 Accessibility report saved to accessibility-report.json');
        }
      } else {
        this.results.accessibility.failed = 1;
        this.results.accessibility.total = 1;
      }
      
    } catch (error) {
      this.log(`Error running accessibility tests: ${error.message}`, 'error');
      this.results.accessibility.failed = 1;
      this.results.accessibility.total = 1;
    }
  }

  async runBuildCheck() {
    this.log('🔨 Running build check...');
    
    try {
      const result = await this.runCommand('npm run build', 'Production build');
      
      if (result.success) {
        this.log('✅ Build successful - no compilation errors', 'success');
      } else {
        this.log('❌ Build failed - check compilation errors above', 'error');
      }
      
      return result.success;
    } catch (error) {
      this.log(`Error during build: ${error.message}`, 'error');
      return false;
    }
  }

  async runLinting() {
    this.log('🔍 Running linting check...');
    
    try {
      const result = await this.runCommand('npm run lint', 'ESLint check');
      
      if (result.success) {
        this.log('✅ Linting passed - no code style issues', 'success');
      } else {
        this.log('⚠️ Linting issues found - check output above', 'warning');
      }
      
      return result.success;
    } catch (error) {
      this.log(`Error during linting: ${error.message}`, 'error');
      return false;
    }
  }

  generateSummaryReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE TEST SUMMARY REPORT');
    console.log('='.repeat(60));
    
    // Test Results Summary
    console.log('\n🧪 TEST RESULTS:');
    console.log('─'.repeat(40));
    
    Object.entries(this.results).forEach(([testType, result]) => {
      const status = result.failed > 0 ? '❌' : result.passed > 0 ? '✅' : '⚠️';
      const typeName = testType.charAt(0).toUpperCase() + testType.slice(1);
      console.log(`${status} ${typeName}: ${result.passed}/${result.total} passed`);
    });
    
    // Overall Status
    const totalTests = Object.values(this.results).reduce((sum, r) => sum + r.total, 0);
    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, r) => sum + r.failed, 0);
    
    console.log('\n📊 OVERALL STATUS:');
    console.log('─'.repeat(40));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} ✅`);
    console.log(`Failed: ${totalFailed} ❌`);
    console.log(`Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
    console.log(`Duration: ${duration}s`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(40));
    
    if (totalFailed === 0) {
      console.log('🎉 All tests passed! Your application is ready for production.');
    } else {
      console.log('🔧 Some tests failed. Please review the issues above and fix them.');
      
      if (this.results.unit.failed > 0) {
        console.log('   • Fix unit test failures before proceeding');
      }
      if (this.results.security.failed > 0) {
        console.log('   • Address security vulnerabilities immediately');
      }
      if (this.results.accessibility.failed > 0) {
        console.log('   • Fix accessibility issues for better user experience');
      }
    }
    
    // Next Steps
    console.log('\n🚀 NEXT STEPS:');
    console.log('─'.repeat(40));
    console.log('1. Review any failed tests above');
    console.log('2. Check generated reports in the project directory');
    console.log('3. Fix issues and re-run tests');
    console.log('4. Consider setting up CI/CD pipeline for automated testing');
    console.log('5. Schedule regular security and accessibility audits');
    
    // Save comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      duration: duration,
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0
      },
      results: this.results,
      recommendations: totalFailed === 0 ? 'All tests passed - ready for production' : 'Review and fix failed tests'
    };
    
    fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to comprehensive-test-report.json');
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Test Suite for Vakay Trip Planner');
    this.log('='.repeat(60));
    
    try {
      // Pre-flight checks
      await this.runBuildCheck();
      await this.runLinting();
      
      // Run all test types
      await this.runUnitTests();
      await this.runE2ETests();
      await this.runPerformanceTests();
      await this.runSecurityTests();
      await this.runAccessibilityTests();
      
      // Generate final report
      this.generateSummaryReport();
      
    } catch (error) {
      this.log(`❌ Test suite execution failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run all tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests();
}

module.exports = TestRunner;
