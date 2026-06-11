import EmailTemplate from './EmailTemplate'

export default {
  title: 'Email Templates',
  component: EmailTemplate,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

// OTP Email - Login
export const OtpLogin = {
  args: {
    subject: 'Your verification code',
    heading: 'Verification Code',
    intro: 'You recently requested to sign in to your BizClear account. Use the code below to complete your verification.',
    code: '123456',
    expiry: '10',
    brandName: 'BizClear',
  },
}

// OTP Email - Signup
export const OtpSignup = {
  args: {
    subject: 'Verify Your Email',
    heading: 'Verify Your Email',
    intro: "You're signing up for BizClear. Use the code below to verify your email and complete registration.",
    code: '654321',
    expiry: '10',
    brandName: 'BizClear',
  },
}

// OTP Email - Password Reset
export const OtpPasswordReset = {
  args: {
    subject: 'Reset Your Password',
    heading: 'Reset Your Password',
    intro: 'You requested to reset your password. Use the code below to set a new password. If you didn\'t request this, you can safely ignore this email.',
    code: '789012',
    expiry: '10',
    brandName: 'BizClear',
  },
}

// OTP Email - Email Change
export const OtpEmailChange = {
  args: {
    subject: 'Confirm Email Change',
    heading: 'Confirm Email Change',
    intro: 'You requested to change the email address for your account. Use the code below to confirm this change.',
    code: '345678',
    expiry: '10',
    brandName: 'BizClear',
  },
}

// OTP Email - Account Deletion
export const OtpAccountDeletion = {
  args: {
    subject: 'Confirm Account Deletion',
    heading: 'Confirm Account Deletion',
    intro: 'You requested to permanently delete your account. Use the code below to confirm account deletion. This action cannot be undone after the grace period.',
    code: '901234',
    expiry: '10',
    brandName: 'BizClear',
  },
}

// OTP Email - MFA Setup
export const OtpMfaSetup = {
  args: {
    subject: 'Enable Verification',
    heading: 'Enable Verification',
    intro: "You're enabling fingerprint or additional verification. Use the code below to complete setup.",
    code: '567890',
    expiry: '10',
    brandName: 'BizClear',
  },
}

// Staff Credentials Email
export const StaffCredentials = {
  args: {
    subject: 'Your Staff Account Credentials',
    heading: 'Welcome to the Team!',
    intro: 'Your staff account has been created. Use the credentials below to access the portal.',
    username: 'john.doe',
    tempPassword: 'TempPass123!',
    office: 'Dagupan City LGU',
    role: 'LGU Officer',
    brandName: 'BizClear',
    loginUrl: 'http://localhost:5173/auth/login',
  },
}

// Password Change Notification
export const PasswordChangeNotification = {
  args: {
    subject: 'Password Changed Successfully',
    heading: 'Password Changed',
    intro: 'Your password was successfully changed. If you didn\'t make this change, please contact support immediately.',
    firstName: 'John',
    brandName: 'BizClear',
    supportEmail: 'support@bizclear.com',
  },
}

// MFA Enabled Notification
export const MfaEnabledNotification = {
  args: {
    subject: 'Two-Factor Authentication Enabled',
    heading: 'Two-Factor Authentication Enabled',
    intro: 'Two-factor authentication has been successfully enabled on your account. Your account is now more secure.',
    firstName: 'John',
    brandName: 'BizClear',
  },
}

// MFA Disabled Notification
export const MfaDisabledNotification = {
  args: {
    subject: 'Two-Factor Authentication Disabled',
    heading: 'Two-Factor Authentication Disabled',
    intro: 'Two-factor authentication has been disabled on your account. Consider re-enabling it for better security.',
    firstName: 'John',
    brandName: 'BizClear',
  },
}

// MFA Disable Requested Notification (24-hour delay)
export const MfaDisableRequestedNotification = {
  args: {
    subject: 'Two-Factor Authentication Disable Requested',
    heading: 'MFA Disable Requested',
    intro: 'You requested to disable two-factor authentication. This action will be completed after a 24-hour security delay for your protection.',
    firstName: 'John',
    brandName: 'BizClear',
  },
}

// Passkey Added Notification
export const PasskeyAddedNotification = {
  args: {
    subject: 'Passkey Added',
    heading: 'Passkey Added Successfully',
    intro: 'A new passkey has been added to your account. You can now use it for passwordless authentication.',
    firstName: 'John',
    brandName: 'BizClear',
  },
}

// Passkey Removed Notification
export const PasskeyRemovedNotification = {
  args: {
    subject: 'Passkey Removed',
    heading: 'Passkey Removed',
    intro: 'A passkey has been removed from your account. If you didn\'t make this change, please contact support.',
    firstName: 'John',
    brandName: 'BizClear',
  },
}

// Email Change Notification (Old Email)
export const EmailChangeOldEmail = {
  args: {
    subject: 'Email Change Requested',
    heading: 'Email Change Requested',
    intro: 'A request was made to change the email address associated with your account.',
    oldEmail: 'old.email@example.com',
    newEmail: 'new.email@example.com',
    gracePeriodHours: 24,
    revertUrl: 'http://localhost:5173/account/email/revert',
    brandName: 'BizClear',
  },
}

// Email Change Notification (New Email)
export const EmailChangeNewEmail = {
  args: {
    subject: 'Email Changed Successfully',
    heading: 'Email Changed Successfully',
    intro: 'Your email address has been successfully changed.',
    oldEmail: 'old.email@example.com',
    newEmail: 'new.email@example.com',
    gracePeriodHours: 24,
    brandName: 'BizClear',
  },
}

// Help Request Confirmation
export const HelpRequestConfirmation = {
  args: {
    subject: 'Help Request Received',
    heading: 'Help Request Received',
    intro: 'Thank you for contacting us. We have received your help request and will get back to you as soon as possible.',
    requestId: 'HR-ABC123',
    subjectLine: 'Issue with Business Permit Application',
    brandName: 'BizClear',
  },
}

// Officer Reply Notification
export const OfficerReplyNotification = {
  args: {
    subject: 'New Response to Your Help Request',
    heading: 'New Response Received',
    intro: 'An LGU officer has responded to your help request. Please review their response below.',
    requestId: 'HR-ABC123',
    preview: 'Thank you for your inquiry. We have reviewed your request and...',
    brandName: 'BizClear',
  },
}

// Request Closed Notification
export const RequestClosedNotification = {
  args: {
    subject: 'Help Request Closed',
    heading: 'Help Request Closed',
    intro: 'Your help request has been marked as resolved and closed. If you have any further questions, please submit a new request.',
    requestId: 'HR-ABC123',
    subjectLine: 'Issue with Business Permit Application',
    brandName: 'BizClear',
  },
}

// Request Invalid Notification
export const RequestInvalidNotification = {
  args: {
    subject: 'Help Request Marked as Invalid',
    heading: 'Help Request Invalid',
    intro: 'Your help request has been marked as invalid. This may be due to insufficient information or being outside our scope.',
    requestId: 'HR-ABC123',
    subjectLine: 'Issue with Business Permit Application',
    brandName: 'BizClear',
  },
}

// Staff/Admin Forgot Password Alert
export const StaffAdminForgotPasswordAlert = {
  args: {
    subject: 'Password Reset Attempt Detected',
    heading: 'Password Reset Attempt Detected',
    intro: 'A password reset was attempted for your staff/admin account. Password reset is not available for your account type.',
    adminName: 'John Doe',
    role: 'LGU Officer',
    instruction: 'If you are staff, use Request Recovery from the staff portal.',
    brandName: 'BizClear',
  },
}

// Admin Approval Notification
export const AdminApprovalNotification = {
  args: {
    subject: 'Account Approved',
    heading: 'Account Approved',
    intro: 'Your admin account has been approved. You can now access the admin portal.',
    adminName: 'John Doe',
    brandName: 'BizClear',
    loginUrl: 'http://localhost:5173/auth/login',
  },
}

// Admin Rejection Notification
export const AdminRejectionNotification = {
  args: {
    subject: 'Account Request Rejected',
    heading: 'Account Request Rejected',
    intro: 'Your admin account request has been rejected. Please contact another administrator for more information.',
    adminName: 'John Doe',
    comment: 'Incomplete information provided in application.',
    approverName: 'Admin Smith',
    brandName: 'BizClear',
  },
}

// System Alert
export const SystemAlert = {
  args: {
    subject: 'System alert: high_error_rate - BizClear',
    heading: 'System Alert',
    intro: 'A system alert has been triggered.',
    alertType: 'high_error_rate',
    details: {
      errorRate: '15%',
      threshold: '10%',
      timeWindow: '5 minutes',
      affectedServices: ['auth-service', 'business-service'],
    },
    brandName: 'BizClear',
    appUrl: 'http://localhost:5173/admin',
  },
}

// Tamper Incident
export const TamperIncident = {
  args: {
    subject: 'Audit tamper incident (high) - BizClear',
    heading: 'Audit Tamper Incident',
    intro: 'An audit tamper or integrity issue was detected.',
    severity: 'high',
    verificationStatus: 'tamper_detected',
    message: 'Unexpected modification detected in audit log entry AR-12345',
    detectedAt: new Date().toISOString(),
    brandName: 'BizClear',
    appUrl: 'http://localhost:5173/admin/security',
  },
}

// Admin Alert - Restricted Field Attempt
export const AdminAlertRestrictedField = {
  args: {
    subject: 'Security Alert: Restricted Field Attempt - BizClear',
    heading: 'Security Alert',
    intro: 'A staff user has attempted to modify a restricted field. This action has been blocked and logged.',
    adminName: 'Admin Smith',
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    roleSlug: 'lgu_officer',
    field: 'businesses.applicationStatus',
    attemptedValue: 'approved',
    timestamp: new Date().toISOString(),
    brandName: 'BizClear',
    appUrl: 'http://localhost:5173/admin/audit',
  },
}

// Account Deletion Reminder (TODO - Not yet implemented)
export const AccountDeletionReminder = {
  args: {
    subject: 'Account Deletion Reminder - 7 days remaining',
    heading: 'Account Deletion Reminder',
    intro: 'Your account is scheduled for deletion. You can cancel this action by using your undo token or contacting support.',
    daysRemaining: 7,
    scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    brandName: 'BizClear',
  },
}

// Violation Reminder (TODO - Not yet implemented)
export const ViolationReminder = {
  args: {
    subject: 'Violation Deadline Reminder - 3 days remaining',
    heading: 'Violation Deadline Approaching',
    intro: 'You have a pending violation that must be resolved before the deadline to avoid penalties.',
    violationId: 'VIO-12345',
    violationType: 'Business Permit Renewal',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    businessName: 'Sample Business',
    brandName: 'BizClear',
  },
}

// Inspection Reminder (TODO - Not yet implemented)
export const InspectionReminder = {
  args: {
    subject: 'Inspection Scheduled Tomorrow',
    heading: 'Upcoming Inspection Reminder',
    intro: 'You have an inspection scheduled for tomorrow. Please ensure your business is ready.',
    inspectionId: 'INS-67890',
    inspectionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
    inspectionTime: '10:00 AM',
    businessName: 'Sample Business',
    inspectorName: 'Officer Smith',
    brandName: 'BizClear',
  },
}

// Clearance Notification (TODO - Not yet implemented)
export const ClearanceNotification = {
  args: {
    subject: 'Clearance Status Update',
    heading: 'Clearance Status Update',
    intro: 'There has been an update to your business clearance status.',
    clearanceId: 'CLR-54321',
    status: 'Approved',
    businessName: 'Sample Business',
    brandName: 'BizClear',
  },
}

// Permit Decision Notification - Approved
export const PermitDecisionApproved = {
  args: {
    subject: 'Permit Application BP-2024-001234 - Approved',
    heading: 'Application Approved',
    intro: 'We are pleased to inform you that your permit application has been APPROVED. Your application has been reviewed and meets all requirements.',
    applicationReferenceNumber: 'BP-2024-001234',
    businessName: 'Sample Business',
    firstName: 'John',
    brandName: 'BizClear',
    appUrl: 'http://localhost:5173/owner/permits',
  },
}

// Permit Decision Notification - Rejected
export const PermitDecisionRejected = {
  args: {
    subject: 'Permit Application BP-2024-001234 - Rejected',
    heading: 'Application Rejected',
    intro: 'We regret to inform you that your permit application has been REJECTED. Please review the feedback and submit a new application if needed.',
    applicationReferenceNumber: 'BP-2024-001234',
    businessName: 'Sample Business',
    firstName: 'John',
    rejectionReason: 'Incomplete documentation: Missing business permit and valid ID.',
    brandName: 'BizClear',
    appUrl: 'http://localhost:5173/owner/permits',
  },
}

// Permit Decision Notification - Corrections Required
export const PermitDecisionCorrectionsRequired = {
  args: {
    subject: 'Permit Application BP-2024-001234 - Corrections Required',
    heading: 'Corrections Required',
    intro: 'Your permit application requires corrections before it can be approved. Please make the necessary corrections and resubmit your application for review.',
    applicationReferenceNumber: 'BP-2024-001234',
    businessName: 'Sample Business',
    firstName: 'John',
    rejectionReason: 'Please update your business address and upload a valid ID.',
    brandName: 'BizClear',
    appUrl: 'http://localhost:5173/owner/permits',
  },
}

// Login OTP - Account Deletion Scheduled (special subject)
export const LoginOtpDeletionScheduled = {
  args: {
    subject: 'Your Login Verification Code - Account Deletion Scheduled',
    heading: 'Verification Code',
    intro: 'You recently requested to sign in to your BizClear account. Use the code below to complete your verification.',
    code: '123456',
    firstName: 'John',
    brandName: 'BizClear',
  },
}
