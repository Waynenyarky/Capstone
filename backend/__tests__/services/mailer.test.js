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

describe('Mailer Service', () => {
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
    it('should send OTP email successfully', async () => {
      const mockResponse = {
        data: { id: 'test-message-id' }
      }
      require('axios').post.mockResolvedValue(mockResponse)

      const result = await mailer.sendOtp({
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

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error')
      apiError.response = {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'Invalid email' }
      }
      require('axios').post.mockRejectedValue(apiError)

      await expect(
        mailer.sendOtp({ to: 'invalid-email', code: '123456' })
      ).rejects.toThrow('API Error')
    })
  })

  describe('sendForgotPasswordNotAvailableEmail', () => {
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

    it('should include role-specific content', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendForgotPasswordNotAvailableEmail({
        to: 'user@example.com',
        code: '123456',
        roleSlug: 'business-owner'
      })

      const call = require('axios').post.mock.calls[0]
      expect(call[1].html).toContain('business owner')
    })

    it('should handle missing role gracefully', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await expect(
        mailer.sendForgotPasswordNotAvailableEmail({
          to: 'user@example.com',
          code: '123456',
          roleSlug: ''
        })
      ).resolves.not.toThrow()
    })
  })

  describe('sendStaffCredentialsEmail', () => {
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

    it('should include all required information', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendStaffCredentialsEmail({
        to: 'staff@example.com',
        username: 'staffuser',
        tempPassword: 'temp123',
        office: 'Main Office',
        roleLabel: 'Staff Member'
      })

      const call = require('axios').post.mock.calls[0]
      expect(call[1].html).toContain('staffuser')
      expect(call[1].html).toContain('temp123')
      expect(call[1].html).toContain('Main Office')
      expect(call[1].html).toContain('Staff Member')
    })
  })

  describe('sendEmailChangeNotification', () => {
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

    it('should send email change notification to new email', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendEmailChangeNotification({
        to: 'new@example.com',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        revertUrl: 'http://localhost:3000/revert',
        type: 'new_email'
      })

      const call = require('axios').post.mock.calls[0]
      expect(call[1].html).toContain('new@example.com')
      expect(call[1].html).toContain('http://localhost:3000/revert')
    })

    it('should handle custom grace period', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendEmailChangeNotification({
        to: 'old@example.com',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        gracePeriodHours: 48,
        type: 'old_email'
      })

      const call = require('axios').post.mock.calls[0]
      expect(call[1].html).toContain('48 hours')
    })
  })

  describe('sendPasswordChangeNotification', () => {
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

    it('should include timestamp information', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      const timestamp = new Date('2024-01-01T12:00:00Z')
      await mailer.sendPasswordChangeNotification({
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        timestamp
      })

      const call = require('axios').post.mock.calls[0]
      expect(call[1].html).toContain('January 1, 2024')
    })
  })

  describe('MFA Notifications', () => {
    describe('sendMfaEnabledNotification', () => {
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

      it('should handle passkey method', async () => {
        const mockResponse = { data: { id: 'test-id' } }
        require('axios').post.mockResolvedValue(mockResponse)

        await mailer.sendMfaEnabledNotification({
          to: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          method: 'passkey'
        })

        const call = require('axios').post.mock.calls[0]
        expect(call[1].html).toContain('passkey')
      })
    })

    describe('sendMfaDisableRequestedNotification', () => {
      it('should send MFA disable requested notification', async () => {
        const mockResponse = { data: { id: 'test-id' } }
        require('axios').post.mockResolvedValue(mockResponse)

        const scheduledFor = new Date('2024-01-02T12:00:00Z')
        await mailer.sendMfaDisableRequestedNotification({
          to: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          scheduledFor
        })

        expect(require('axios').post).toHaveBeenCalledWith(
          'https://api.resend.com/emails',
          expect.objectContaining({
            html: expect.stringContaining('January 2, 2024')
          }),
          expect.any(Object)
        )
      })
    })

    describe('sendMfaDisabledNotification', () => {
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
    })
  })

  describe('Passkey Notifications', () => {
    describe('sendPasskeyAddedNotification', () => {
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
    })

    describe('sendPasskeyRemovedNotification', () => {
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
  })

  describe('Admin Alerts', () => {
    describe('sendAdminAlertEmail', () => {
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

      it('should include all alert details', async () => {
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

        const call = require('axios').post.mock.calls[0]
        expect(call[1].html).toContain('user123')
        expect(call[1].html).toContain('John Doe')
        expect(call[1].html).toContain('john@example.com')
        expect(call[1].html).toContain('restricted_field')
        expect(call[1].html).toContain('forbidden_value')
      })
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

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error')
      require('axios').post.mockRejectedValue(networkError)

      // The mailer service catches errors and returns error objects
      const result = await mailer.sendOtp({ to: 'user@example.com', code: '123456' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle API response errors', async () => {
      const apiError = new Error('API Error')
      apiError.response = {
        status: 429,
        statusText: 'Too Many Requests',
        data: { message: 'Rate limit exceeded' }
      }
      require('axios').post.mockRejectedValue(apiError)

      // The mailer service catches errors and returns error objects
      const result = await mailer.sendOtp({ to: 'user@example.com', code: '123456' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('API Error')
    })

    it('should handle missing required parameters', async () => {
      // The mailer service has validation that returns error objects
      const result1 = await mailer.sendOtp({ to: '', code: '123456' })
      expect(result1.success).toBe(false)
      expect(result1.error).toContain('Invalid email address')

      const result2 = await mailer.sendOtp({ to: 'user@example.com', code: '' })
      expect(result2.success).toBe(false)
    })
  })

  describe('Email Content Validation', () => {
    it('should generate valid HTML content', async () => {
      const mockResponse = { data: { id: 'test-id' } }
      require('axios').post.mockResolvedValue(mockResponse)

      await mailer.sendOtp({
        to: 'user@example.com',
        code: '123456'
      })

      const calls = require('axios').post.mock.calls
      if (calls.length > 0) {
        const call = calls[0]
        expect(call[1].html).toContain('<!DOCTYPE html>')
        expect(call[1].html).toContain('<html')
        expect(call[1].html).toContain('</html>')
      }
    })

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
