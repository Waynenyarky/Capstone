/**
 * Test utilities for authentication components
 * Provides helpers to render auth components with minimal mocking
 */

import { renderWithProviders, screen, waitFor } from './renderWithProviders.jsx'
import { expect } from 'vitest'
import LoginForm from '@/features/authentication/login/LoginForm.jsx'
import UserSignUpForm from '@/features/authentication/signup/UserSignUpForm.jsx'

/**
 * Renders LoginForm with minimal mocking
 * Only mocks external dependencies (lottie-web, notifications)
 * Uses real hooks for actual behavior testing
 */
export function renderLoginFormWithRealHooks() {
  return renderWithProviders(<LoginForm />)
}

/**
 * Renders SignupForm with minimal mocking
 * Only mocks external dependencies (lottie-web, notifications)
 * Uses real hooks for actual behavior testing
 */
export function renderSignupFormWithRealHooks() {
  return renderWithProviders(<UserSignUpForm />)
}

/**
 * Fills login form with given credentials
 */
export async function fillLoginForm(credentials) {
  const emailInput = screen.getByTestId('login-email')
  const passwordInput = screen.getByTestId('login-password')
  const rememberMeCheckbox = screen.queryByTestId('login-remember')

  // Wait for inputs to be ready
  await waitFor(() => {
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
  })

  // Fill email
  if (credentials.email) {
    emailInput.value = credentials.email
    emailInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Fill password
  if (credentials.password) {
    passwordInput.value = credentials.password
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Toggle remember me
  if (credentials.rememberMe && rememberMeCheckbox) {
    rememberMeCheckbox.checked = true
    rememberMeCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

/**
 * Submits login form
 */
export async function submitLoginForm() {
  const submitButton = screen.getByTestId('login-submit')
  submitButton.click()
}

/**
 * Fills signup form with given data
 */
export async function fillSignupForm(data) {
  const firstNameInput = screen.getByPlaceholderText('First name')
  const lastNameInput = screen.getByPlaceholderText('Last name')
  const emailInput = screen.getByPlaceholderText('Email address')
  const phoneInput = screen.getByPlaceholderText('Mobile number')
  const passwordInput = screen.getByPlaceholderText('Password')
  const termsCheckbox = screen.queryByRole('checkbox', { name: /terms/i })

  // Wait for inputs to be ready
  await waitFor(() => {
    expect(firstNameInput).toBeInTheDocument()
    expect(lastNameInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
  })

  // Fill fields
  if (data.firstName) {
    firstNameInput.value = data.firstName
    firstNameInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  if (data.lastName) {
    lastNameInput.value = data.lastName
    lastNameInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  if (data.email) {
    emailInput.value = data.email
    emailInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  if (data.phoneNumber) {
    phoneInput.value = data.phoneNumber
    phoneInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  if (data.password) {
    passwordInput.value = data.password
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  if (data.termsAccepted && termsCheckbox) {
    termsCheckbox.checked = true
    termsCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

/**
 * Submits signup form
 */
export async function submitSignupForm() {
  const continueButton = screen.getByRole('button', { name: /continue/i })
  continueButton.click()
}

/**
 * Waits for verification step to appear
 */
export async function waitForVerificationStep() {
  await waitFor(() => {
    expect(screen.queryByPlaceholderText('First name')).not.toBeInTheDocument()
  })
}

/**
 * Gets OTP input by index (0-5)
 */
export function getOtpInput(index) {
  return screen.getByLabelText(`OTP Input ${index + 1}`)
}

/**
 * Fills OTP code
 */
export async function fillOtpCode(code) {
  for (let i = 0; i < code.length; i++) {
    const input = getOtpInput(i)
    input.value = code[i]
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
}
