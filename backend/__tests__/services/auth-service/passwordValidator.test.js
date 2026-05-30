const {
  validatePasswordStrength,
  isPasswordInHistory,
} = require('../../../services/auth-service/src/lib/passwordValidator')

describe('Auth Service - Password Validator Library', () => {
  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = validatePasswordStrength('StrongP@ssw0rd123!')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 12 characters', () => {
      const result = validatePasswordStrength('Short1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 12 characters long')
    })

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('NOLOWERCASE123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('nouppercase123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumberPassword!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('NoSpecialCharacter123')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    it('should reject password longer than 200 characters', () => {
      const longPassword = 'A'.repeat(201) + '1a!'
      const result = validatePasswordStrength(longPassword)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be no more than 200 characters long')
    })

    it('should reject empty password', () => {
      const result = validatePasswordStrength('')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password is required')
    })

    it('should reject null password', () => {
      const result = validatePasswordStrength(null)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password is required')
    })

    it('should reject non-string password', () => {
      const result = validatePasswordStrength(123456)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password is required')
    })

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })

    it('should accept exactly 12 character password', () => {
      const result = validatePasswordStrength('ValidP@ss123')
      expect(result.valid).toBe(true)
    })

    it('should accept exactly 200 character password', () => {
      const validPassword = 'A'.repeat(190) + '1a!'
      const result = validatePasswordStrength(validPassword)
      expect(result.valid).toBe(true)
    })
  })

  describe('isPasswordInHistory', () => {
    it('should return false for empty history', () => {
      const result = isPasswordInHistory('hash1', [])
      expect(result).toBe(false)
    })

    it('should return false if password not in history', () => {
      const history = ['hash1', 'hash2', 'hash3']
      const result = isPasswordInHistory('hash4', history)
      expect(result).toBe(false)
    })

    it('should return true if password is in history', () => {
      const history = ['hash1', 'hash2', 'hash3']
      const result = isPasswordInHistory('hash2', history)
      expect(result).toBe(true)
    })

    it('should only check last maxHistory passwords', () => {
      const history = ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6']
      const result = isPasswordInHistory('hash1', history, 5)
      expect(result).toBe(false) // hash1 is outside the last 5
    })

    it('should check last password with maxHistory=1', () => {
      const history = ['hash1', 'hash2', 'hash3']
      const result = isPasswordInHistory('hash3', history, 1)
      expect(result).toBe(true)
    })

    it('should handle null passwordHash', () => {
      const result = isPasswordInHistory(null, ['hash1'])
      expect(result).toBe(false)
    })

    it('should handle non-array history', () => {
      const result = isPasswordInHistory('hash1', 'not-an-array')
      expect(result).toBe(false)
    })

    it('should use default maxHistory of 5', () => {
      const history = ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6']
      const result = isPasswordInHistory('hash1', history)
      expect(result).toBe(false)
    })
  })
})
