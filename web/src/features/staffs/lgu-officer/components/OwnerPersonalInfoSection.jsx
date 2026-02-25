import React from 'react'
import { Descriptions } from 'antd'
import dayjs from 'dayjs'

const formatDate = (date) => {
  if (!date) return 'N/A'
  return dayjs(date).format('MMM D, YYYY')
}

export default function OwnerPersonalInfoSection({ application, ownerIdentity, businessReg, ownerName }) {
  const maritalStatus = application?.businessOwner?.maritalStatus || ownerIdentity?.maritalStatus

  return (
    <Descriptions
      bordered
      column={2}
      size="small"
    >
        <Descriptions.Item label="Full Name">
          {ownerName}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {businessReg?.emailAddress || application?.businessOwner?.email || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Phone Number">
          {businessReg?.mobileNumber || application?.businessOwner?.phoneNumber || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Sex">
          {application?.businessOwner?.sex || ownerIdentity?.sex || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Marital Status">
          {maritalStatus || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Date of Birth">
          {formatDate(application?.businessOwner?.dateOfBirth || ownerIdentity?.dateOfBirth)}
        </Descriptions.Item>
        <Descriptions.Item label="Place of Birth">
          {application?.businessOwner?.placeOfBirth || ownerIdentity?.placeOfBirth || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Nationality">
          {application?.businessOwner?.nationality || ownerIdentity?.nationality || businessReg?.ownerNationality || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Education">
          {application?.businessOwner?.highestEducationalAttainment || ownerIdentity?.highestEducationalAttainment || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Address" span={2}>
          {[
            application?.businessOwner?.address?.street || ownerIdentity?.address?.street,
            application?.businessOwner?.address?.barangay || ownerIdentity?.address?.barangay,
            application?.businessOwner?.address?.city || ownerIdentity?.address?.city,
            application?.businessOwner?.address?.province || ownerIdentity?.address?.province,
            application?.businessOwner?.address?.zipCode || ownerIdentity?.address?.zipCode
          ].filter(Boolean).join(', ') || businessReg?.ownerResidentialAddress || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Father's Name">
          {application?.businessOwner?.fatherName || ownerIdentity?.fatherName || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Mother's Name">
          {application?.businessOwner?.motherName || ownerIdentity?.motherName || 'N/A'}
        </Descriptions.Item>
        {maritalStatus === 'married' && (
          <Descriptions.Item label="Spouse Name">
            {application?.businessOwner?.spouseName || ownerIdentity?.spouseName || 'N/A'}
          </Descriptions.Item>
        )}
        {(application?.businessOwner?.distinctiveMark || ownerIdentity?.distinctiveMark) && (
          <Descriptions.Item label="Distinctive Mark">
            {application?.businessOwner?.distinctiveMark || ownerIdentity?.distinctiveMark}
          </Descriptions.Item>
        )}
    </Descriptions>
  )
}
