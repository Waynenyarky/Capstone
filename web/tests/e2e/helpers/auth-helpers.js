/**
 * Auth helper functions for E2E tests
 * Selectors match the real Ant Design components used in the auth UI.
 *
 * Key UI facts:
 *  - Signup is a 2-step wizard: Step 0 (account info) → Step 1 (PIS / personal info)
 *  - All OTP inputs use Ant Design Input.OTP (6 separate <input> elements)
 *  - Login form has data-testid attributes; signup/reset forms do NOT
 *  - The "Continue" button on signup step 0 is type="button" (onClick), not submit
 *  - The "Create Account" button on signup step 1 is htmlType="submit"
 */

const BASE_URL = 'http://127.0.0.1:5173'

// ─── Signup Helpers ──────────────────────────────────────────────────────────

/**
 * Fill signup step 1 (Account Information) fields.
 * Does NOT click Continue — caller decides when to advance.
 */
async function fillSignupStep1(page, userData) {
  await page.fill('input[placeholder="First name"]', userData.firstName)
  await page.fill('input[placeholder="Last name"]', userData.lastName)
  if (userData.middleName) {
    await page.fill('input[placeholder="Middle name"]', userData.middleName)
  }
  await page.fill('input[placeholder="Email address"]', userData.email)
  if (userData.phoneNumber) {
    await page.fill('input[placeholder="Mobile number"]', userData.phoneNumber)
  }
  // Input.Password wraps an <input> inside a span; target the inner input
  await page.locator('input[placeholder="Create password"]').fill(userData.password)
  await page.locator('input[placeholder="Confirm password"]').fill(userData.password)

  // Accept terms (Ant Design Checkbox renders a hidden <input> + visible <span>)
  const checkbox = page.locator('.ant-checkbox-input').first()
  if (!(await checkbox.isChecked())) {
    await checkbox.check({ force: true })
  }
}

/**
 * Click "Continue" on signup step 1 to advance to PIS step.
 * Returns true if step 2 was reached, false if validation failed.
 */
async function advanceToSignupStep2(page) {
  await page.locator('button:has-text("Continue")').click()
  
  // Wait for step 2 to become visible - the PIS input should become visible
  try {
    await page.waitForSelector('input[placeholder="Place of birth"]', { state: 'visible', timeout: 5000 })
    return true
  } catch {
    // Step 2 didn't appear - validation likely failed
    return false
  }
}

/**
 * Fill signup step 2 (PIS / Personal Information) fields with minimal valid data.
 * Handles cascading address selects and other required fields.
 */
async function fillSignupStep2(page, pisData = {}) {
  // Wait for step 2 to be fully visible
  await page.waitForSelector('input[placeholder="Place of birth"]', { state: 'visible', timeout: 5000 })

  // ─── Address Fields (PhilippineAddressFields) ───
  // These are cascading selects: Province → City → Barangay
  // Wait for provinces to load
  await page.waitForTimeout(1000)
  
  // Select Province (first available option)
  const provinceSelect = page.locator('label:has-text("Province")').locator('..').locator('.ant-select').first()
  if (await provinceSelect.isVisible({ timeout: 2000 })) {
    await provinceSelect.click()
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible', timeout: 3000 })
    await page.locator('.ant-select-item-option').first().click()
    await page.waitForTimeout(500) // Wait for cities to load
  }

  // Select City (first available option)
  const citySelect = page.locator('label:has-text("City/Municipality")').locator('..').locator('.ant-select').first()
  if (await citySelect.isVisible({ timeout: 2000 })) {
    await citySelect.click()
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible', timeout: 3000 })
    await page.locator('.ant-select-item-option').first().click()
    await page.waitForTimeout(500) // Wait for barangays to load
  }

  // Select Barangay (first available option)
  const barangaySelect = page.locator('label:has-text("Barangay")').locator('..').locator('.ant-select').first()
  if (await barangaySelect.isVisible({ timeout: 2000 })) {
    await barangaySelect.click()
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible', timeout: 3000 })
    await page.locator('.ant-select-item-option').first().click()
  }

  // Street Address
  await page.fill('input[placeholder="e.g., 133 Roxas Boulevard"]', '123 Test Street').catch(() => {})

  // Postal Code
  await page.fill('input[placeholder="e.g., 2420"]', '1000').catch(() => {})

  // ─── Other PIS Fields ───
  // Sex
  const sexSelect = page.locator('label:has-text("Sex")').locator('..').locator('.ant-select').first()
  if (await sexSelect.isVisible({ timeout: 2000 })) {
    await sexSelect.click()
    await page.locator('.ant-select-item-option:has-text("Male")').first().click()
  }

  // Marital Status
  const maritalSelect = page.locator('label:has-text("Marital Status")').locator('..').locator('.ant-select').first()
  if (await maritalSelect.isVisible({ timeout: 2000 })) {
    await maritalSelect.click()
    await page.locator('.ant-select-item-option:has-text("Single")').first().click()
  }

  // Date of Birth
  const dobInput = page.locator('input[placeholder="Select date"]').first()
  if (await dobInput.isVisible({ timeout: 2000 })) {
    await dobInput.click()
    await page.locator('.ant-picker-cell:has-text("15")').first().click()
  }

  // Place of Birth
  await page.fill('input[placeholder="Place of birth"]', pisData.placeOfBirth || 'Manila').catch(() => {})

  // Nationality
  await page.fill('input[placeholder="e.g. Filipino"]', pisData.nationality || 'Filipino').catch(() => {})

  // Education
  const eduSelect = page.locator('label:has-text("Education")').locator('..').locator('.ant-select').first()
  if (await eduSelect.isVisible({ timeout: 2000 })) {
    await eduSelect.click()
    await page.locator('.ant-select-item-option').first().click()
  }

  // Father's Name
  await page.fill('input[placeholder="Full name of father"]', pisData.fatherName || 'Juan Dela Cruz').catch(() => {})

  // Mother's Name
  await page.fill('input[placeholder="Full name of mother"]', pisData.motherName || 'Maria Dela Cruz').catch(() => {})
}

