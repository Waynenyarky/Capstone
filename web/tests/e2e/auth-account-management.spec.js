import { test, expect } from '@playwright/test'
import { mockMaintenanceStatus } from './helpers/mock-helpers'
import {
  navigateToLogin,
  navigateToPasswordReset,
  clearAuthState,
} from './helpers/auth-helpers'

test.describe('Auth Account Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    mockMaintenanceStatus(page, false)
  })

  test.describe('Password Change', () => {
    test('should show change password form in forgot-password flow', async ({ page }) => {
      await navigateToPasswordReset(page)

      // The forgot password page should have the form
      await expect(page.locator('text=Forgot Password')).toBeVisible()
      await expect(page.locator('input[placeholder="name@example.com"]')).toBeVisible()
    })
  })

  test.describe('Account Navigation', () => {
    test('should redirect to login when accessing security settings unauthenticated', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/account/security')
      await page.waitForURL(/\/login/, { timeout: 10000 })
    })

    test('should show login page with correct title', async ({ page }) => {
      await navigateToLogin(page)
      await expect(page.locator('text=Login To BizClear')).toBeVisible()
    })

    test('should show signup page with correct title', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/sign-up')
      await expect(page.locator('text=Register An Account')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Terms and Privacy Links', () => {
    test('should have terms link on signup page', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/sign-up')
      await page.waitForSelector('input[placeholder="First name"]', { timeout: 10000 })

      const termsLink = page.locator('a[href="/terms"]')
      await expect(termsLink).toBeVisible()
    })

    test('should have privacy link on signup page', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/sign-up')
      await page.waitForSelector('input[placeholder="First name"]', { timeout: 10000 })

      const privacyLink = page.locator('a[href="/privacy"]').first()
      await expect(privacyLink).toBeVisible()
    })
  })
})
