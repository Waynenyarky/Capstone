import OnboardingStepContent from './OnboardingStepContent.jsx'
import { Form } from '@/shared/components/AppForm'

export default {
  title: 'Shared/OnboardingStepContent',
  component: OnboardingStepContent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

const [form] = Form.useForm()

const mockHandleFinish = async (values) => {
  console.log('Form submitted:', values)
}

export const AdminWelcome = {
  args: {
    variant: 'admin',
    currentStep: 0,
    setCurrentStep: () => {},
    mustChange: true,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: false,
    mfaEnabled: false,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Admin variant - Step 0: Welcome screen',
  },
}

export const StaffWelcome = {
  args: {
    variant: 'staff',
    currentStep: 0,
    setCurrentStep: () => {},
    mustChange: true,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: false,
    mfaEnabled: false,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Staff variant - Step 0: Welcome screen',
  },
}

export const PasswordChange = {
  args: {
    variant: 'admin',
    currentStep: 1,
    setCurrentStep: () => {},
    mustChange: true,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: false,
    mfaEnabled: false,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Step 1: Set new password form with strength indicator',
  },
}

export const PasswordExpired = {
  args: {
    variant: 'admin',
    currentStep: 1,
    setCurrentStep: () => {},
    mustChange: true,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: false,
    mfaEnabled: false,
    onComplete: () => {},
    passwordExpired: true,
  },
  parameters: {
    storyDescription: 'Step 1: Password expired warning with change form',
  },
}

export const MfaChecking = {
  args: {
    variant: 'admin',
    currentStep: 2,
    setCurrentStep: () => {},
    mustChange: false,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: true,
    mfaEnabled: false,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Step 2: Checking MFA status loading state',
  },
}

export const MfaAlreadyEnabled = {
  args: {
    variant: 'admin',
    currentStep: 2,
    setCurrentStep: () => {},
    mustChange: false,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: false,
    mfaEnabled: true,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Step 2: MFA already enabled - show continue button',
  },
}

export const MfaSetup = {
  args: {
    variant: 'admin',
    currentStep: 2,
    setCurrentStep: () => {},
    mustChange: false,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: false,
    mfaEnabled: false,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Step 2: MFA setup with QR code and verification',
  },
}

export const AdminComplete = {
  args: {
    variant: 'admin',
    currentStep: 3,
    setCurrentStep: () => {},
    mustChange: false,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: false,
    mfaEnabled: true,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Step 3: Admin complete - go to admin dashboard',
  },
}

export const StaffComplete = {
  args: {
    variant: 'staff',
    currentStep: 3,
    setCurrentStep: () => {},
    mustChange: false,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: false,
    checkingMfa: false,
    mfaEnabled: true,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Step 3: Staff complete - go to staff dashboard',
  },
}

export const SubmittingPassword = {
  args: {
    variant: 'admin',
    currentStep: 1,
    setCurrentStep: () => {},
    mustChange: true,
    form,
    handleCredentialsFinish: mockHandleFinish,
    submitting: true,
    checkingMfa: false,
    mfaEnabled: false,
    onComplete: () => {},
    passwordExpired: false,
  },
  parameters: {
    storyDescription: 'Step 1: Password form submitting state',
  },
}