/**
 * Submit signup step 2 (clicks "Create Account").
 */
async function submitSignup(page) {
  await page.locator('button[type="submit"]:has-text("Create Account")').click()
}

// ─── Login Helpers ───────────────────────────────────────────────────────────

/**
 * Fill login form using data-testid attributes (which exist on LoginForm).
 */
async function fillLoginForm(page, email, password) {
  // login-email wraps an <Input>, the actual <input> is inside
  await page.locator('[data-testid="login-email"]').fill(email)
  // login-password wraps Input.Password; fill it directly
  await page.locator('[data-testid="login-password"]').fill(password)
}

/**
 * Click the login submit button.
 */
async function submitLogin(page) {
  await page.locator('[data-testid="login-submit"]').click()
}

// ─── OTP / Verification Helpers ──────────────────────────────────────────────

/**
 * Wait for an OTP input to appear (Ant Design Input.OTP renders as .ant-otp-input
 * or individual <input> elements inside a container).
 */
async function waitForOtpInput(page) {
  // Try multiple possible selectors for OTP input
  const selectors = [
    '.ant-otp-input',
    '.ant-input-otp',
    'input[aria-label="Verification code"]',
    'input[name="verificationCode"]',
    'text=Verify Your Email',
    'text=Verify Code',
  ]
  
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 })
      return true
    } catch {
      // Continue to next selector
    }
  }
  
  // If none found, check if we're on a different page (validation error, etc.)
  const currentUrl = page.url()
  if (currentUrl.includes('/sign-up')) {
    // Still on signup - likely validation error
    throw new Error('OTP step not reached - likely validation error or backend issue')
  }
  return false
}

/**
 * Fill an Ant Design Input.OTP (6 individual <input> elements).
 * We type each digit sequentially into the focused input.
 */
async function fillOtp(page, code) {
  const digits = String(code).split('')
  // Find all OTP digit inputs
  const otpInputs = page.locator('.ant-otp-input input, .ant-input-otp input')
  const count = await otpInputs.count()
  if (count >= 6) {
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(digits[i])
    }
  } else {
    // Fallback: type into first focused input
    const firstInput = otpInputs.first()
    await firstInput.click()
    for (const digit of digits) {
      await page.keyboard.type(digit)
    }
  }
}

/**
 * Wait for the dev code prefill button and click it to fill the OTP.
 * This is the most reliable way to fill the code in dev mode since
 * the backend returns devCode in the response.
 */
async function clickDevPrefillCode(page) {
  const prefillBtn = page.locator('button:has-text("Prefill Code")')
  await prefillBtn.waitFor({ timeout: 5000 })
  await prefillBtn.click()
}

/**
 * Submit verification form (click the primary submit button in the verification view).
 */
async function submitVerification(page, buttonText = 'Verify') {
  await page.locator(`button[type="submit"]:has-text("${buttonText}"), button.ant-btn-primary:has-text("${buttonText}")`).click()
}

