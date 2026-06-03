/**
 * Test data generators for E2E auth tests
 */

function generateTestEmail(prefix = 'test') {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `${prefix}${timestamp}${random}@example.com`
}

function generateTestPhone() {
  const random = Math.floor(Math.random() * 10000000)
  return `09${String(random).padStart(9, '0')}` // Format: 09XXXXXXXXX (11 digits)
}

const testUsers = {
  businessOwner: {
    email: () => generateTestEmail('businessowner'),
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Owner',
    role: 'business_owner',
    phoneNumber: () => generateTestPhone(),
  },
  admin: {
    email: () => generateTestEmail('admin'),
    password: 'AdminPassword123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin',
    phoneNumber: () => generateTestPhone(),
  },
  lguOfficer: {
    email: () => generateTestEmail('lguofficer'),
    password: 'OfficerPassword123!',
    firstName: 'Test',
    lastName: 'Officer',
    role: 'lgu_officer',
    phoneNumber: () => generateTestPhone(),
  },
  inspector: {
    email: () => generateTestEmail('inspector'),
    password: 'InspectorPassword123!',
    firstName: 'Test',
    lastName: 'Inspector',
    role: 'inspector',
    phoneNumber: () => generateTestPhone(),
  },
}

const testPasswords = {
  valid: 'TestPassword123!',
  weak: 'weak',
  tooShort: 'Short1!',
  noNumber: 'NoNumberPassword!',
  noUppercase: 'nouppercase123!',
  noLowercase: 'NOLOWERCASE123!',
  noSpecial: 'NoSpecialCharacter123',
  tooLong: 'A'.repeat(201) + '1a!',
}

const testTotpSecret = 'JBSWY3DPEHPK3PXP' // Test secret for predictable TOTP codes

export {
  generateTestEmail,
  generateTestPhone,
  testUsers,
  testPasswords,
  testTotpSecret,
}
