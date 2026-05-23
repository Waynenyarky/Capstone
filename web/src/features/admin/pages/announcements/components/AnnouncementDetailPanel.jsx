import { Button, Collapse, DatePicker, Empty, Form, Grid, Input, Layout, Select, Spin, Table, Tabs, Tag, Typography, theme } from 'antd'
import { DeleteOutlined, DownloadOutlined, FileTextOutlined, HistoryOutlined, NotificationOutlined, RollbackOutlined, SaveOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons'
import HomeHeader from '@/features/public/components/HomeHeader'
import HomeFooter from '@/features/public/components/HomeFooter'
import { BRAND_COLORS } from '@/shared/theme/ThemeProvider'
import { ANNOUNCEMENT_PRIORITY_SELECT_OPTIONS, AUDIT_ACTION_COLORS } from '../constants/announcements.constants.js'
import { formatAnnouncementDate, getAuditActionLabel } from '../utils/announcements.utils.js'

const { Paragraph, Text, Title } = Typography
const { TextArea } = Input

function buildPreviewItems({ previewMaintenance, previewAnnouncements, selected, formValues }) {
  const hasMaintenanceNotice = previewMaintenance.active || previewMaintenance.scheduled
  const hasAnnouncements = hasMaintenanceNotice || previewAnnouncements.length > 0 || (selected && formValues.title)
  const previewCollapseItems = []

  if (hasMaintenanceNotice) {
    previewCollapseItems.push({
      key: 'maintenance-notice',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{previewMaintenance.active ? 'Maintenance Underway' : 'Scheduled Maintenance'}</span>
        </div>
      ),
      children: (
        <div>
          <Paragraph style={{ marginBottom: 0 }}>
            {(previewMaintenance.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable.").replace(/^Upcoming:\s*/i, '')}
          </Paragraph>
          {previewMaintenance.scheduledStartAt && (
            <Paragraph type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Starting at: {formatAnnouncementDate(previewMaintenance.scheduledStartAt, 'MMM D, YYYY h:mm A')}
            </Paragraph>
          )}
          {previewMaintenance.expectedResumeAt && (
            <Paragraph type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              Back online at: {formatAnnouncementDate(previewMaintenance.expectedResumeAt, 'MMM D, YYYY h:mm A')}
            </Paragraph>
          )}
        </div>
      ),
    })
  }

  if (selected && formValues.title) {
    previewCollapseItems.push({
      key: 'preview',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{formValues.title}</span>
          <Tag color="blue" size="small" style={{ marginLeft: 'auto' }}>PREVIEW</Tag>
        </div>
      ),
      children: (
        <div>
          <Paragraph type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {selected.createdAt ? formatAnnouncementDate(selected.createdAt, 'MMM D, YYYY h:mm A') : 'Just now'}
          </Paragraph>
          <Paragraph style={{ marginBottom: 0 }}>{formValues.body || 'No content'}</Paragraph>
        </div>
      ),
    })
  }

  previewAnnouncements.slice(0, 3).forEach((announcement, index) => {
    previewCollapseItems.push({
      key: `announcement-${index + 1}`,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{announcement.title}</span>
        </div>
      ),
      children: (
        <div>
          <Paragraph type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {announcement.createdAt ? formatAnnouncementDate(announcement.createdAt, 'MMM D, YYYY h:mm A') : '-'}
          </Paragraph>
          <Paragraph style={{ marginBottom: 0 }}>{announcement.body}</Paragraph>
        </div>
      ),
    })
  })

  return {
    previewCollapseItems,
    hasAnnouncements,
    defaultActiveKey: hasMaintenanceNotice
      ? ['maintenance-notice']
      : (selected && formValues.title ? ['preview'] : ['announcement-1']),
  }
}

