import { test, expect } from '@playwright/test';

// Test data for multiple businesses
const testBusinesses = [
  {
    name: 'Test Restaurant',
    type: 'Restaurant',
    status: 'approved',
    permitNumber: 'PERMIT-REST-001',
    annualRevenue: 1200000,
    employees: 15
  },
  {
    name: 'Test Retail Store',
    type: 'Retail',
    status: 'active',
    permitNumber: 'PERMIT-RET-002',
    annualRevenue: 800000,
    employees: 8
  },
  {
    name: 'Test Service Center',
    type: 'Service',
    status: 'pending',
    permitNumber: 'PERMIT-SVC-003',
    annualRevenue: 600000,
    employees: 5
  },
  {
    name: 'Test Online Shop',
    type: 'E-commerce',
    status: 'expired',
    permitNumber: 'PERMIT-ECO-004',
    annualRevenue: 400000,
    employees: 3
  },
  {
    name: 'Test Manufacturing',
    type: 'Manufacturing',
    status: 'suspended',
    permitNumber: 'PERMIT-MFG-005',
    annualRevenue: 2000000,
    employees: 25
  }
];

const testUser = {
  email: 'multi.business.test@example.com',
  password: 'TestPassword123!'
};

test.describe('Multi-Business Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as multi-business owner
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('Portfolio overview with multiple businesses', async ({ page }) => {
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Should show all businesses
    await expect(page.locator('[data-testid="portfolio-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-businesses-stat"]')).toContainText('5');
    await expect(page.locator('[data-testid="active-businesses-stat"]')).toContainText('2');
    await expect(page.locator('[data-testid="pending-businesses-stat"]')).toContainText('1');
    await expect(page.locator('[data-testid="expired-businesses-stat"]')).toContainText('1');
    await expect(page.locator('[data-testid="suspended-businesses-stat"]')).toContainText('1');
    
    // Should show total revenue
    await expect(page.locator('[data-testid="total-revenue-stat"]')).toContainText('5,000,000');
    
    // Should show business cards
    const businessCards = page.locator('[data-testid="business-card"]');
    await expect(businessCards).toHaveCount(5);
    
    // Verify each business is displayed
    for (const business of testBusinesses) {
      await expect(page.locator(`text=${business.name}`)).toBeVisible();
      await expect(page.locator(`[data-business-name="${business.name}"]`)).toBeVisible();
      await expect(page.locator(`[data-business-status="${business.status}"]`)).toBeVisible();
    }
  });

  test('Business filtering and search functionality', async ({ page }) => {
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Test search by business name
    await page.fill('[data-testid="business-search-input"]', 'Restaurant');
    await page.waitForTimeout(1000);
    
    // Should show only restaurant
    const searchResults = page.locator('[data-testid="business-card"]');
    await expect(searchResults).toHaveCount(1);
    await expect(page.locator('text=Test Restaurant')).toBeVisible();
    await expect(page.locator('text=Test Retail Store')).not.toBeVisible();
    
    // Clear search
    await page.fill('[data-testid="business-search-input"]', '');
    await page.waitForTimeout(1000);
    
    // Should show all businesses again
    await expect(page.locator('[data-testid="business-card"]')).toHaveCount(5);
    
    // Test status filtering
    await page.selectOption('[data-testid="status-filter"]', 'approved');
    await page.waitForTimeout(1000);
    
    // Should show only approved businesses
    const approvedBusinesses = page.locator('[data-testid="business-card"][data-status="approved"]');
    await expect(approvedBusinesses).toHaveCount(1);
    await expect(page.locator('text=Test Restaurant')).toBeVisible();
    
    // Test multiple status filter
    await page.selectOption('[data-testid="status-filter"]', 'active');
    await page.waitForTimeout(1000);
    
    // Should show active businesses
    const activeBusinesses = page.locator('[data-testid="business-card"][data-status="active"]');
    await expect(activeBusinesses).toHaveCount(1);
    await expect(page.locator('text=Test Retail Store')).toBeVisible();
    
    // Test business type filtering
    await page.selectOption('[data-testid="business-type-filter"]', 'Restaurant');
    await page.waitForTimeout(1000);
    
    // Should show only restaurants
    const restaurantBusinesses = page.locator('[data-testid="business-card"][data-type="Restaurant"]');
    await expect(restaurantBusinesses).toHaveCount(1);
  });

  test('Bulk operations on multiple businesses', async ({ page }) => {
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Select multiple businesses
    await page.check('[data-testid="business-checkbox"][data-business="Test Restaurant"]');
    await page.check('[data-testid="business-checkbox"][data-business="Test Retail Store"]');
    await page.check('[data-testid="business-checkbox"][data-business="Test Service Center"]');
    
    // Should show bulk actions
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('3 businesses selected');
    
    // Test bulk renewal
    await page.click('[data-testid="bulk-renew-button"]');
    
    // Should show bulk renewal modal
    await expect(page.locator('[data-testid="bulk-renewal-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="selected-businesses-list"]')).toBeVisible();
    
    // Should show selected businesses
    await expect(page.locator('text=Test Restaurant')).toBeVisible();
    await expect(page.locator('text=Test Retail Store')).toBeVisible();
    await expect(page.locator('text=Test Service Center')).toBeVisible();
    
    // Configure renewal
    await page.selectOption('[data-testid="renewal-period-select"]', 'annual');
    await page.fill('[data-testid="renewal-date-input"]', '2024-12-31');
    await page.check('[data-testid="auto-renew-checkbox"]');
    
    // Process renewal
    await page.click('[data-testid="process-bulk-renewal"]');
    
    // Should show processing
    await expect(page.locator('[data-testid="renewal-processing"]')).toBeVisible();
    await expect(page.locator('[data-testid="renewal-progress"]')).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('[data-testid="renewal-complete"]');
    
    // Should show results
    await expect(page.locator('[data-testid="renewal-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="successful-renewals"]')).toContainText('3');
    
    // Test bulk export
    await page.click('[data-testid="bulk-export-button"]');
    
    // Should show export modal
    await expect(page.locator('[data-testid="bulk-export-modal"]')).toBeVisible();
    
    // Configure export
    await page.selectOption('[data-testid="export-format-select"]', 'excel');
    await page.selectOption('[data-testid="export-data-select"]', 'all');
    await page.fill('[data-testid="export-date-range"]', '2024-01-01 to 2024-12-31');
    
    // Generate export
    await page.click('[data-testid="generate-export"]');
    
    // Should show export progress
    await expect(page.locator('[data-testid="export-processing"]')).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('[data-testid="export-complete"]');
    
    // Should show download link
    await expect(page.locator('[data-testid="download-export"]')).toBeVisible();
  });

  test('Cross-business payments and fee management', async ({ page }) => {
    // Navigate to payments
    await page.goto('/payments');
    
    // Should show payments for all businesses
    await expect(page.locator('[data-testid="payments-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="business-payments-tabs"]')).toBeVisible();
    
    // Test individual business payments
    await page.click('[data-testid="business-tab"][data-business="Test Restaurant"]');
    await expect(page.locator('[data-testid="business-payments"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-payments"]')).toBeVisible();
    
    // Make payment for first business
    await page.click('[data-testid="pay-now-button"]:first-child');
    await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
    
    // Complete payment
    await page.selectOption('[data-testid="payment-method-select"]', 'credit_card');
    await page.click('[data-testid="confirm-payment-button"]');
    
    // Should show payment success
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
    
    // Test cross-business payment
    await page.click('[data-testid="cross-business-payment"]');
    await expect(page.locator('[data-testid="cross-business-modal"]')).toBeVisible();
    
    // Select multiple businesses for payment
    await page.check('[data-testid="payment-business-checkbox"][data-business="Test Retail Store"]');
    await page.check('[data-testid="payment-business-checkbox"][data-business="Test Service Center"]');
    
    // Should show total amount
    await expect(page.locator('[data-testid="total-payment-amount"]')).toBeVisible();
    
    // Process cross-business payment
    await page.click('[data-testid="process-cross-payment"]');
    await expect(page.locator('[data-testid="cross-payment-processing"]')).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('[data-testid="cross-payment-complete"]');
    
    // Should show results
    await expect(page.locator('[data-testid="cross-payment-results"]')).toBeVisible();
  });

  test('Portfolio analytics and reporting', async ({ page }) => {
    // Navigate to portfolio analytics
    await page.goto('/portfolio/analytics');
    
    // Should show analytics dashboard
    await expect(page.locator('[data-testid="analytics-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="business-performance-table"]')).toBeVisible();
    
    // Test revenue trend chart
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await page.click('[data-testid="chart-period-select"]');
    await page.selectOption('[data-testid="chart-period-select"]', 'yearly');
    await page.waitForTimeout(1000);
    
    // Should update chart
    await expect(page.locator('[data-testid="revenue-chart-updated"]')).toBeVisible();
    
    // Test business performance table
    const performanceRows = page.locator('[data-testid="performance-row"]');
    await expect(performanceRows).toHaveCount(5);
    
    // Verify performance data
    await expect(page.locator('[data-business="Test Restaurant"] [data-revenue="1,200,000"]')).toBeVisible();
    await expect(page.locator('[data-business="Test Retail Store"] [data-revenue="800,000"]')).toBeVisible();
    
    // Test business comparison
    await page.click('[data-testid="compare-businesses"]');
    await expect(page.locator('[data-testid="business-comparison"]')).toBeVisible();
    
    // Select businesses to compare
    await page.check('[data-testid="compare-checkbox"][data-business="Test Restaurant"]');
    await page.check('[data-testid="compare-checkbox"][data-business="Test Retail Store"]');
    
    // Should show comparison
    await page.click('[data-testid="generate-comparison"]');
    await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible();
    
    // Test export reports
    await page.click('[data-testid="export-reports"]');
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
    
    // Configure report export
    await page.selectOption('[data-testid="report-type-select"]', 'portfolio_summary');
    await page.selectOption('[data-testid="report-format-select"]', 'pdf');
    await page.fill('[data-testid="report-date-range"]', '2024-01-01 to 2024-12-31');
    
    // Generate report
    await page.click('[data-testid="generate-report"]');
    await expect(page.locator('[data-testid="report-generation"]')).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('[data-testid="report-ready"]');
    
    // Should show download link
    await expect(page.locator('[data-testid="download-report"]')).toBeVisible();
  });

  test('Business status management across portfolio', async ({ page }) => {
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Test status unification
    await page.click('[data-testid="business-card"][data-business="Test Restaurant"]');
    await expect(page.locator('[data-testid="unified-status-display"]')).toBeVisible();
    
    // Should show unified status
    await expect(page.locator('[data-testid="current-status"]')).toContainText('Approved');
    await expect(page.locator('[data-testid="status-progression"]')).toBeVisible();
    
    // Test status conflicts
    await page.click('[data-testid="check-status-conflicts"]');
    await expect(page.locator('[data-testid="conflict-check"]')).toBeVisible();
    
    // If conflicts exist, should show resolution options
    if (await page.locator('[data-testid="status-conflicts"]').isVisible()) {
      await expect(page.locator('[data-testid="conflict-resolution"]')).toBeVisible();
      await page.click('[data-testid="resolve-conflicts"]');
      await expect(page.locator('[data-testid="conflicts-resolved"]')).toBeVisible();
    }
    
    // Test status sync
    await page.click('[data-testid="sync-all-statuses"]');
    await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();
    
    // Wait for sync completion
    await page.waitForSelector('[data-testid="sync-complete"]');
    
    // Should show sync results
    await expect(page.locator('[data-testid="sync-results"]')).toBeVisible();
    
    // Test status history
    await page.click('[data-testid="status-history"]');
    await expect(page.locator('[data-testid="status-timeline"]')).toBeVisible();
    
    // Should show status changes
    await expect(page.locator('[data-testid="status-change-log"]')).toBeVisible();
  });

  test('Compliance management across businesses', async ({ page }) => {
    // Navigate to compliance
    await page.goto('/compliance');
    
    // Should show compliance overview
    await expect(page.locator('[data-testid="compliance-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-dashboard"]')).toBeVisible();
    
    // Test compliance metrics
    await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-inspections"]')).toBeVisible();
    await expect(page.locator('[data-testid="overdue-payments"]')).toBeVisible();
    
    // Test business-specific compliance
    await page.click('[data-testid="business-compliance"][data-business="Test Restaurant"]');
    await expect(page.locator('[data-testid="business-compliance-details"]')).toBeVisible();
    
    // Should show compliance checklist
    await expect(page.locator('[data-testid="compliance-checklist"]')).toBeVisible();
    
    // Test bulk compliance actions
    await page.check('[data-testid="compliance-checkbox"][data-business="Test Restaurant"]');
    await page.check('[data-testid="compliance-checkbox"][data-business="Test Retail Store"]');
    
    // Should show bulk compliance actions
    await expect(page.locator('[data-testid="bulk-compliance-actions"]')).toBeVisible();
    
    // Test bulk inspection scheduling
    await page.click('[data-testid="bulk-schedule-inspections"]');
    await expect(page.locator('[data-testid="bulk-inspection-modal"]')).toBeVisible();
    
    // Configure inspections
    await page.fill('[data-testid="inspection-date-input"]', '2024-12-15');
    await page.selectOption('[data-testid="inspection-type-select"]', 'annual');
    
    // Schedule inspections
    await page.click('[data-testid="schedule-inspections"]');
    await expect(page.locator('[data-testid="inspection-scheduling"]')).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('[data-testid="inspections-scheduled"]');
    
    // Should show scheduling results
    await expect(page.locator('[data-testid="scheduling-results"]')).toBeVisible();
  });

  test('Mobile portfolio management', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Should show mobile portfolio view
    await expect(page.locator('[data-testid="mobile-portfolio"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-stats"]')).toBeVisible();
    
    // Test mobile business cards
    const mobileBusinessCards = page.locator('[data-testid="mobile-business-card"]');
    await expect(mobileBusinessCards).toHaveCount(5);
    
    // Test mobile search
    await page.click('[data-testid="mobile-search-button"]');
    await expect(page.locator('[data-testid="mobile-search"]')).toBeVisible();
    
    await page.fill('[data-testid="mobile-search-input"]', 'Restaurant');
    await page.waitForTimeout(1000);
    
    // Should filter results
    await expect(page.locator('[data-testid="mobile-business-card"]')).toHaveCount(1);
    
    // Test mobile business details
    await page.tap('[data-testid="mobile-business-card"]:first-child');
    await expect(page.locator('[data-testid="mobile-business-details"]')).toBeVisible();
    
    // Test mobile actions
    await expect(page.locator('[data-testid="mobile-actions"]')).toBeVisible();
    await page.click('[data-testid="mobile-pay-button"]');
    await expect(page.locator('[data-testid="mobile-payment-modal"]')).toBeVisible();
    
    // Test mobile bulk operations
    await page.goto('/portfolio');
    await page.click('[data-testid="mobile-select-mode"]');
    await expect(page.locator('[data-testid="mobile-selection"]')).toBeVisible();
    
    // Select businesses
    await page.tap('[data-testid="mobile-select-checkbox"]:first-child');
    await page.tap('[data-testid="mobile-select-checkbox"]:nth-child(2)');
    
    // Should show mobile bulk actions
    await expect(page.locator('[data-testid="mobile-bulk-actions"]')).toBeVisible();
    await page.click('[data-testid="mobile-bulk-renew"]');
    await expect(page.locator('[data-testid="mobile-bulk-modal"]')).toBeVisible();
  });

  test('Performance with large portfolio', async ({ page }) => {
    // Mock large portfolio (50 businesses)
    await page.route('**/api/businesses', (route) => {
      const largePortfolio = Array.from({ length: 50 }, (_, i) => ({
        id: `business-${i}`,
        name: `Test Business ${i}`,
        type: 'Restaurant',
        status: 'approved',
        annualRevenue: 1000000
      }));
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largePortfolio)
      });
    });
    
    // Navigate to portfolio
    const startTime = Date.now();
    await page.goto('/portfolio');
    
    // Should load within reasonable time
    await page.waitForSelector('[data-testid="portfolio-content"]');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
    
    // Should show performance indicators
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
    
    // Test virtual scrolling
    await page.scroll('[data-testid="business-list"]', 0, 2000);
    await page.waitForTimeout(1000);
    
    // Should load more items
    await expect(page.locator('[data-testid="business-card"]:nth-child(20)')).toBeVisible();
    
    // Test search performance
    await page.fill('[data-testid="business-search-input"]', 'Test Business 25');
    const searchStartTime = Date.now();
    await page.waitForTimeout(1000);
    const searchTime = Date.now() - searchStartTime;
    expect(searchTime).toBeLessThan(2000);
    
    // Should show search results
    await expect(page.locator('[data-testid="business-card"]')).toHaveCount(1);
  });
});
