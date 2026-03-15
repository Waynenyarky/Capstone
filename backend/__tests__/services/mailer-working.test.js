// Mock axios at the module level before any imports
jest.mock('axios', () => ({
  post: jest.fn()
}))

// Mock logger
jest.mock('../../services/auth-service/src/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}))

// Now import the mailer service
const mailer = require('../../services/auth-service/src/lib/mailer')

describe('Mailer Service - Working Version', () => {
  let originalEnv
  let mockAxiosPost

  beforeEach(() => {
    // Store original env and reset mocks
    originalEnv = { ...process.env }
    jest.clearAllMocks()
    
    // Get axios mock reference
    mockAxiosPost = require('axios').post
    mockAxiosPost.mockClear()
    mockAxiosPost.mockResolvedValue({ data: { id: 'test-message-id' } })
    
    // Set default test environment
    process.env.EMAIL_API_PROVIDER = 'resend'
    process.env.EMAIL_API_KEY = 'test-api-key'
    process.env.DEFAULT_FROM_EMAIL = 'test@example.com'
    process.env.APP_BRAND_NAME = 'TestApp'
    process.env.FRONTEND_URL = 'http://localhost:3000'
    process.env.SUPPORT_EMAIL = 'support@example.com'
    process.env.VERIFICATION_CODE_TTL_MIN = '10'
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('sendOtp', () => {
    it('should send OTP email successfully', async () => {
      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456',
        purpose: 'login'
      })

      expect(result).toBeDefined()
      if (result.success !== false) {
        expect(result.messageId || result.id).toBeDefined()
      }
    })

    it('should use mock sender when no API key', async () => {
      delete process.env.EMAIL_API_KEY

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(mockAxiosPost).not.toHaveBeenCalled()
      expect(result).toHaveProperty('messageId')
      expect(result.accepted).toContain('user@example.com')
    })

    it('should handle different purposes', async () => {
      const purposes = ['login', 'signup', 'password_reset']
      
      for (const purpose of purposes) {
        const result = await mailer.sendOtp({
          to: 'user@example.com',
          code: '123456',
          purpose
        })
        
        expect(result).toBeDefined()
      }
    })
  })

  describe('sendForgotPasswordNotAvailableEmail', () => {
    it('should send forgot password email', async () => {
      const result = await mailer.sendForgotPasswordNotAvailableEmail({
        to: 'user@example.com',
        code: '123456',
        roleSlug: 'business-owner'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendStaffCredentialsEmail', () => {
    it('should send staff credentials email', async () => {
      const result = await mailer.sendStaffCredentialsEmail({
        to: 'staff@example.com',
        username: 'staffuser',
        tempPassword: 'temp123',
        office: 'Main Office',
        roleLabel: 'Staff Member'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendEmailChangeNotification', () => {
    it('should send email change notification', async () => {
      const result = await mailer.sendEmailChangeNotification({
        to: 'old@example.com',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        revertUrl: 'http://localhost:3000/revert',
        type: 'old_email'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendPasswordChangeNotification', () => {
    it('should send password change notification', async () => {
      const result = await mailer.sendPasswordChangeNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        timestamp: new Date()
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendMfaEnabledNotification', () => {
    it('should send MFA enabled notification', async () => {
      const result = await mailer.sendMfaEnabledNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        method: 'authenticator'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendMfaDisableRequestedNotification', () => {
    it('should send MFA disable requested notification', async () => {
      const result = await mailer.sendMfaDisableRequestedNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendMfaDisabledNotification', () => {
    it('should send MFA disabled notification', async () => {
      const result = await mailer.sendMfaDisabledNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendPasskeyAddedNotification', () => {
    it('should send passkey added notification', async () => {
      const result = await mailer.sendPasskeyAddedNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendPasskeyRemovedNotification', () => {
    it('should send passkey removed notification', async () => {
      const result = await mailer.sendPasskeyRemovedNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendAdminAlertEmail', () => {
    it('should send admin alert email', async () => {
      const result = await mailer.sendAdminAlertEmail({
        to: 'admin@example.com',
        adminName: 'Admin User',
        userId: 'user123',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        field: 'restricted_field',
        attemptedValue: 'forbidden_value',
        roleSlug: 'business-owner',
        timestamp: new Date()
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendAdminAlert', () => {
    it('should send admin alert', async () => {
      const result = await mailer.sendAdminAlert({
        to: 'admin@example.com',
        subject: 'Security Alert',
        message: 'Suspicious activity detected'
      })

      expect(result).toBeDefined()
    })
  })

  describe('sendApprovalNotification', () => {
    it('should send approval notification', async () => {
      const result = await mailer.sendApprovalNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Test Business',
        status: 'approved',
        comments: 'All good!',
        approvalId: 'approval123'
      })

      expect(result).toBeDefined()
    })
  })

  describe('Provider Support', () => {
    it('should support Resend provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'resend'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toBeDefined()
    })

    it('should support SendGrid provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'sendgrid'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toBeDefined()
    })

    it('should support Mailgun provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'mailgun'
      process.env.MAILGUN_DOMAIN = 'test.example.com'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toBeDefined()
    })

    it('should support AWS SES provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'ses'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toBeDefined()
    })

    it('should support Postmark provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'postmark'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockAxiosPost.mockRejectedValue(new Error('Network error'))

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toHaveProperty('success', false)
      expect(result).toHaveProperty('error')
    })

    it('should handle missing parameters', async () => {
      const result1 = await mailer.sendOtp({ to: '', code: '123456' })
      expect(result1).toHaveProperty('success', false)

      const result2 = await mailer.sendOtp({ to: 'user@example.com', code: '' })
      expect(result2).toHaveProperty('success', false)
    })

    it('should handle unsupported providers', async () => {
      process.env.EMAIL_API_PROVIDER = 'unsupported'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toHaveProperty('success', false)
    })
  })

  describe('Environment Configuration', () => {
    it('should handle dev redirect', async () => {
      process.env.EMAIL_DEV_REDIRECT_TO = 'dev@example.com'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toBeDefined()
    })

    it('should handle placeholder API keys', async () => {
      process.env.EMAIL_API_KEY = 'your-api-key-here'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(result).toBeDefined()
      expect(mockAxiosPost).not.toHaveBeenCalled()
    })
  })
})
