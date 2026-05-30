/**
 * Mock helpers for E2E auth tests
 */

/**
 * Mock email service to capture verification codes
 */
function mockEmailService(page) {
  let capturedCode = null

  page.route('**/api/auth/signup/start', async (route) => {
    const originalResponse = await route.fetch()
    const originalJson = await originalResponse.json()

    // If response contains a devCode, capture it
    if (originalJson.devCode) {
      capturedCode = originalJson.devCode
    }

    route.fulfill({
      status: originalResponse.status,
      contentType: 'application/json',
      body: JSON.stringify(originalJson),
    })
  })

  page.route('**/api/auth/login/start', async (route) => {
    const originalResponse = await route.fetch()
    const originalJson = await originalResponse.json()

    if (originalJson.devCode) {
      capturedCode = originalJson.devCode
    }

    route.fulfill({
      status: originalResponse.status,
      contentType: 'application/json',
      body: JSON.stringify(originalJson),
    })
  })

  page.route('**/api/auth/forgot-password', async (route) => {
    const originalResponse = await route.fetch()
    const originalJson = await originalResponse.json()

    if (originalJson.devCode) {
      capturedCode = originalJson.devCode
    }

    route.fulfill({
      status: originalResponse.status,
      contentType: 'application/json',
      body: JSON.stringify(originalJson),
    })
  })

  return {
    getCapturedCode: () => capturedCode,
    resetCode: () => { capturedCode = null },
  }
}

/**
 * Mock maintenance status
 */
function mockMaintenanceStatus(page, active = false) {
  page.route('**/api/maintenance/status', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ active }),
    })
  })
}

/**
 * Mock CAPTCHA verification
 */
function mockCaptcha(page, success = true) {
  page.route('**/api/auth/captcha/verify', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ success }),
    })
  })
}

export {
  mockEmailService,
  mockMaintenanceStatus,
  mockCaptcha,
}
