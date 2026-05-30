import { test, expect } from '@playwright/test'
import { testUsers, testPasswords } from './helpers/test-data'
import { mockMaintenanceStatus } from './helpers/mock-helpers'
import {
  navigateToSignup,
  clearAuthState,
} from './helpers/auth-helpers'

test.describe('Auth Signup Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    mockMaintenanceStatus(page, false)
  })

  test.describe('Business Owner Signup', () => {
    test('should complete business owner signup and reach MFA setup', async () => {
      // This test requires full backend integration with real API calls
      // The PIS fields are complex and require cascading address selection
      // Skip for now - covered by unit tests
      test.skip('Requires full backend integration with PIS fields - covered by unit tests')
    })

    test('should reject weak password during signup', async ({ page }) => {
      await navigateToSignup(page)

      // Fill with a weak password — validation triggers on "Continue" click
      await page.fill('input[placeholder="First name"]', 'Test')
      await page.fill('input[placeholder="Last name"]', 'User')
      await page.fill('input[placeholder="Email address"]', testUsers.businessOwner.email())
      await page.fill('input[placeholder="Mobile number"]', '09171234567')
      await page.locator('input[placeholder="Create password"]').fill(testPasswords.weak)
      await page.locator('input[placeholder="Confirm password"]').fill(testPasswords.weak)
      const checkbox = page.locator('.ant-checkbox-input').first()
      if (!(await checkbox.isChecked())) await checkbox.check({ force: true })

      // Click Continue — should trigger validation and block
      await page.locator('button:has-text("Continue")').click()

      // Should show password validation error (min 12 chars)
      await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Signup Validation', () => {
    test('should require fields on step 1 when clicking Continue', async ({ page }) => {
      await navigateToSignup(page)

      // Click Continue with empty fields
      await page.locator('button:has-text("Continue")').click()

      // Should show validation errors for required fields
      const errorMessages = page.locator('.ant-form-item-explain-error')
      await expect(errorMessages.first()).toBeVisible({ timeout: 3000 })
    })

    test('should validate email format', async ({ page }) => {
      await navigateToSignup(page)

      await page.fill('input[placeholder="First name"]', 'Test')
      await page.fill('input[placeholder="Last name"]', 'User')
      await page.fill('input[placeholder="Email address"]', 'invalid-email')
      await page.fill('input[placeholder="Mobile number"]', '09171234567')
      await page.locator('input[placeholder="Create password"]').fill('ValidPassword123!')
      await page.locator('input[placeholder="Confirm password"]').fill('ValidPassword123!')
      const checkbox = page.locator('.ant-checkbox-input').first()
      if (!(await checkbox.isChecked())) await checkbox.check({ force: true })

      await page.locator('button:has-text("Continue")').click()

      // Should show email validation error
      await expect(page.locator('.ant-form-item-explain-error')).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Email Verification', () => {
    test('should show resend button on verification step', async () => {
      // This test requires full backend integration with PIS fields
      // Skip for now - covered by unit tests
      test.skip('Requires full backend integration with PIS fields - covered by unit tests')
    })

    test('should reject invalid verification code', async () => {
      // This test requires full backend integration with PIS fields
      // Skip for now - covered by unit tests
      test.skip('Requires full backend integration with PIS fields - covered by unit tests')
    })
  })
})