// ─── Password Reset Helpers ─────────────────────────────────────────────────

/**
 * Fill the forgot password email field.
 */
async function fillForgotPasswordEmail(page, email) {
  await page.fill('input[placeholder="name@example.com"]', email)
}

/**
 * Submit forgot password form.
 */
async function submitForgotPassword(page) {
  await page.locator('button.ant-btn-primary:has-text("Continue")').click()
}

/**
 * Fill the change/reset password form fields.
 */
async function fillChangePassword(page, newPassword) {
  await page.locator('input[placeholder="Enter new password"]').fill(newPassword)
  await page.locator('input[placeholder="Confirm new password"]').fill(newPassword)
}

/**
 * Submit the change/reset password form.
 */
async function submitChangePassword(page) {
  await page.locator('button.ant-btn-primary:has-text("Reset Password"), button.ant-btn-primary:has-text("Send Verification Code")').click()
}

// ─── MFA Setup Helpers ──────────────────────────────────────────────────────

/**
 * Wait for MFA setup intro page ("Secure Your Account").
 */
async function waitForMfaSetupIntro(page) {
  await page.waitForSelector('text=Secure Your Account', { timeout: 10000 })
}

/**
 * Click "Use authenticator app" on MFA setup intro.
 */
async function startAuthenticatorSetup(page) {
  await page.locator('button:has-text("Use authenticator app")').click()
}

/**
 * Wait for QR code display in MFA setup.
 */
async function waitForMfaQrCode(page) {
  await page.waitForSelector('text=Scan QR Code', { timeout: 5000 })
}

/**
 * Click "Skip for now" on MFA setup.
 */
async function skipMfaSetup(page) {
  await page.locator('button:has-text("Skip for now")').click()
}

// ─── Navigation Helpers ─────────────────────────────────────────────────────

async function navigateToSignup(page) {
  await page.goto(`${BASE_URL}/sign-up`)
  await page.waitForSelector('input[placeholder="First name"]', { timeout: 10000 })
}

async function navigateToLogin(page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('[data-testid="login-email"]', { timeout: 10000 })
}

async function navigateToPasswordReset(page) {
  await page.goto(`${BASE_URL}/forgot-password`)
  await page.waitForSelector('input[placeholder="name@example.com"]', { timeout: 10000 })
}

// ─── Session / Auth State Helpers ───────────────────────────────────────────

/**
 * Wait for any dashboard page to load after login/signup.
 */
async function waitForDashboard(page) {
  await page.waitForURL(/\/(owner|admin\/dashboard|staff)/, { timeout: 15000 })
}

/**
 * Logout the current user (find and click logout in the UI).
 */
async function logout(page) {
  // Look for a user menu / avatar button, then logout
  const userMenu = page.locator('[data-testid="user-menu-button"], .ant-dropdown-trigger, .ant-avatar').first()
  if (await userMenu.isVisible()) {
    await userMenu.click()
    await page.locator('text=Logout, text=Sign Out, text=Log Out').first().click()
    await page.waitForURL(/\/login/, { timeout: 5000 })
  }
}

/**
 * Check if user is authenticated (has auth token in storage).
 */
async function isAuthenticated(page) {
  return page.evaluate(() => {
    return !!(localStorage.getItem('auth__currentUser') || sessionStorage.getItem('auth__currentUser'))
  })
}

/**
 * Get current user from storage.
 */
async function getCurrentUser(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('auth__currentUser') || sessionStorage.getItem('auth__currentUser')
    return raw ? JSON.parse(raw) : null
  })
}

/**
 * Clear auth state. Must be called AFTER a page is loaded (needs execution context).
 */
async function clearAuthState(page) {
  // Navigate to a real page first to have an execution context
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export {
  // Signup
  fillSignupStep1,
  advanceToSignupStep2,
  fillSignupStep2,
  submitSignup,
  // Login
  fillLoginForm,
  submitLogin,
  // OTP
  waitForOtpInput,
  fillOtp,
  clickDevPrefillCode,
  submitVerification,
  // Password Reset
  fillForgotPasswordEmail,
  submitForgotPassword,
  fillChangePassword,
  submitChangePassword,
  // MFA Setup
  waitForMfaSetupIntro,
  startAuthenticatorSetup,
  waitForMfaQrCode,
  skipMfaSetup,
  // Navigation
  navigateToSignup,
  navigateToLogin,
  navigateToPasswordReset,
  // Session
  waitForDashboard,
  logout,
  isAuthenticated,
  getCurrentUser,
  clearAuthState,
}
