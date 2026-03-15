const dataMasker = require('../../services/auth-service/src/lib/dataMasker')

describe('Data Masker Service', () => {
  describe('maskSensitiveData', () => {
    it('should return original for null/undefined', () => {
      expect(dataMasker.maskSensitiveData(null)).toBe(null)
      expect(dataMasker.maskSensitiveData(undefined)).toBe(undefined)
    })

    it('should mask password fields', () => {
      const auditLog = {
        fieldChanged: 'password',
        oldValue: 'oldpassword123',
        newValue: 'newpassword456'
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.oldValue).toBe('[REDACTED]')
      expect(masked.newValue).toBe('[REDACTED]')
      expect(masked.fieldChanged).toBe('password')
    })

    it('should mask email when MASK_EMAIL_IN_AUDIT is true', () => {
      const originalEnv = process.env.MASK_EMAIL_IN_AUDIT
      process.env.MASK_EMAIL_IN_AUDIT = 'true'

      const auditLog = {
        fieldChanged: 'email',
        oldValue: 'user@example.com',
        newValue: 'newuser@example.com'
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.oldValue).toBe('us**@example.com')
      expect(masked.newValue).toBe('ne****@example.com')

      // Restore environment
      process.env.MASK_EMAIL_IN_AUDIT = originalEnv
    })

    it('should not mask email when MASK_EMAIL_IN_AUDIT is false', () => {
      const originalEnv = process.env.MASK_EMAIL_IN_AUDIT
      process.env.MASK_EMAIL_IN_AUDIT = 'false'

      const auditLog = {
        fieldChanged: 'email',
        oldValue: 'user@example.com',
        newValue: 'newuser@example.com'
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.oldValue).toBe('user@example.com')
      expect(masked.newValue).toBe('newuser@example.com')

      // Restore environment
      process.env.MASK_EMAIL_IN_AUDIT = originalEnv
    })

    it('should mask sensitive metadata fields', () => {
      const auditLog = {
        fieldChanged: 'profile',
        oldValue: 'oldvalue',
        newValue: 'newvalue',
        metadata: {
          newPasswordHash: 'hashedpassword123',
          passwordHash: 'hashedpassword456',
          apiKey: 'secret-api-key-123',
          token: 'jwt-token-456',
          safeField: 'this is safe'
        }
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.metadata.newPasswordHash).toBe('[REDACTED]')
      expect(masked.metadata.passwordHash).toBe('[REDACTED]')
      expect(masked.metadata.apiKey).toBe('[REDACTED]')
      expect(masked.metadata.token).toBe('[REDACTED]')
      expect(masked.metadata.safeField).toBe('this is safe')
    })

    it('should handle missing metadata gracefully', () => {
      const auditLog = {
        fieldChanged: 'profile',
        oldValue: 'oldvalue',
        newValue: 'newvalue'
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.metadata).toBeUndefined()
      expect(masked.fieldChanged).toBe('profile')
    })

    it('should preserve non-sensitive fields', () => {
      const auditLog = {
        fieldChanged: 'firstName',
        oldValue: 'John',
        newValue: 'Jane',
        userId: 'user123',
        timestamp: new Date()
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.fieldChanged).toBe('firstName')
      expect(masked.oldValue).toBe('John')
      expect(masked.newValue).toBe('Jane')
      expect(masked.userId).toBe('user123')
      expect(masked.timestamp).toBe(auditLog.timestamp)
    })
  })

  describe('maskEmail', () => {
    it('should return original for null/undefined', () => {
      expect(dataMasker.maskEmail(null)).toBe(null)
      expect(dataMasker.maskEmail(undefined)).toBe(undefined)
    })

    it('should return original for non-string values', () => {
      expect(dataMasker.maskEmail(123)).toBe(123)
      expect(dataMasker.maskEmail({})).toEqual({})
    })

    it('should return original for invalid email', () => {
      expect(dataMasker.maskEmail('invalid-email')).toBe('invalid-email')
      expect(dataMasker.maskEmail('')).toBe('')
    })

    it('should mask email with long local part', () => {
      const email = 'username@example.com'
      const masked = dataMasker.maskEmail(email)
      expect(masked).toBe('us****@example.com')
    })

    it('should mask email with short local part', () => {
      const email = 'ab@example.com'
      const masked = dataMasker.maskEmail(email)
      expect(masked).toBe('ab@example.com')
    })

    it('should mask email with single character local part', () => {
      const email = 'a@example.com'
      const masked = dataMasker.maskEmail(email)
      expect(masked).toBe('a@example.com')
    })

    it('should limit masking to 4 asterisks', () => {
      const email = 'verylongusername@example.com'
      const masked = dataMasker.maskEmail(email)
      expect(masked).toBe('ve****@example.com')
    })

    it('should handle complex domain', () => {
      const email = 'user@sub.domain.com'
      const masked = dataMasker.maskEmail(email)
      expect(masked).toBe('us**@sub.domain.com')
    })
  })

  describe('maskPhoneNumber', () => {
    it('should return original for null/undefined', () => {
      expect(dataMasker.maskPhoneNumber(null)).toBe(null)
      expect(dataMasker.maskPhoneNumber(undefined)).toBe(undefined)
    })

    it('should return original for non-string values', () => {
      expect(dataMasker.maskPhoneNumber(123)).toBe(123)
      expect(dataMasker.maskPhoneNumber({})).toEqual({})
    })

    it('should mask long phone numbers', () => {
      const phone = '1234567890'
      const masked = dataMasker.maskPhoneNumber(phone)
      expect(masked).toBe('******7890')
    })

    it('should mask short phone numbers', () => {
      const phone = '1234'
      const masked = dataMasker.maskPhoneNumber(phone)
      expect(masked).toBe('****')
    })

    it('should handle very short phone numbers', () => {
      const phone = '123'
      const masked = dataMasker.maskPhoneNumber(phone)
      expect(masked).toBe('***')
    })

    it('should handle empty phone number', () => {
      const phone = ''
      const masked = dataMasker.maskPhoneNumber(phone)
      expect(masked).toBe('')
    })

    it('should handle phone numbers with formatting', () => {
      const phone = '(123) 456-7890'
      const masked = dataMasker.maskPhoneNumber(phone)
      expect(masked).toBe('**********7890')
    })
  })

  describe('maskIdNumber', () => {
    it('should return original for null/undefined', () => {
      expect(dataMasker.maskIdNumber(null)).toBe(null)
      expect(dataMasker.maskIdNumber(undefined)).toBe(undefined)
    })

    it('should return original for non-string values', () => {
      expect(dataMasker.maskIdNumber(123)).toBe(123)
      expect(dataMasker.maskIdNumber({})).toEqual({})
    })

    it('should mask long ID numbers', () => {
      const id = '123456789012'
      const masked = dataMasker.maskIdNumber(id)
      expect(masked).toBe('********9012')
    })

    it('should mask short ID numbers', () => {
      const id = '1234'
      const masked = dataMasker.maskIdNumber(id)
      expect(masked).toBe('****')
    })

    it('should handle very short ID numbers', () => {
      const id = '123'
      const masked = dataMasker.maskIdNumber(id)
      expect(masked).toBe('***')
    })

    it('should handle empty ID number', () => {
      const id = ''
      const masked = dataMasker.maskIdNumber(id)
      expect(masked).toBe('')
    })
  })

  describe('maskCardNumber', () => {
    it('should return original for null/undefined', () => {
      expect(dataMasker.maskCardNumber(null)).toBe(null)
      expect(dataMasker.maskCardNumber(undefined)).toBe(undefined)
    })

    it('should return original for non-string values', () => {
      expect(dataMasker.maskCardNumber(123)).toBe(123)
      expect(dataMasker.maskCardNumber({})).toEqual({})
    })

    it('should mask long card numbers', () => {
      const card = '1234567890123456'
      const masked = dataMasker.maskCardNumber(card)
      expect(masked).toBe('************3456')
    })

    it('should mask card numbers with spaces', () => {
      const card = '1234 5678 9012 3456'
      const masked = dataMasker.maskCardNumber(card)
      expect(masked).toBe('************3456')
    })

    it('should mask short card numbers', () => {
      const card = '1234'
      const masked = dataMasker.maskCardNumber(card)
      expect(masked).toBe('****')
    })

    it('should handle very short card numbers', () => {
      const card = '123'
      const masked = dataMasker.maskCardNumber(card)
      expect(masked).toBe('***')
    })

    it('should handle empty card number', () => {
      const card = ''
      const masked = dataMasker.maskCardNumber(card)
      expect(masked).toBe('')
    })

    it('should handle card numbers with dashes', () => {
      const card = '1234-5678-9012-3456'
      const masked = dataMasker.maskCardNumber(card)
      expect(masked).toBe('***************3456')
    })
  })

  describe('Edge Cases', () => {
    it('should handle complex audit log with multiple sensitive fields', () => {
      const originalEnv = process.env.MASK_EMAIL_IN_AUDIT
      process.env.MASK_EMAIL_IN_AUDIT = 'true'

      const auditLog = {
        fieldChanged: 'password',
        oldValue: 'oldpassword123',
        newValue: 'newpassword456',
        metadata: {
          newPasswordHash: 'hashedpassword123',
          apiKey: 'secret-api-key-123',
          token: 'jwt-token-456'
        }
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.oldValue).toBe('[REDACTED]')
      expect(masked.newValue).toBe('[REDACTED]')
      expect(masked.metadata.newPasswordHash).toBe('[REDACTED]')
      expect(masked.metadata.apiKey).toBe('[REDACTED]')
      expect(masked.metadata.token).toBe('[REDACTED]')

      // Restore environment
      process.env.MASK_EMAIL_IN_AUDIT = originalEnv
    })

    it('should not modify original object', () => {
      const auditLog = {
        fieldChanged: 'password',
        oldValue: 'oldpassword123',
        newValue: 'newpassword456'
      }

      const original = JSON.parse(JSON.stringify(auditLog))
      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(auditLog.oldValue).toBe(original.oldValue)
      expect(auditLog.newValue).toBe(original.newValue)
      expect(masked.oldValue).toBe('[REDACTED]')
      expect(masked.newValue).toBe('[REDACTED]')
    })

    it('should handle nested metadata objects', () => {
      const auditLog = {
        fieldChanged: 'profile',
        metadata: {
          user: {
            passwordHash: 'hashed123',
            safeField: 'safe value'
          },
          apiKey: 'secret-key'
        }
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.metadata.user.passwordHash).toBe('hashed123') // Only masks top-level fields
      expect(masked.metadata.user.safeField).toBe('safe value')
      expect(masked.metadata.apiKey).toBe('[REDACTED]')
    })
  })

  describe('Security Considerations', () => {
    it('should consistently mask the same input', () => {
      const email = 'username@example.com'
      const masked1 = dataMasker.maskEmail(email)
      const masked2 = dataMasker.maskEmail(email)

      expect(masked1).toBe(masked2)
    })

    it('should not reveal length of sensitive data in metadata', () => {
      const auditLog = {
        fieldChanged: 'password',
        metadata: {
          passwordHash: 'verylonghashedpassword123456789'
        }
      }

      const masked = dataMasker.maskSensitiveData(auditLog)

      expect(masked.metadata.passwordHash).toBe('[REDACTED]')
      expect(masked.metadata.passwordHash.length).toBe('[REDACTED]'.length)
    })

    it('should handle Unicode characters in emails', () => {
      const email = 'üsername@example.com'
      const masked = dataMasker.maskEmail(email)
      expect(masked).toBe('üs****@example.com')
    })

    it('should handle special characters in phone numbers', () => {
      const phone = '+1 (123) 456-7890 ext. 123'
      const masked = dataMasker.maskPhoneNumber(phone)
      expect(masked).toBe('********************** 123')
    })
  })
})
