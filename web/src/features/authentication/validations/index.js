// Centralized validation exports to simplify imports across the app.
// Avoid duplicate names by aliasing where rules overlap across contexts.

// Sign-up rules
export {
  firstNameRules,
  lastNameRules,
  phoneNumberRules,
  emailRules,
  termsRules,
  businessNameRules,
  businessTypeRules,
  yearsInBusinessRules,
  serviceAreasRules,
  businessPhoneRules,
  businessEmailRules,
  businessDescriptionRules,
  businessAddressRules,
  cityRules,
  provinceRules,
  zipCodeRules,
  serviceCategoriesRules,
  createServiceAreasSupportedRule,
  // Aliased to avoid collision with change password rules
  passwordRules as signUpPasswordRules,
  confirmPasswordRules as signUpConfirmPasswordRules,
} from './signUpRules.js'

// Change password rules — alias to unique names
export {
  passwordRules as changePasswordRules,
  confirmPasswordRules as changeConfirmPasswordRules,
} from './changePasswordRules.js'

// Login rules
export { loginEmailRules, loginPasswordRules } from './loginRules.js'

// Forgot password rules
export { forgotPasswordEmailRules } from './forgotPasswordRules.js'