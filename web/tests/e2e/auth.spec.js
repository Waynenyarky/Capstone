import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Keep maintenance and auth calls stable without backend
  await page.route('**/api/maintenance/status', (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ active: false }) })
  })
  await page.route('**/api/auth/**', (route) => {
    // Default unauthenticated responses are fine for these smoke tests
    route.fulfill({ status: 401, body: JSON.stringify({ message: 'unauthorized' }) })
  })
})

test('renders login form and accepts input', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByTestId('login-email')).toBeVisible()
  await page.getByTestId('login-email').fill('user@example.com')
  await page.getByTestId('login-password').fill('StrongP@ssw0rd!')

  await expect(page.getByTestId('login-submit')).toBeEnabled()
})

test('redirects unauthenticated users from protected route to login', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login/)
})
