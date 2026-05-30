import { test, expect } from '@playwright/test'
import { navigateToPasswordReset, clearAuthState } from './helpers/auth-helpers'
import { mockMaintenanceStatus } from './helpers/mock-helpers'

test.describe('Auth Password Reset Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    mockMaintenanceStatus(page, false)
  })

  test('should display forgot password form', async ({ page }) => {
    await navigateToPasswordReset(page)
    await expect(page.locator('text=Forgot Password')).toBeVisible()
    await expect(page.locator('input[placeholder="name@example.com"]')).toBeVisible()
    await expect(page.locator('button:has-text("Continue")')).toBeVisible()
  })
})
