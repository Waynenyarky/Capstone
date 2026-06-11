import { Space, Button, Typography, Tag, App } from 'antd'
import { ShopOutlined, BugOutlined, DeleteOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getBusinessDisplayName } from '../../utils/statusUtils'

const { Title } = Typography

export default function ApplicationHeader({
  business,
  isDraft,
  isApproved,
  isNeedsRevision,
  isResubmitted,
  showAddForm,
  formSubmitting,
  isMobile = false,
  onDeleteDraft,
  onSubmitApplication,
  onFillTestData,
  onToggleForm,
  onOpenForm,
  showReadOnlyForm = false,
  allSectionsComplete = false,
  token,
  isAutosaving = false,
  hasUnsavedChanges = false,
  isFooter = false
}) {
  const { modal } = App.useApp()
  const displayName = getBusinessDisplayName(business)

  return (
    <div
      style={{
        flexShrink: 0,
        padding: isMobile ? '12px 16px' : '16px 24px',
        borderTop: isFooter ? `1px solid ${token.colorBorderSecondary}` : undefined,
        borderBottom: !isFooter ? `1px solid ${token.colorBorderSecondary}` : undefined,
        background: token.colorBgContainer,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-end' : 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {!isMobile && (
          <Space size={12}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: token.borderRadius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: token.colorTextSecondary,
                border: `1px solid ${token.colorBorder}`,
              }}
            >
              <ShopOutlined style={{ fontSize: 20 }} />
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={4} style={{ margin: 0 }}>
                {displayName}
              </Title>
              {isDraft && (
                <Tag
                  color={isAutosaving ? 'processing' : hasUnsavedChanges ? 'warning' : 'success'}
                  style={{ fontWeight: 'normal' }}
                >
                  {isAutosaving ? 'Saving...' : hasUnsavedChanges ? 'Unsaved' : 'Saved'}
                </Tag>
              )}
            </div>
          </Space>
        )}
        <Space size="small">
          {!isDraft && !isApproved ? (
            <>
              <Button onClick={() => showReadOnlyForm ? onToggleForm() : onOpenForm?.(business) || onToggleForm()}>
                {showReadOnlyForm || showAddForm
                  ? (isNeedsRevision ? 'View Revision Summary' : isResubmitted ? 'View Resubmission Status' : 'View Progress')
                  : (isNeedsRevision ? 'Review & Fix Application' : isResubmitted ? 'View Submitted Revisions' : 'View Submitted Application')}
              </Button>
              {isNeedsRevision && showAddForm && (
                <Button
                  type="primary"
                  onClick={() => {
                    modal.confirm({
                      title: 'Confirm Application Resubmission',
                      icon: <ExclamationCircleOutlined />,
                      content: 'Are you sure you want to resubmit this application with your revisions? This action cannot be undone.',
                      okText: 'Yes, Resubmit',
                      cancelText: 'Cancel',
                      onOk: onSubmitApplication
                    })
                  }}
                  loading={formSubmitting}
                >
                  Resubmit Application
                </Button>
              )}
            </>
          ) : isDraft ? (
            <>
              {import.meta.env.DEV && (
                <Button
                  type="dashed"
                  icon={<BugOutlined />}
                  iconPosition="end"
                  onClick={onFillTestData}
                >
                  Fill with test data
                </Button>
              )}
              <Button
                danger
                icon={<DeleteOutlined />}
                iconPosition="end"
                onClick={onDeleteDraft}
              >
                Delete
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                iconPosition="end"
                onClick={() => {
                  modal.confirm({
                    title: 'Confirm Application Submission',
                    icon: <ExclamationCircleOutlined />,
                    content: 'Are you sure you want to submit this business permit application? This action cannot be undone.',
                    okText: 'Yes, Submit',
                    cancelText: 'Cancel',
                    onOk: onSubmitApplication
                  })
                }}
                loading={formSubmitting}
                disabled={!allSectionsComplete}
              >
                Submit
              </Button>
            </>
          ) : null}
        </Space>
      </div>
    </div>
  )
}