export default function AnnouncementDetailPanel({
  selected,
  form,
  formValues,
  setFormValues,
  saving,
  onFillTestData,
  onSaveDraft,
  onPublish,
  onDelete,
  onUnpublish,
  isMobile,
  auditLogsLoading,
  filteredAuditLogs,
  auditSearch,
  onAuditSearchChange,
  auditLogsPage,
  auditLogsTotal,
  onAuditPageChange,
  onOpenAuditLog,
  onExportAuditLogs,
  previewAnnouncements,
  previewMaintenance,
  activeAuditTab,
  onAuditTabChange,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()

  if (!selected) {
    return (
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Empty description="Select an announcement to view details" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const { previewCollapseItems, hasAnnouncements, defaultActiveKey } = buildPreviewItems({
    previewMaintenance,
    previewAnnouncements,
    selected,
    formValues,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: token.colorBgContainer }}>
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <Tag color={selected.status === 'published' ? 'green' : 'orange'}>
            {(selected.status || 'draft').toUpperCase()}
          </Tag>
          <Tag color="blue">Created {formatAnnouncementDate(selected.createdAt, 'MMM D, YYYY')}</Tag>
          {selected.updatedAt && selected.updatedAt !== selected.createdAt && (
            <Tag color="green">Updated {formatAnnouncementDate(selected.updatedAt, 'MMM D, h:mm A')}</Tag>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', minWidth: 0 }}>
          {selected.status === 'draft' && (
            <>
              <Button icon={<FileTextOutlined />} onClick={onFillTestData}>
                {!isMobile && 'Fill with test data'}
              </Button>
              <Button icon={<SaveOutlined />} onClick={() => onSaveDraft(false)} loading={saving}>
                {!isMobile && 'Save Draft'}
              </Button>
              <Button type="primary" icon={<SendOutlined />} onClick={() => onPublish(true)} loading={saving}>
                {!isMobile && 'Publish'}
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                {!isMobile && 'Delete'}
              </Button>
            </>
          )}
          {selected.status === 'published' && (
            <Button icon={<RollbackOutlined />} onClick={onUnpublish} loading={saving}>
              {!isMobile && 'Unpublish'}
            </Button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        <Tabs
          activeKey={activeAuditTab}
          onChange={onAuditTabChange}
          tabBarStyle={{ paddingLeft: 12 }}
          items={[
            {
              key: 'details',
              label: 'Details',
              children: (
                <div style={{ padding: 16 }}>
                  <Form form={form} layout="vertical" onValuesChange={(_, allValues) => setFormValues(allValues)}>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
                      <Input placeholder="Announcement title" disabled={selected.status === 'published'} size="large" />
                    </Form.Item>
                    <Form.Item name="body" label="Content" rules={[{ required: true, message: 'Content is required' }]}>
                      <TextArea rows={8} placeholder="Announcement content. Include detailed information, deadlines, and instructions." disabled={selected.status === 'published'} />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: screens.sm ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>
                      <Form.Item name="priority" label="Priority">
                        <Select
                          disabled={selected.status === 'published'}
                          options={ANNOUNCEMENT_PRIORITY_SELECT_OPTIONS}
                          placeholder="Select priority level"
                        />
                      </Form.Item>
                      <Form.Item name="publishAt" label="Publish At">
                        <DatePicker showTime style={{ width: '100%' }} disabled={selected.status === 'published'} placeholder="Optional: schedule for future" />
                      </Form.Item>
                      <Form.Item name="expiresAt" label="Expires At" style={{ gridColumn: screens.sm ? 'span 2' : 'auto' }}>
                        <DatePicker style={{ width: '100%' }} disabled={selected.status === 'published'} placeholder="Optional: auto-hide after this date" />
                      </Form.Item>
                    </div>
                  </Form>

                  <div style={{ padding: 16, borderTop: `1px solid ${token.colorBorderSecondary}`, marginTop: 24 }}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                      <NotificationOutlined style={{ marginRight: 8 }} />
                      Live Preview - Landing Page
                    </Title>
                    <div
                      style={{
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: 8,
                        overflow: 'auto',
                        height: isMobile ? 400 : 500,
                        maxHeight: '60vh',
                        position: 'relative',
                        background: token.colorBgLayout,
                      }}
                    >
                      <Layout style={{ minHeight: '100%', background: token.colorBgContainer }}>
                        <div style={{ position: 'relative' }}>
                          <HomeHeader />
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1101, cursor: 'not-allowed', pointerEvents: 'auto' }} />
                        </div>
                        <Layout.Content style={{ display: 'flex', flexDirection: 'column' }}>
                          <div
                            style={{
                              background: token.colorBgContainer,
                              padding: screens.md ? '60px 50px' : '40px 24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: 1,
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '1200px',
                                width: '100%',
                                display: 'grid',
                                gridTemplateColumns: hasAnnouncements && screens.md ? '1fr 1fr' : '1fr',
                                gap: screens.md ? 60 : 40,
                                alignItems: 'start',
                              }}
                            >
                              <div style={{ textAlign: hasAnnouncements && screens.md ? 'left' : 'center' }}>
                                <Title level={1} style={{ marginBottom: '8px', fontSize: screens.md ? '56px' : '36px', fontWeight: 700, lineHeight: 1.1 }}>
                                  <span style={{ color: BRAND_COLORS.blue }}>Business </span>
                                  <span style={{ color: BRAND_COLORS.red }}>Permit </span>
                                  <span style={{ color: BRAND_COLORS.yellow }}>Processing</span>
                                </Title>
                                <Title level={2} style={{ margin: 0, fontSize: screens.md ? '40px' : '28px', fontWeight: 700, color: token.colorText }}>
                                  Made Simpler.
                                </Title>
                              </div>
                              {hasAnnouncements && (
                                <div>
                                  <Title level={4} style={{ marginBottom: 16 }}>Announcements</Title>
                                  <Collapse items={previewCollapseItems} defaultActiveKey={defaultActiveKey} style={{ background: token.colorBgContainer }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </Layout.Content>
                        <div style={{ position: 'relative' }}>
                          <HomeFooter />
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, cursor: 'not-allowed', pointerEvents: 'auto' }} />
                        </div>
                      </Layout>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'audit-logs',
              label: (
                <span>
                  <HistoryOutlined style={{ marginRight: 8 }} />
                  History
                </span>
              ),
              children: (
                <div style={{ padding: 16 }}>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <Input
                      placeholder="Search history..."
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      allowClear
                      value={auditSearch}
                      onChange={(event) => onAuditSearchChange(event.target.value)}
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <Button icon={<DownloadOutlined />} onClick={onExportAuditLogs}>
                      Export CSV
                    </Button>
                  </div>

                  {auditLogsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                      <Spin />
                    </div>
                  ) : filteredAuditLogs.length === 0 ? (
                    <Empty description="No history found" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
                  ) : (
                    <div style={{ borderRadius: 8, border: `1px solid ${token.colorBorderSecondary}`, overflow: 'hidden' }}>
                      <Table
                        dataSource={filteredAuditLogs}
                        scroll={{ x: 1000 }}
                        columns={[
                          {
                            title: 'Date & Time',
                            dataIndex: 'createdAt',
                            key: 'createdAt',
                            render: (date) => formatAnnouncementDate(date, 'MMM D, YYYY HH:mm:ss'),
                            width: 180,
                          },
                          {
                            title: 'Event Type',
                            dataIndex: 'action',
                            key: 'action',
                            width: 130,
                            render: (action) => (
                              <Tag color={AUDIT_ACTION_COLORS[action] || 'default'} style={{ fontSize: 11 }}>
                                {getAuditActionLabel(action)}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Changed By',
                            dataIndex: 'userEmail',
                            key: 'userEmail',
                            width: 150,
                            render: (email, record) => (
                              <div>
                                <Text style={{ fontSize: 12 }}>{email || 'Unknown'}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {record.role || 'Admin'}
                                </Text>
                              </div>
                            ),
                          },
                          {
                            title: 'Field',
                            dataIndex: 'fieldChanged',
                            key: 'fieldChanged',
                            width: 100,
                            render: (field) => <Text style={{ fontSize: 12 }}>{field || '-'}</Text>,
                          },
                          {
                            title: 'Old Value',
                            dataIndex: 'oldValue',
                            key: 'oldValue',
                            width: 150,
                            render: (value) => (
                              <Text ellipsis={{ tooltip: value }} style={{ maxWidth: 220, fontSize: 12 }}>
                                {value || '-'}
                              </Text>
                            ),
                          },
                          {
                            title: 'New Value',
                            dataIndex: 'newValue',
                            key: 'newValue',
                            width: 150,
                            render: (value) => (
                              <Text ellipsis={{ tooltip: value }} style={{ maxWidth: 220, fontSize: 12 }}>
                                {value || '-'}
                              </Text>
                            ),
                          },
                        ]}
                        pagination={{
                          current: auditLogsPage,
                          total: auditLogsTotal,
                          pageSize: 20,
                          onChange: onAuditPageChange,
                          showSizeChanger: false,
                          size: 'small',
                        }}
                        rowKey="_id"
                        size="small"
                        onRow={(record) => ({
                          onClick: () => onOpenAuditLog(record),
                          style: { cursor: 'pointer' },
                        })}
                        bordered={false}
                      />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
