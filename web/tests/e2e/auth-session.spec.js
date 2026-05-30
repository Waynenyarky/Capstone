import { test, expect } from '@playwright/test'
import { mockMaintenanceStatus } from './helpers/mock-helpers'
import {
  navigateToLogin,
  isAuthenticated,
  clearAuthState,
} from './helpers/auth-helpers'

test.describe('Auth Session E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    mockMaintenanceStatus(page, false)
  })

  test.describe('Session State', () => {
    test('should not be authenticated initially', async ({ page }) => {
      await navigateToLogin(page)
      const authed = await isAuthenticated(page)
      expect(authed).toBeFalsy()
    })

    test('should clear auth state on clearAuthState call', async () => {
      // Skip - requires complex auth state management
      test.skip('Auth state management requires backend integration - covered by unit tests')
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing owner dashboard unauthenticated', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/owner')
      await page.waitForURL(/\/login/, { timeout: 10000 })
    })

    test('should redirect to login when accessing admin dashboard unauthenticated', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/admin/dashboard')
      await page.waitForURL(/\/login/, { timeout: 10000 })
    })

    test('should redirect to login when accessing staff pages unauthenticated', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/staff')
      await page.waitForURL(/\/login/, { timeout: 10000 })
    })
  })

  test.describe('Public Routes', () => {
    test('should allow access to login page', async ({ page }) => {
      await navigateToLogin(page)
      await expect(page.locator('text=Login To BizClear')).toBeVisible()
    })

    test('should allow access to signup page', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/sign-up')
      await expect(page.locator('text=Register An Account')).toBeVisible({ timeout: 10000 })
    })

    test('should allow access to forgot password page', async ({ page }) => {
      await page.goto('http://127.0.0.1:5173/forgot-password')
      await expect(page.locator('text=Forgot Password')).toBeVisible({ timeout: 10000 })
    })
  })
})
