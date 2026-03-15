import { test, expect } from '@playwright/test';

test.describe('Basic E2E Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Should show home page (public route)
    const url = page.url();
    expect(url).toMatch(/\/$/);
    await expect(page.locator('text=Log In')).toBeVisible();
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    
    // Should show login elements
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation elements - use actual text and links
    await expect(page.locator('text=Log In')).toBeVisible();
    await expect(page.locator('text=Register')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});
