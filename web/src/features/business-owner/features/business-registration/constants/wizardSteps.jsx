import React from 'react'
import {
  FileTextOutlined,
  FormOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

export const wizardSteps = [
  {
    key: 'application-type',
    title: 'Application Type',
    description: 'Type & Organization',
    icon: <FileTextOutlined />
  },
  {
    key: 'taxpayer-info',
    title: 'Taxpayer Info',
    description: 'Business & Owner Details',
    icon: <FormOutlined />
  },
  {
    key: 'addresses',
    title: 'Addresses',
    description: 'Business, Owner & Lessor',
    icon: <EnvironmentOutlined />
  },
  {
    key: 'business-activities',
    title: 'Business Activities',
    description: 'Tax Code & PSIC',
    icon: <ShopOutlined />
  },
  {
    key: 'capital',
    title: 'Capital & Financial',
    description: 'Investment & MEV',
    icon: <DollarOutlined />
  },
  {
    key: 'accreditations',
    title: 'Accreditations',
    description: 'DTI, SEC, BIR, etc.',
    icon: <SafetyCertificateOutlined />
  },
  {
    key: 'review-submit',
    title: 'Review & Submit',
    description: 'Oath & Final Review',
    icon: <CheckCircleOutlined />
  },
  {
    key: 'status',
    title: 'Status',
    description: 'Track Progress',
    icon: <ClockCircleOutlined />
  }
]

// Legacy steps mapping for backward compatibility
export const LEGACY_STEP_KEYS = [
  'requirements', 'form', 'documents', 'bir', 'agencies', 'review', 'submit', 'status'
]
