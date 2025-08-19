#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

class AccessibilityTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.issues = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set viewport for testing
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  addIssue(severity, category, description, element = null, page = '') {
    this.issues.push({
      severity,
      category,
      description,
      element,
      page,
      timestamp: new Date().toISOString()
    });
  }

  async testPage(url, pageName) {
    console.log(`\n🔍 Testing accessibility for: ${pageName}`);
    console.log(`   URL: ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run accessibility tests
      await this.testKeyboardNavigation();
      await this.testColorContrast();
      await this.testSemanticHTML();
      await this.testImages();
      await this.testForms();
      await this.testHeadings();
      await this.testLinks();
      await this.testButtons();
      await this.testARIA();
      
    } catch (error) {
      console.log(`   ❌ Error testing ${pageName}: ${error.message}`);
    }
  }

  async testKeyboardNavigation() {
    console.log('   ⌨️  Testing keyboard navigation...');
    
    try {
      // Test tab navigation
      await this.page.keyboard.press('Tab');
      let focusedElement = await this.page.evaluate(() => document.activeElement);
      
      if (!focusedElement) {
        this.addIssue('HIGH', 'Keyboard Navigation', 'No focusable elements found', null, this.page.url());
        return;
      }

      // Test tab order
      const tabOrder = [];
      let tabCount = 0;
      const maxTabs = 50; // Prevent infinite loops
      
      while (tabCount < maxTabs) {
        const tagName = await this.page.evaluate(el => el.tagName, focusedElement);
        const text = await this.page.evaluate(el => el.textContent?.trim() || '', focusedElement);
        const type = await this.page.evaluate(el => el.type || '', focusedElement);
        
        tabOrder.push({
          tag: tagName,
          text: text.substring(0, 50),
          type: type
        });
        
        await this.page.keyboard.press('Tab');
        focusedElement = await this.page.evaluate(() => document.activeElement);
        
        // Check if we've looped back to the beginning
        if (tabOrder.length > 1 && tabOrder[0].tag === tabOrder[tabOrder.length - 1].tag) {
          break;
        }
        
        tabCount++;
      }
      
      // Check for focus indicators
      const focusStyles = await this.page.evaluate(() => {
        const style = window.getComputedStyle(document.activeElement);
        return {
          outline: style.outline,
          border: style.border,
          boxShadow: style.boxShadow
        };
      });
      
      if (focusStyles.outline === 'none' && focusStyles.border === 'none' && focusStyles.boxShadow === 'none') {
        this.addIssue('MEDIUM', 'Keyboard Navigation', 'No visible focus indicator', null, this.page.url());
      }
      
      console.log(`   ✅ Tab navigation: ${tabOrder.length} focusable elements`);
      
    } catch (error) {
      console.log(`   ⚠️  Error testing keyboard navigation: ${error.message}`);
    }
  }

  async testColorContrast() {
    console.log('   🎨 Testing color contrast...');
    
    try {
      // This is a simplified contrast test - in production you'd use a proper contrast checker
      const textElements = await this.page.$$('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label');
      
      for (let i = 0; i < Math.min(textElements.length, 10); i++) {
        const element = textElements[i];
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const styles = await this.page.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
              color: style.color,
              backgroundColor: style.backgroundColor,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight
            };
          }, element);
          
          // Basic contrast check (simplified)
          if (styles.color === 'rgb(0, 0, 0)' && styles.backgroundColor === 'rgb(255, 255, 255)') {
            // Black text on white background - good contrast
          } else if (styles.color === 'rgb(255, 255, 255)' && styles.backgroundColor === 'rgb(0, 0, 0)') {
            // White text on black background - good contrast
          } else {
            // Other color combinations - flag for manual review
            this.addIssue('LOW', 'Color Contrast', 'Color combination needs manual contrast verification', 
              await element.evaluate(el => el.outerHTML), this.page.url());
          }
        }
      }
      
      console.log('   ✅ Color contrast check completed');
      
    } catch (error) {
      console.log(`   ⚠️  Error testing color contrast: ${error.message}`);
    }
  }

  async testSemanticHTML() {
    console.log('   🏗️  Testing semantic HTML...');
    
    try {
      // Check for proper heading hierarchy
      const headings = await this.page.$$('h1, h2, h3, h4, h5, h6');
      const headingLevels = [];
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.charAt(1));
        const text = await heading.evaluate(el => el.textContent?.trim() || '');
        headingLevels.push({ level, text });
      }
      
      // Check for proper heading hierarchy
      let previousLevel = 0;
      for (const heading of headingLevels) {
        if (heading.level > previousLevel + 1) {
          this.addIssue('MEDIUM', 'Semantic HTML', 
            `Heading hierarchy skipped: h${previousLevel} to h${heading.level}`, 
            heading.text, this.page.url());
        }
        previousLevel = heading.level;
      }
      
      // Check for multiple h1 elements
      const h1Count = headingLevels.filter(h => h.level === 1).length;
      if (h1Count > 1) {
        this.addIssue('MEDIUM', 'Semantic HTML', 
          `Multiple h1 elements found (${h1Count})`, null, this.page.url());
      }
      
      // Check for proper form labels
      const inputs = await this.page.$$('input, select, textarea');
      for (const input of inputs) {
        const hasLabel = await input.evaluate(el => {
          const id = el.id;
          if (id) {
            return !!document.querySelector(`label[for="${id}"]`);
          }
          return !!el.closest('label');
        });
        
        if (!hasLabel) {
          const type = await input.evaluate(el => el.type || 'input');
          this.addIssue('HIGH', 'Semantic HTML', 
            `Input element without label: ${type}`, 
            await input.evaluate(el => el.outerHTML), this.page.url());
        }
      }
      
      console.log(`   ✅ Semantic HTML: ${headings.length} headings, ${inputs.length} inputs checked`);
      
    } catch (error) {
      console.log(`   ⚠️  Error testing semantic HTML: ${error.message}`);
    }
  }

  async testImages() {
    console.log('   🖼️  Testing image accessibility...');
    
    try {
      const images = await this.page.$$('img');
      
      for (const image of images) {
        const alt = await image.evaluate(el => el.alt);
        const src = await image.evaluate(el => el.src);
        const isDecorative = await image.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || style.visibility === 'hidden';
        });
        
        if (!alt && !isDecorative) {
          this.addIssue('HIGH', 'Images', 
            'Image missing alt text', 
            await image.evaluate(el => el.outerHTML), this.page.url());
        } else if (alt === '') {
          // Empty alt is fine for decorative images
        } else if (alt && alt.length < 3) {
          this.addIssue('MEDIUM', 'Images', 
            'Alt text too short', 
            await image.evaluate(el => el.outerHTML), this.page.url());
        }
      }
      
      console.log(`   ✅ Images: ${images.length} images checked`);
      
    } catch (error) {
      console.log(`   ⚠️  Error testing images: ${error.message}`);
    }
  }

  async testForms() {
    console.log('   📝 Testing form accessibility...');
    
    try {
      const forms = await this.page.$$('form');
      
      for (const form of forms) {
        // Check for form labels
        const inputs = await form.$$('input, select, textarea');
        let hasErrors = false;
        
        for (const input of inputs) {
          const isRequired = await input.evaluate(el => el.required);
          const hasLabel = await input.evaluate(el => {
            const id = el.id;
            if (id) {
              return !!document.querySelector(`label[for="${id}"]`);
            }
            return !!el.closest('label');
          });
          
          if (isRequired && !hasLabel) {
            this.addIssue('HIGH', 'Forms', 
              'Required input without label', 
              await input.evaluate(el => el.outerHTML), this.page.url());
            hasErrors = true;
          }
        }
        
        // Check for error handling
        const errorMessages = await form.$$('.error, .error-message, [role="alert"]');
        if (errorMessages.length === 0) {
          // This might be fine, but flag for review
          this.addIssue('LOW', 'Forms', 
            'Form may lack error handling', 
            await form.evaluate(el => el.outerHTML), this.page.url());
        }
      }
      
      console.log(`   ✅ Forms: ${forms.length} forms checked`);
      
    } catch (error) {
      console.log(`   ⚠️  Error testing forms: ${error.message}`);
    }
  }

  async testHeadings() {
    console.log('   📚 Testing heading structure...');
    
    try {
      const headings = await this.page.$$('h1, h2, h3, h4, h5, h6');
      const headingStructure = [];
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const text = await heading.evaluate(el => el.textContent?.trim() || '');
        const level = parseInt(tagName.charAt(1));
        
        headingStructure.push({ level, text, tagName });
      }
      
      // Check for proper heading hierarchy
      let previousLevel = 0;
      for (const heading of headingStructure) {
        if (heading.level > previousLevel + 1) {
          this.addIssue('MEDIUM', 'Headings', 
            `Heading level skipped: ${heading.tagName} after h${previousLevel}`, 
            heading.text, this.page.url());
        }
        previousLevel = heading.level;
      }
      
      // Check for empty headings
      for (const heading of headingStructure) {
        if (!heading.text || heading.text.length < 2) {
          this.addIssue('MEDIUM', 'Headings', 
            'Empty or very short heading', 
            heading.tagName, this.page.url());
        }
      }
      
      console.log(`   ✅ Headings: ${headings.length} headings analyzed`);
      
    } catch (error) {
      console.log(`   ⚠️  Error testing headings: ${error.message}`);
    }
  }

  async testLinks() {
    console.log('   🔗 Testing link accessibility...');
    
    try {
      const links = await this.page.$$('a');
      
      for (const link of links) {
        const href = await link.evaluate(el => el.href);
        const text = await link.evaluate(el => el.textContent?.trim() || '');
        const ariaLabel = await link.evaluate(el => el.getAttribute('aria-label'));
        const title = await link.evaluate(el => el.title);
        
        // Check for empty links
        if (!text && !ariaLabel && !title) {
          this.addIssue('HIGH', 'Links', 
            'Link without accessible text', 
            await link.evaluate(el => el.outerHTML), this.page.url());
        }
        
        // Check for generic link text
        const genericTexts = ['click here', 'read more', 'learn more', 'here', 'this', 'link'];
        if (genericTexts.some(generic => text.toLowerCase().includes(generic))) {
          this.addIssue('LOW', 'Links', 
            'Generic link text detected', 
            text, this.page.url());
        }
        
        // Check for broken links (basic check)
        if (href && href.startsWith('http') && !href.includes('localhost')) {
          // External links - could add actual link checking here
        }
      }
      
      console.log(`   ✅ Links: ${links.length} links checked`);
      
    } catch (error) {
      console.log(`   ⚠️  Error testing links: ${error.message}`);
    }
  }

  async testButtons() {
    console.log('   🔘 Testing button accessibility...');
    
    try {
      const buttons = await this.page.$$('button, [role="button"]');
      
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent?.trim() || '');
        const ariaLabel = await button.evaluate(el => el.getAttribute('aria-label'));
        const title = await button.evaluate(el => el.title);
        const type = await button.evaluate(el => el.type || 'button');
        
        // Check for empty buttons
        if (!text && !ariaLabel && !title) {
          this.addIssue('HIGH', 'Buttons', 
            'Button without accessible text', 
            await button.evaluate(el => el.outerHTML), this.page.url());
        }
        
        // Check for generic button text
        const genericTexts = ['click', 'submit', 'button', 'ok', 'yes', 'no'];
        if (genericTexts.some(generic => text.toLowerCase().includes(generic))) {
          this.addIssue('LOW', 'Buttons', 
            'Generic button text detected', 
            text, this.page.url());
        }
      }
      
      console.log(`   ✅ Buttons: ${buttons.length} buttons checked`);
      
    } catch (error) {
      console.log(`   ⚠️  Error testing buttons: ${error.message}`);
    }
  }

  async testARIA() {
    console.log('   ♿ Testing ARIA attributes...');
    
    try {
      // Check for proper ARIA usage
      const ariaElements = await this.page.$$('[aria-*]');
      
      for (const element of ariaElements) {
        const ariaAttributes = await element.evaluate(el => {
          const attrs = {};
          for (const attr of el.attributes) {
            if (attr.name.startsWith('aria-')) {
              attrs[attr.name] = attr.value;
            }
          }
          return attrs;
        });
        
        // Check for invalid ARIA values
        for (const [attr, value] of Object.entries(ariaAttributes)) {
          if (attr === 'aria-label' && (!value || value.trim() === '')) {
            this.addIssue('HIGH', 'ARIA', 
              'Empty aria-label attribute', 
              await element.evaluate(el => el.outerHTML), this.page.url());
          }
          
          if (attr === 'aria-required' && !['true', 'false'].includes(value)) {
            this.addIssue('MEDIUM', 'ARIA', 
              'Invalid aria-required value', 
              `${attr}="${value}"`, this.page.url());
          }
        }
      }
      
      // Check for missing ARIA where it might be needed
      const interactiveElements = await this.page.$$('button, a, input, select, textarea');
      for (const element of interactiveElements) {
        const hasAria = await element.evaluate(el => {
          return el.hasAttribute('aria-label') || 
                 el.hasAttribute('aria-labelledby') || 
                 el.hasAttribute('aria-describedby');
        });
        
        const hasText = await element.evaluate(el => {
          return el.textContent?.trim() || el.alt || el.placeholder;
        });
        
        if (!hasAria && !hasText) {
          this.addIssue('MEDIUM', 'ARIA', 
            'Interactive element may need ARIA labels', 
            await element.evaluate(el => el.outerHTML), this.page.url());
        }
      }
      
      console.log(`   ✅ ARIA: ${ariaElements.length} ARIA elements checked`);
      
    } catch (error) {
      console.log(`   ⚠️  Error testing ARIA: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('♿ Starting Accessibility Tests for Vakay Trip Planner');
    console.log('==================================================');
    
    try {
      await this.init();
      
      // Test main pages
      const testPages = [
        { url: '/', name: 'Homepage' },
        { url: '/dashboard', name: 'Dashboard' },
        { url: '/trip/new', name: 'Create Trip' }
      ];
      
      for (const page of testPages) {
        await this.testPage(this.baseUrl + page.url, page.name);
      }
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Accessibility test failed:', error);
    } finally {
      await this.close();
    }
  }

  generateReport() {
    console.log('\n📋 Accessibility Test Report');
    console.log('============================');
    
    if (this.issues.length === 0) {
      console.log('✅ No accessibility issues found!');
      return;
    }

    // Group by severity
    const high = this.issues.filter(i => i.severity === 'HIGH');
    const medium = this.issues.filter(i => i.severity === 'MEDIUM');
    const low = this.issues.filter(i => i.severity === 'LOW');

    console.log(`\n🔴 High Priority: ${high.length}`);
    high.forEach(issue => {
      console.log(`   • ${issue.description}`);
      if (issue.element) console.log(`     Element: ${issue.element.substring(0, 100)}...`);
      if (issue.page) console.log(`     Page: ${issue.page}`);
    });

    console.log(`\n🟡 Medium Priority: ${medium.length}`);
    medium.forEach(issue => {
      console.log(`   • ${issue.description}`);
      if (issue.element) console.log(`     Element: ${issue.element.substring(0, 100)}...`);
      if (issue.page) console.log(`     Page: ${issue.page}`);
    });

    console.log(`\n🟢 Low Priority: ${low.length}`);
    low.forEach(issue => {
      console.log(`   • ${issue.description}`);
      if (issue.element) console.log(`     Element: ${issue.element.substring(0, 100)}...`);
      if (issue.page) console.log(`     Page: ${issue.page}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total Issues: ${this.issues.length}`);
    console.log(`   High: ${high.length}`);
    console.log(`   Medium: ${medium.length}`);
    console.log(`   Low: ${low.length}`);

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.issues.length,
        high: high.length,
        medium: medium.length,
        low: low.length
      },
      issues: this.issues
    };

    fs.writeFileSync('accessibility-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to accessibility-report.json');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AccessibilityTester();
  tester.runAllTests();
}

module.exports = AccessibilityTester;
