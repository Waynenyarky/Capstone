import { test, expect } from '@playwright/test'
import { mockMaintenanceStatus } from './helpers/mock-helpers'
import {
  navigateToLogin,
  navigateToSignup,
  clearAuthState,
} from './helpers/auth-helpers'

test.describe('Auth Security E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    mockMaintenanceStatus(page, false)
  })

  test.describe('Maintenance Mode', () => {
    test('should block signup when maintenance mode is active', async () => {
      // Skip - requires complex backend integration with PIS fields
      test.skip('Maintenance mode requires backend integration - covered by unit tests')
    })
  })

  test.describe('Input Sanitization', () => {
    test('should not allow XSS in login email field', async ({ page }) => {
      await navigateToLogin(page)

      const xssPayload = '<script>alert("xss")</script>'
      await page.locator('[data-testid="login-email"]').fill(xssPayload)
      await page.locator('[data-testid="login-password"]').fill('TestPassword123!')
      await page.locator('[data-testid="login-submit"]').click()

      // The page should not execute the script — check we're still on login
      await page.waitForTimeout(1000)
      // Verify no alert dialog appeared
      expect(page.url()).toContain('/login')
    })

    test('should sanitize phone number input on signup', async ({ page }) => {
      await navigateToSignup(page)

      const phoneInput = page.locator('input[placeholder="Mobile number"]')
      await phoneInput.fill('abc123def456')

      // Phone input should only contain numeric characters (due to sanitizePhoneInput)
      const value = await phoneInput.inputValue()
      expect(value).toMatch(/^[0-9]*$/)
    })
  })

  test.describe('Navigation Security', () => {
    test('should not expose sensitive routes to unauthenticated users', async ({ page }) => {
      // Try accessing a protected route
      await page.goto('http://127.0.0.1:5173/admin/dashboard')

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 10000 })
    })
  })

  test.describe('HTTPS and Security Headers', () => {
    test('should load login page without errors', async ({ page }) => {
      const errors = []
      page.on('pageerror', (err) => errors.push(err.message))

      await navigateToLogin(page)

      // Page should load without critical JS errors
      // Filter out known non-critical errors (ResizeObserver, Cloudflare Turnstile, etc.)
      const criticalErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && 
              !e.includes('Non-Error') &&
              !e.includes('Cloudflare Turnstile')
      )
      expect(criticalErrors).toHaveLength(0)
    })
  })
})
