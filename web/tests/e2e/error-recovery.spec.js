import { test, expect } from '@playwright/test';

const testUser = {
  email: 'error.recovery.test@example.com',
  password: 'TestPassword123!'
};

test.describe('Error Recovery Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as business owner
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('Payment failure scenarios and recovery', async ({ page }) => {
    // Mock payment failure
    await page.route('**/api/payments/process', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Payment declined',
          code: 'CARD_DECLINED',
          message: 'Your card was declined. Please try a different payment method.'
        })
      });
    });

    // Navigate to payments
    await page.goto('/payments');
    
    // Try to make payment
    await page.click('[data-testid="pay-now-button"]:first-child');
    await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
    
    // Fill payment details
    await page.selectOption('[data-testid="payment-method-select"]', 'credit_card');
    await page.fill('[data-testid="card-number-input"]', '4111111111111111');
    await page.fill('[data-testid="card-expiry-input"]', '12/25');
    await page.fill('[data-testid="card-cvc-input"]', '123');
    await page.click('[data-testid="confirm-payment-button"]');
    
    // Should show payment recovery flow
    await expect(page.locator('[data-testid="payment-recovery-modal"]')).toBeVisible();
    await expect(page.locator('text=Payment Failed')).toBeVisible();
    await expect(page.locator('text=Your card was declined')).toBeVisible();
    
    // Test error analysis
    await expect(page.locator('[data-testid="error-category"]')).toContainText('card_declined');
    await expect(page.locator('[data-testid="recommended-options"]')).toBeVisible();
    
    // Test alternative payment methods
    await expect(page.locator('[data-testid="alternative-card-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="bank-transfer-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-money-option"]')).toBeVisible();
    
    // Test mobile money recovery
    await page.click('[data-testid="mobile-money-option"]');
    await expect(page.locator('[data-testid="mobile-money-form"]')).toBeVisible();
    
    // Fill mobile money details
    await page.fill('[data-testid="mobile-number-input"]', '09123456789');
    await page.selectOption('[data-testid="mobile-wallet-select"]', 'gcash');
    
    // Process mobile money payment
    await page.click('[data-testid="process-mobile-payment"]');
    await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
    
    // Mock successful mobile money payment
    await page.unroute('**/api/payments/process');
    await page.route('**/api/payments/process', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true,
          transactionId: 'TXN-123456',
          amount: 5000,
          method: 'mobile_money'
        })
      });
    });
    
    // Should show payment success
    await page.waitForSelector('[data-testid="payment-success"]');
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-receipt"]')).toBeVisible();
    
    // Test payment retry with same method
    await page.unroute('**/api/payments/process');
    await page.route('**/api/payments/process', (route) => {
      // First call fails, second succeeds
      const callCount = route.request().url().includes('retry') ? 1 : 0;
      if (callCount === 0) {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary network error' })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });
    
    // Try another payment
    await page.goto('/payments');
    await page.click('[data-testid="pay-now-button"]:nth-child(2)');
    await page.click('[data-testid="confirm-payment-button"]');
    
    // Should show recovery modal
    await expect(page.locator('[data-testid="payment-recovery-modal"]')).toBeVisible();
    
    // Choose retry same method
    await page.click('[data-testid="retry-same-method"]');
    await expect(page.locator('[data-testid="retry-processing"]')).toBeVisible();
    
    // Should succeed on retry
    await page.waitForSelector('[data-testid="retry-success"]');
    await expect(page.locator('[data-testid="retry-success-message"]')).toBeVisible();
  });

  test('Network interruption handling', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/businesses/**', (route) => {
      route.abort('failed');
    });

    // Try to access business details
    await page.goto('/business/test-business-123');
    
    // Should show network error
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    await expect(page.locator('text=Network Error')).toBeVisible();
    await expect(page.locator('text=Unable to connect to the server')).toBeVisible();
    
    // Test error recovery options
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-support-button"]')).toBeVisible();
    
    // Test retry functionality
    await page.unroute('**/api/businesses/**');
    await page.route('**/api/businesses/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-business-123',
          name: 'Test Business',
          status: 'approved'
        })
      });
    });
    
    await page.click('[data-testid="retry-button"]');
    
    // Should recover and show business details
    await page.waitForSelector('[data-testid="business-details"]');
    await expect(page.locator('[data-testid="business-name"]')).toContainText('Test Business');
    
    // Test progressive network degradation
    await page.route('**/api/**', (route) => {
      // Simulate slow network
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        });
      }, 5000);
    });
    
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
    
    // Should show timeout error after delay
    await page.waitForSelector('[data-testid="timeout-error"]', { timeout: 10000 });
    await expect(page.locator('text=Request timeout')).toBeVisible();
    
    // Test offline mode
    await page.setOffline(true);
    
    // Try to navigate
    await page.goto('/dashboard');
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
    
    // Test reconnection
    await page.setOffline(false);
    
    // Should automatically reconnect
    await page.waitForSelector('[data-testid="reconnected"]');
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
  });

  test('Form submission error recovery', async ({ page }) => {
    // Mock form submission failure
    await page.route('**/api/applications', (route) => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Validation failed',
          errors: {
            businessName: 'Business name is required',
            businessAddress: 'Business address is too short',
            ownerEmail: 'Invalid email format'
          }
        })
      });
    });

    // Navigate to application form
    await page.goto('/application/new');
    
    // Fill form with invalid data
    await page.fill('[data-testid="business-name-input"]', ''); // Empty
    await page.fill('[data-testid="business-address-input"]', '123'); // Too short
    await page.fill('[data-testid="owner-email-input"]', 'invalid-email'); // Invalid format
    
    // Submit form
    await page.click('[data-testid="submit-application-button"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-business-name"]')).toContainText('Business name is required');
    await expect(page.locator('[data-testid="error-business-address"]')).toContainText('Business address is too short');
    await expect(page.locator('[data-testid="error-owner-email"]')).toContainText('Invalid email format');
    
    // Test auto-save functionality
    await page.fill('[data-testid="business-name-input"]', 'Test Business');
    await page.fill('[data-testid="business-address-input"]', '123 Test Street, Test City');
    await page.fill('[data-testid="owner-email-input"]', 'test@example.com');
    
    // Should show auto-save indicator
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toBeVisible();
    
    // Test form recovery after page refresh
    await page.reload();
    
    // Should restore form data
    await expect(page.locator('[data-testid="business-name-input"]')).toHaveValue('Test Business');
    await expect(page.locator('[data-testid="business-address-input"]')).toHaveValue('123 Test Street, Test City');
    await expect(page.locator('[data-testid="owner-email-input"]')).toHaveValue('test@example.com');
    
    // Test successful submission
    await page.unroute('**/api/applications');
    await page.route('**/api/applications', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'app-123',
          status: 'submitted',
          message: 'Application submitted successfully'
        })
      });
    });
    
    // Submit valid form
    await page.click('[data-testid="submit-application-button"]');
    
    // Should show success
    await page.waitForSelector('[data-testid="submission-success"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Test partial submission handling
    await page.unroute('**/api/applications');
    await page.route('**/api/applications', (route) => {
      route.fulfill({
        status: 206,
        contentType: 'application/json',
        body: JSON.stringify({
          partial: true,
          savedFields: ['businessName', 'businessAddress'],
          missingFields: ['ownerEmail', 'ownerPhone']
        })
      });
    });
    
    // Try another submission
    await page.goto('/application/new');
    await page.fill('[data-testid="business-name-input"]', 'Partial Business');
    await page.fill('[data-testid="business-address-input"]', '456 Partial Street');
    await page.click('[data-testid="save-draft-button"]');
    
    // Should show partial save confirmation
    await expect(page.locator('[data-testid="partial-save-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="missing-fields-list"]')).toBeVisible();
  });

  test('Upload failure recovery', async ({ page }) => {
    // Mock upload failure
    await page.route('**/api/upload', (route) => {
      route.fulfill({
        status: 413,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'File too large',
          maxSize: '10MB',
          receivedSize: '15MB'
        })
      });
    });

    // Navigate to document upload
    await page.goto('/documents/upload');
    
    // Try to upload large file
    const fileInput = page.locator('[data-testid="document-upload-input"]');
    await fileInput.setInputFiles('test-files/large-document.pdf');
    
    // Should show upload error
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(page.locator('text=File too large')).toBeVisible();
    
    // Test file compression option
    await expect(page.locator('[data-testid="compress-file-option"]')).toBeVisible();
    await page.click('[data-testid="compress-file-button"]');
    
    // Should show compression progress
    await expect(page.locator('[data-testid="compression-progress"]')).toBeVisible();
    
    // Mock successful compression
    await page.unroute('**/api/upload');
    await page.route('**/api/upload', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          fileId: 'file-123',
          originalSize: '15MB',
          compressedSize: '8MB'
        })
      });
    });
    
    // Should show compression success
    await page.waitForSelector('[data-testid="compression-success"]');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    // Test chunked upload for large files
    await page.unroute('**/api/upload');
    await page.route('**/api/upload', (route) => {
      // Simulate chunked upload
      const chunkNumber = route.request().postData().includes('chunk') ? 1 : 0;
      if (chunkNumber < 3) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            chunk: chunkNumber,
            totalChunks: 3,
            status: 'processing'
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            fileId: 'chunked-file-123'
          })
        });
      }
    });
    
    // Try another upload
    await fileInput.setInputFiles('test-files/another-large-document.pdf');
    
    // Should show chunked upload progress
    await expect(page.locator('[data-testid="chunked-upload-progress"]')).toBeVisible();
    
    // Should complete successfully
    await page.waitForSelector('[data-testid="chunked-upload-complete"]');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    // Test upload pause and resume
    await page.unroute('**/api/upload');
    await page.route('**/api/upload', (route) => {
      // Simulate upload interruption
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Upload interrupted'
        })
      });
    });
    
    // Try upload that gets interrupted
    await fileInput.setInputFiles('test-files/interrupt-document.pdf');
    
    // Should show upload interruption
    await expect(page.locator('[data-testid="upload-interrupted"]')).toBeVisible();
    
    // Test resume option
    await expect(page.locator('[data-testid="resume-upload-button"]')).toBeVisible();
    await page.click('[data-testid="resume-upload-button"]');
    
    // Should show resume progress
    await expect(page.locator('[data-testid="resume-progress"]')).toBeVisible();
  });

  test('Session timeout and recovery', async ({ page }) => {
    // Mock session timeout
    await page.route('**/api/user/session', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Session expired',
          code: 'SESSION_EXPIRED'
        })
      });
    });

    // Navigate to protected page
    await page.goto('/dashboard');
    
    // Should detect session timeout
    await page.waitForSelector('[data-testid="session-timeout-modal"]');
    await expect(page.locator('[data-testid="session-timeout-message"]')).toBeVisible();
    
    // Test session recovery options
    await expect(page.locator('[data-testid="relogin-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-work-button"]')).toBeVisible();
    
    // Test work saving
    await page.click('[data-testid="save-work-button"]');
    await expect(page.locator('[data-testid="work-saving"]')).toBeVisible();
    
    // Mock successful work save
    await page.unroute('**/api/user/session');
    await page.route('**/api/user/session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workSaved: true,
          savedData: {
            formData: {},
            timestamp: new Date().toISOString()
          }
        })
      });
    });
    
    // Should show work saved confirmation
    await page.waitForSelector('[data-testid="work-saved"]');
    await expect(page.locator('[data-testid="work-saved-message"]')).toBeVisible();
    
    // Test relogin
    await page.click('[data-testid="relogin-button"]');
    
    // Should show login modal
    await expect(page.locator('[data-testid="relogin-modal"]')).toBeVisible();
    
    // Fill credentials
    await page.fill('[data-testid="relogin-email"]', testUser.email);
    await page.fill('[data-testid="relogin-password"]', testUser.password);
    await page.click('[data-testid="relogin-submit"]');
    
    // Mock successful relogin
    await page.unroute('**/api/user/session');
    await page.route('**/api/user/session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'user-123',
            email: testUser.email
          }
        })
      });
    });
    
    // Should restore session
    await page.waitForSelector('[data-testid="session-restored"]');
    await expect(page.locator('[data-testid="session-restored-message"]')).toBeVisible();
    
    // Should restore saved work
    await expect(page.locator('[data-testid="work-restored"]')).toBeVisible();
    
    // Test automatic session refresh
    await page.unroute('**/api/user/session');
    await page.route('**/api/user/session', (route) => {
      // Simulate session refresh
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          refreshed: true,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        })
      });
    });
    
    // Should automatically refresh session
    await page.waitForSelector('[data-testid="session-refreshed"]');
    await expect(page.locator('[data-testid="session-refresh-indicator"]')).toBeVisible();
  });

  test('Component error boundary and recovery', async ({ page }) => {
    // Navigate to page with potential component errors
    await page.goto('/dashboard');
    
    // Simulate component error by injecting error
    await page.evaluate(() => {
      throw new Error('Component rendering error');
    });
    
    // Should catch error and show error boundary
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    await expect(page.locator('text=Application Error')).toBeVisible();
    
    // Test error recovery options
    await expect(page.locator('[data-testid="retry-component"]')).toBeVisible();
    await expect(page.locator('[data-testid="reload-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="go-home"]')).toBeVisible();
    
    // Test component retry
    await page.click('[data-testid="retry-component"]');
    
    // Should attempt to recover component
    await expect(page.locator('[data-testid="component-retrying"]')).toBeVisible();
    
    // Test page reload
    await page.click('[data-testid="reload-page"]');
    
    // Should reload page
    await page.waitForSelector('[data-testid="page-reloaded"]');
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    // Test error reporting
    await expect(page.locator('[data-testid="error-report-sent"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-id"]')).toBeVisible();
    
    // Test error details in development
    const isDevelopment = await page.evaluate(() => process.env.NODE_ENV === 'development');
    if (isDevelopment) {
      await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-stack"]')).toBeVisible();
    }
    
    // Test multiple component errors
    await page.evaluate(() => {
      // Simulate multiple component failures
      const components = ['component1', 'component2', 'component3'];
      components.forEach(component => {
        throw new Error(`Error in ${component}`);
      });
    });
    
    // Should handle multiple errors gracefully
    await expect(page.locator('[data-testid="multiple-errors"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-count"]')).toContainText('3');
    
    // Test selective component recovery
    await expect(page.locator('[data-testid="recover-components"]')).toBeVisible();
    await page.check('[data-testid="recover-component-1"]');
    await page.check('[data-testid="recover-component-2"]');
    
    await page.click('[data-testid="recover-selected"]');
    
    // Should recover selected components
    await page.waitForSelector('[data-testid="components-recovered"]');
    await expect(page.locator('[data-testid="recovered-count"]')).toContainText('2');
  });

  test('Cross-browser error handling', async ({ page, browserName }) => {
    // Test browser-specific error handling
    if (browserName === 'chromium') {
      // Test Chrome-specific features
      await page.goto('/dashboard');
      
      // Test Chrome DevTools integration
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Trigger an error
      await page.evaluate(() => {
        console.error('Test error for Chrome');
      });
      
      // Should catch console errors
      await page.waitForTimeout(1000);
      expect(consoleErrors.length).toBeGreaterThan(0);
      
    } else if (browserName === 'webkit') {
      // Test Safari-specific features
      await page.goto('/dashboard');
      
      // Test Safari error handling
      await page.evaluate(() => {
        throw new Error('Safari test error');
      });
      
      // Should handle Safari errors
      await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
      
    } else if (browserName === 'firefox') {
      // Test Firefox-specific features
      await page.goto('/dashboard');
      
      // Test Firefox error handling
      await page.evaluate(() => {
        throw new Error('Firefox test error');
      });
      
      // Should handle Firefox errors
      await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    }
    
    // Test responsive error handling
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Trigger error on mobile
    await page.evaluate(() => {
      throw new Error('Mobile test error');
    });
    
    // Should show mobile-friendly error UI
    await expect(page.locator('[data-testid="mobile-error-boundary"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-error-actions"]')).toBeVisible();
    
    // Test touch-friendly error recovery
    await page.tap('[data-testid="mobile-retry-button"]');
    await expect(page.locator('[data-testid="mobile-recovery"]')).toBeVisible();
  });
});
