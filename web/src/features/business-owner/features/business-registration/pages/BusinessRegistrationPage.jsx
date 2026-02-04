import React, { useRef, useState } from 'react'
import { Button, Space, Popconfirm, Card, Spin, Empty, Table, Modal } from 'antd'
import { DeleteOutlined, FormOutlined, SaveOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import BusinessOwnerLayout from '../../../views/components/BusinessOwnerLayout'
import BusinessRegistrationWizard from '../components/BusinessRegistrationWizard'
import { useBusinessRegistrationPage } from '../hooks/useBusinessRegistrationPage'

export default function BusinessRegistrationPage() {
  const wizardRef = useRef(null)
  const [isDraftListOpen, setIsDraftListOpen] = useState(false)
  const {
    isAuthenticated,
    businesses,
    selectedBusinessId,
    selectedBusiness,
    isNewBusiness,
    formData,
    primaryBusiness,
    canSaveDraft,
    canGoToDraftList,
    handleBusinessChange,
    handleBusinessSave,
    handleWizardComplete,
    handleSaveDraft,
    handleDelete
  } = useBusinessRegistrationPage()

  const wizardBusinessId = selectedBusinessId ?? 'new'
  const wizardIsNewBusiness = selectedBusinessId == null || isNewBusiness

  const onSaveDraftClick = async () => {
    const saved = await wizardRef.current?.saveDraft?.()
    if (saved) {
      await handleSaveDraft()
      setIsDraftListOpen(true)
    }
  }

  const formatFromDate = (record) => {
    const date = record.updatedAt || record.createdAt
    return date ? dayjs(date).format('MMM D, YYYY [at] h:mm A') : '—'
  }

  const draftColumns = [
    {
      title: 'Draft List',
      key: 'draft',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>From {formatFromDate(record)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
            {record.businessName || 'Unnamed business'}
          </div>
        </div>
      )
    },
    {
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => {
              setIsDraftListOpen(false)
              handleBusinessChange(record.businessId)
            }}
          >
            Continue
          </Button>
          <Popconfirm
            title="Delete draft"
            description="Are you sure? This cannot be undone."
            onConfirm={() => handleDelete(record.businessId)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button  danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const goToDraftList = () => {
    setIsDraftListOpen(true)
  }

  if (!isAuthenticated) {
    return (
      <BusinessOwnerLayout pageTitle="Business Registration">
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>Loading...</div>
          </div>
        </Card>
      </BusinessOwnerLayout>
    )
  }

  return (
    <BusinessOwnerLayout
      pageTitle="Business Registration"
      pageIcon={<FormOutlined />}
      headerActions={
        <Space>
          <Button
            icon={<UnorderedListOutlined />}
            onClick={goToDraftList}
            disabled={!canGoToDraftList}
          >
            Draft list
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={onSaveDraftClick}
            disabled={!canSaveDraft}
          >
            Save draft
          </Button>
        </Space>
      }
    >
      <div style={{ paddingTop: 16, paddingBottom: 16 }}>
        <BusinessRegistrationWizard
          ref={wizardRef}
          businessId={wizardBusinessId}
          isNewBusiness={wizardIsNewBusiness}
          formData={formData}
          onComplete={handleWizardComplete}
          onSaveBusiness={handleBusinessSave}
        />
      </div>

      <Modal
        title="Draft List"
        open={isDraftListOpen}
        onCancel={() => setIsDraftListOpen(false)}
        footer={null}
        width={720}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            Select a draft to continue or add a new business.
          </p>
        </div>
        {businesses.length === 0 ? (
          <Empty description="No drafts yet" style={{ marginTop: 16, marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsDraftListOpen(false)
                handleBusinessChange('new')
              }}
            >
              Add new business
            </Button>
          </Empty>
        ) : (
          <Table
            columns={draftColumns}
            dataSource={businesses}
            rowKey="businessId"
            pagination={false}
            showHeader={false}
          />
        )}
        {businesses.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={() => {
                setIsDraftListOpen(false)
                handleBusinessChange('new')
              }}
            >
              Add new business
            </Button>
          </div>
        )}
      </Modal>
    </BusinessOwnerLayout>
  )
}
