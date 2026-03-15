import { test, expect } from '@playwright/test';

// Test data
const testBusiness = {
  name: 'Test Restaurant E2E',
  type: 'Restaurant',
  address: '123 Test Street, Test City',
  ownerName: 'John Doe',
  ownerEmail: 'john.doe.test@example.com',
  ownerPhone: '09123456789'
};

const testUser = {
  email: 'business.owner.test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Owner'
};

test.describe('Business Owner Journey Tests', () => {
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

  test('Complete application submission flow', async ({ page }) => {
    // Start new application
    await page.click('[data-testid="new-application-button"]');
    await page.waitForURL('/application/new');
    
    // Fill business information
    await page.fill('[data-testid="business-name-input"]', testBusiness.name);
    await page.selectOption('[data-testid="business-type-select"]', testBusiness.type);
    await page.fill('[data-testid="business-address-input"]', testBusiness.address);
    
    // Fill owner information
    await page.fill('[data-testid="owner-name-input"]', testBusiness.ownerName);
    await page.fill('[data-testid="owner-email-input"]', testBusiness.ownerEmail);
    await page.fill('[data-testid="owner-phone-input"]', testBusiness.ownerPhone);
    
    // Upload required documents
    const fileInput = page.locator('[data-testid="document-upload-input"]');
    await fileInput.setInputFiles('test-files/business-permit.pdf');
    
    // Submit application
    await page.click('[data-testid="submit-application-button"]');
    
    // Verify submission success
    await expect(page.locator('[data-testid="submission-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-id"]')).toBeVisible();
    
    // Check application status
    await page.goto('/applications');
    await expect(page.locator(`text=${testBusiness.name}`)).toBeVisible();
    await expect(page.locator('[data-testid="status-submitted"]')).toBeVisible();
  });

  test('First-time approval experience with Approval Transition Bridge', async ({ page }) => {
    // Mock approved business status
    await page.route('**/api/business/applications/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-business-123',
          businessName: testBusiness.name,
          applicationStatus: 'approved',
          hasSeenOnboarding: false
        })
      });
    });
    
    // Navigate to business dashboard
    await page.goto('/business/test-business-123');
    
    // Should show Approval Transition Bridge
    await expect(page.locator('[data-testid="approval-bridge-modal"]')).toBeVisible();
    await expect(page.locator('text=Welcome to Your Business Dashboard!')).toBeVisible();
    
    // Complete onboarding steps
    await page.click('[data-testid="onboarding-next-button"]');
    await expect(page.locator('text=Download Your Permit')).toBeVisible();
    
    await page.click('[data-testid="download-permit-button"]');
    await expect(page.locator('[data-testid="download-permit-button"] >> text=✓ Downloaded')).toBeVisible();
    
    await page.click('[data-testid="onboarding-next-button"]');
    await expect(page.locator('text=Schedule First Inspection')).toBeVisible();
    
    await page.click('[data-testid="schedule-inspection-button"]');
    await expect(page.locator('[data-testid="schedule-inspection-button"] >> text=✓ Scheduled')).toBeVisible();
    
    await page.click('[data-testid="onboarding-next-button"]');
    await expect(page.locator('text=Set Up Payment Methods')).toBeVisible();
    
    await page.click('[data-testid="setup-payments-button"]');
    await expect(page.locator('[data-testid="setup-payments-button"] >> text=✓ Set Up')).toBeVisible();
    
    await page.click('[data-testid="onboarding-next-button"]');
    await expect(page.locator('text=Enable Notifications')).toBeVisible();
    
    await page.click('[data-testid="enable-notifications-button"]');
    await expect(page.locator('[data-testid="enable-notifications-button"] >> text=✓ Enabled')).toBeVisible();
    
    // Complete onboarding
    await page.click('[data-testid="onboarding-complete-button"]');
    
    // Should show business dashboard
    await expect(page.locator('[data-testid="business-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-approved"]')).toBeVisible();
  });

  test('Multi-business management workflow', async ({ page }) => {
    // Navigate to portfolio dashboard
    await page.goto('/portfolio');
    
    // Should see portfolio overview
    await expect(page.locator('[data-testid="portfolio-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-businesses-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-businesses-stat"]')).toBeVisible();
    
    // Test search functionality
    await page.fill('[data-testid="business-search-input"]', 'Restaurant');
    await page.waitForTimeout(1000);
    
    // Should filter results
    const searchResults = page.locator('[data-testid="business-card"]');
    await expect(searchResults.first()).toBeVisible();
    
    // Test status filtering
    await page.selectOption('[data-testid="status-filter"]', 'approved');
    await page.waitForTimeout(1000);
    
    // Should show only approved businesses
    const approvedBusinesses = page.locator('[data-testid="business-card"][data-status="approved"]');
    await expect(approvedBusinesses.first()).toBeVisible();
    
    // Test bulk operations
    await page.check('[data-testid="business-checkbox"]:first-child');
    await page.check('[data-testid="business-checkbox"]:nth-child(2)');
    
    // Should show bulk actions
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="bulk-renew-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="bulk-export-button"]')).toBeVisible();
    
    // Test analytics view
    await page.click('[data-testid="analytics-tab"]');
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="business-performance-table"]')).toBeVisible();
  });

  test('Payment and renewal workflows', async ({ page }) => {
    // Navigate to payments
    await page.goto('/payments');
    
    // Should show payment dashboard
    await expect(page.locator('[data-testid="payments-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-payments"]')).toBeVisible();
    
    // Test payment flow
    await page.click('[data-testid="pay-now-button"]:first-child');
    
    // Should show payment modal
    await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();
    
    // Select payment method
    await page.selectOption('[data-testid="payment-method-select"]', 'credit_card');
    
    // Fill payment details
    await page.fill('[data-testid="card-number-input"]', '4111111111111111');
    await page.fill('[data-testid="card-expiry-input"]', '12/25');
    await page.fill('[data-testid="card-cvc-input"]', '123');
    
    // Submit payment
    await page.click('[data-testid="confirm-payment-button"]');
    
    // Should show payment success
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
    
    // Test renewal workflow
    await page.goto('/renewals');
    await expect(page.locator('[data-testid="renewals-title"]')).toBeVisible();
    
    // Start renewal
    await page.click('[data-testid="renew-business-button"]:first-child');
    
    // Should show renewal form
    await expect(page.locator('[data-testid="renewal-form"]')).toBeVisible();
    
    // Submit renewal
    await page.click('[data-testid="submit-renewal-button"]');
    
    // Should show renewal confirmation
    await expect(page.locator('[data-testid="renewal-confirmation"]')).toBeVisible();
  });

  test('Error recovery scenarios', async ({ page }) => {
    // Test network error during form submission
    await page.route('**/api/applications', (route) => {
      route.abort('failed');
    });
    
    // Try to submit application
    await page.goto('/application/new');
    await page.fill('[data-testid="business-name-input"]', testBusiness.name);
    await page.click('[data-testid="submit-application-button"]');
    
    // Should show error recovery modal
    await expect(page.locator('[data-testid="error-recovery-modal"]')).toBeVisible();
    await expect(page.locator('text=Network Error')).toBeVisible();
    
    // Test retry option
    await page.click('[data-testid="retry-same-method"]');
    await expect(page.locator('[data-testid="recovery-processing"]')).toBeVisible();
    
    // Test alternative method
    await page.click('[data-testid="try-alternative-method"]');
    await expect(page.locator('[data-testid="alternative-methods"]')).toBeVisible();
    
    // Test payment failure recovery
    await page.unroute('**/api/applications');
    await page.route('**/api/payments', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment declined' })
      });
    });
    
    // Try to make payment
    await page.goto('/payments');
    await page.click('[data-testid="pay-now-button"]:first-child');
    await page.click('[data-testid="confirm-payment-button"]');
    
    // Should show payment recovery flow
    await expect(page.locator('[data-testid="payment-recovery-modal"]')).toBeVisible();
    await expect(page.locator('text=Payment Failed')).toBeVisible();
    
    // Test alternative payment methods
    await expect(page.locator('[data-testid="alternative-card-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="bank-transfer-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-money-option"]')).toBeVisible();
    
    // Select alternative method
    await page.click('[data-testid="mobile-money-option"]');
    await page.fill('[data-testid="mobile-number-input"]', '09123456789');
    await page.click('[data-testid="process-payment-button"]');
    
    // Should show payment processing
    await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
  });

  test('Status system unification', async ({ page }) => {
    // Navigate to business with complex status
    await page.goto('/business/test-business-complex');
    
    // Should show unified status display
    await expect(page.locator('[data-testid="unified-status-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-status"]')).toBeVisible();
    
    // Test status progression
    await expect(page.locator('[data-testid="status-progression"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-timeline"]')).toBeVisible();
    
    // Test status sync
    await page.click('[data-testid="sync-status-button"]');
    await expect(page.locator('[data-testid="sync-loading"]')).toBeVisible();
    
    // Should show updated status
    await expect(page.locator('[data-testid="status-updated"]')).toBeVisible();
    
    // Test conflict resolution
    if (await page.locator('[data-testid="status-conflicts"]').isVisible()) {
      await expect(page.locator('[data-testid="conflict-resolution"]')).toBeVisible();
      await page.click('[data-testid="resolve-conflicts"]');
      await expect(page.locator('[data-testid="conflicts-resolved"]')).toBeVisible();
    }
  });

  test('Mobile responsiveness and touch interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Should show mobile layout
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    
    // Test touch interactions
    await page.tap('[data-testid="business-card"]:first-child');
    await expect(page.locator('[data-testid="business-details"]')).toBeVisible();
    
    // Test mobile forms
    await page.goto('/application/new');
    await page.fill('[data-testid="business-name-input"]', testBusiness.name);
    
    // Test mobile file upload
    await page.click('[data-testid="mobile-upload-button"]');
    await expect(page.locator('[data-testid="mobile-upload-options"]')).toBeVisible();
    
    // Test mobile payment flow
    await page.goto('/payments');
    await page.click('[data-testid="pay-now-button"]:first-child');
    await expect(page.locator('[data-testid="mobile-payment-modal"]')).toBeVisible();
  });

  test('Performance and loading states', async ({ page }) => {
    // Monitor performance
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    
    // Should show loading states
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="dashboard-content"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(5000);
    
    // Test lazy loading
    await page.goto('/portfolio');
    await page.scroll('[data-testid="business-list"]', 0, 1000);
    
    // Should load more items
    await expect(page.locator('[data-testid="loading-more"]')).toBeVisible();
    await page.waitForSelector('[data-testid="business-card"]:nth-child(10)');
  });

  test('Accessibility and keyboard navigation', async ({ page }) => {
    // Test keyboard navigation
    await page.goto('/dashboard');
    
    // Tab through interface
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test ARIA labels
    await expect(page.locator('[aria-label="Business Dashboard"]')).toBeVisible();
    
    // Test screen reader compatibility
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
    
    // Test form accessibility
    await page.goto('/application/new');
    await expect(page.locator('[data-testid="business-name-input"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="business-name-input"]')).toHaveAttribute('required');
  });
});
