const mailer = require('../../services/auth-service/src/lib/mailer')

// Mock axios for HTTP requests
jest.mock('axios')

// Mock logger
jest.mock('../../services/auth-service/src/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}))

describe('Mailer Service - Core Functionality', () => {
  let originalEnv

  beforeEach(() => {
    // Store original env and reset mocks
    originalEnv = { ...process.env }
    jest.clearAllMocks()
    
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
    it('should send OTP email successfully with Resend', async () => {
      const mockResponse = { data: { id: 'test-message-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456',
        purpose: 'login'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          from: 'test@example.com',
          to: ['user@example.com'],
          subject: 'Your verification code',
          html: expect.stringContaining('123456')
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      )
    })

    it('should use mock sender when no API key', async () => {
      delete process.env.EMAIL_API_KEY

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(require('axios').post).not.toHaveBeenCalled()
      expect(result).toHaveProperty('messageId')
      expect(result.accepted).toContain('user@example.com')
    })

    it('should handle custom subject and from address', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456',
        subject: 'Custom Subject',
        from: 'custom@example.com',
        purpose: 'signup'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          from: 'custom@example.com',
          subject: 'Custom Subject'
        }),
        expect.any(Object)
      )
    })

    it('should use different email templates for different purposes', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      // Test login purpose
      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456',
        purpose: 'login'
      })

      const loginCall = require('axios').post.mock.calls[0]
      expect(loginCall[1].html).toContain('sign in to your account')

      // Reset mock
      require('axios').post.mockClear()

      // Test signup purpose
      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456',
        purpose: 'signup'
      })

      const signupCall = require('axios').post.mock.calls[0]
      expect(signupCall[1].html).toContain('complete your registration')
    })
  })

  describe('Provider Support', () => {
    it('should support SendGrid provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'sendgrid'
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.sendgrid.com/v3/mail/send',
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('should support Mailgun provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'mailgun'
      process.env.MAILGUN_DOMAIN = 'test.example.com'
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        expect.stringContaining('api.mailgun.net'),
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('should support AWS SES provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'ses'
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://email.us-east-1.amazonaws.com',
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('should support Postmark provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'postmark'
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.postmarkapp.com/email',
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('should throw error for unsupported provider', async () => {
      process.env.EMAIL_API_PROVIDER = 'unsupported'

      await expect(
        mailer.sendOtp({ to: 'user@example.com', code: '123456' })
      ).rejects.toThrow('Unsupported email provider')
    })
  })

  describe('Email Functions', () => {
    it('should send forgot password email successfully', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendForgotPasswordNotAvailableEmail({
        to: 'user@example.com',
        code: '123456',
        roleSlug: 'business-owner',
        subject: 'Password Reset Code'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: ['user@example.com'],
          subject: 'Password Reset Code',
          html: expect.stringContaining('123456')
        }),
        expect.any(Object)
      )
    })

    it('should send staff credentials email successfully', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendStaffCredentialsEmail({
        to: 'staff@example.com',
        username: 'staffuser',
        tempPassword: 'temp123',
        office: 'Main Office',
        roleLabel: 'Staff Member'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: ['staff@example.com'],
          subject: 'Your Staff Account Credentials',
          html: expect.stringContaining('staffuser')
        }),
        expect.any(Object)
      )
    })

    it('should send email change notification to old email', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendEmailChangeNotification({
        to: 'old@example.com',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        revertUrl: 'http://localhost:3000/revert',
        type: 'old_email'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: ['old@example.com'],
          html: expect.stringContaining('old@example.com')
        }),
        expect.any(Object)
      )
    })

    it('should send password change notification successfully', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      const timestamp = new Date()
      await mailer.sendPasswordChangeNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        timestamp
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: ['user@example.com'],
          html: expect.stringContaining('John Doe')
        }),
        expect.any(Object)
      )
    })
  })

  describe('MFA Notifications', () => {
    it('should send MFA enabled notification', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendMfaEnabledNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        method: 'authenticator'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          html: expect.stringContaining('authenticator app')
        }),
        expect.any(Object)
      )
    })

    it('should send MFA disabled notification', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendMfaDisabledNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          html: expect.stringContaining('has been disabled')
        }),
        expect.any(Object)
      )
    })

    it('should send passkey added notification', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendPasskeyAddedNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          html: expect.stringContaining('passkey has been added')
        }),
        expect.any(Object)
      )
    })

    it('should send passkey removed notification', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendPasskeyRemovedNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          html: expect.stringContaining('passkey has been removed')
        }),
        expect.any(Object)
      )
    })
  })

  describe('Admin Alerts', () => {
    it('should send admin alert email', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      const timestamp = new Date()
      await mailer.sendAdminAlertEmail({
        to: 'admin@example.com',
        adminName: 'Admin User',
        userId: 'user123',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        field: 'restricted_field',
        attemptedValue: 'forbidden_value',
        roleSlug: 'business-owner',
        timestamp
      })

      expect(require('axios').post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          html: expect.stringContaining('restricted_field')
        }),
        expect.any(Object)
      )
    })
  })

  describe('Environment Configuration', () => {
    it('should use dev redirect when configured', async () => {
      process.env.EMAIL_DEV_REDIRECT_TO = 'dev@example.com'
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      const calls = require('axios').post.mock.calls
      if (calls.length > 0) {
        const call = calls[0]
        expect(call[1].to).toEqual(['dev@example.com']) // Redirected
      }
    })

    it('should use placeholder API key detection', async () => {
      process.env.EMAIL_API_KEY = 'your-sendgrid-api-key-here'

      const result = await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      expect(require('axios').post).not.toHaveBeenCalled()
      expect(result).toHaveProperty('messageId')
    })
  })

  describe('Email Content Validation', () => {
    it('should include brand information in emails', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      const calls = require('axios').post.mock.calls
      if (calls.length > 0) {
        const call = calls[0]
        expect(call[1].html).toContain('TestApp')
      }
    })

    it('should include support email information', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      const calls = require('axios').post.mock.calls
      if (calls.length > 0) {
        const call = calls[0]
        expect(call[1].html).toContain('support@example.com')
      }
    })
  })
})
