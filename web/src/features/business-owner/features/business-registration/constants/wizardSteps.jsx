import React from 'react'
import {
  FileTextOutlined,
  FormOutlined,
  UploadOutlined,
  BankOutlined,
  TeamOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

export const wizardSteps = [
  {
    key: 'requirements',
    title: 'Requirements',
    description: 'Checklist',
    icon: <FileTextOutlined />
  },
  {
    key: 'form',
    title: 'Application Form',
    description: 'Business Details',
    icon: <FormOutlined />
  },
  {
    key: 'documents',
    title: 'LGU Documents',
    description: 'Upload Files',
    icon: <UploadOutlined />
  },
  {
    key: 'bir',
    title: 'BIR Registration',
    description: 'BIR Info',
    icon: <BankOutlined />
  },
  {
    key: 'agencies',
    title: 'Other Agencies',
    description: 'SSS, PhilHealth',
    icon: <TeamOutlined />
  },
  {
    key: 'review',
    title: 'Review',
    description: 'Check Details',
    icon: <EyeOutlined />
  },
  {
    key: 'submit',
    title: 'Submit',
    description: 'Final Step',
    icon: <CheckCircleOutlined />
  },
  {
    key: 'status',
    title: 'Status',
    description: 'Track Progress',
    icon: <ClockCircleOutlined />
  }
]
