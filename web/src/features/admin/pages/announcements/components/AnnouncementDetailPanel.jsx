import { Button, Card, DatePicker, Empty, Form, Grid, Input, Select, Table, Tabs, Tag, Typography, theme } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { DeleteOutlined, DownloadOutlined, FileTextOutlined, HistoryOutlined, NotificationOutlined, RollbackOutlined, SaveOutlined, SearchOutlined, SendOutlined, WarningOutlined } from '@ant-design/icons'
import { BRAND_COLORS } from '@/shared/theme/ThemeProvider'
import { ANNOUNCEMENT_PRIORITY_SELECT_OPTIONS, AUDIT_ACTION_COLORS, STATUS_COLORS } from '../constants/announcements.constants.js'
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
          padding: '16px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flexShrink: 0,
        }}
      >
        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Tag color={STATUS_COLORS[selected.status] || 'default'}>
              {(selected.status || 'draft').toUpperCase()}
            </Tag>
            <Tag color="blue">Created {formatAnnouncementDate(selected.createdAt, 'MMM D, YYYY')}</Tag>
            {selected.updatedAt && selected.updatedAt !== selected.createdAt && (
              <Tag color="green">Updated {formatAnnouncementDate(selected.updatedAt, 'MMM D, h:mm A')}</Tag>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
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
                    <div style={{ marginBottom: 16 }}>
                      <Title level={4} style={{ marginBottom: 8 }}>
                        <NotificationOutlined style={{ marginRight: 8 }} />
                        Live Preview - Landing Page
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        This mirrors the current public landing page hero and announcements card styling.
                      </Text>
                    </div>
                    <div
                      style={{
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: 8,
                        overflow: 'hidden',
                        minHeight: isMobile ? 420 : 520,
                        background: token.colorBgLayout,
                      }}
                    >
                      <div
                        style={{
                          padding: screens.md ? '40px 32px' : '24px 20px',
                          background: token.colorBgContainer,
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: screens.md ? '1.2fr 0.8fr' : '1fr',
                            gap: screens.md ? 24 : 16,
                            alignItems: 'stretch',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Text strong style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: token.colorPrimary }}>
                              Business Permit Processing
                            </Text>
                            <Title level={1} style={{ margin: '8px 0 12px', fontSize: screens.md ? '56px' : '34px', fontWeight: 700, lineHeight: 1.1 }}>
                              <span style={{ color: BRAND_COLORS.blue }}>Business </span>
                              <span style={{ color: BRAND_COLORS.red }}>Permit </span>
                              <span style={{ color: BRAND_COLORS.yellow }}>Processing</span>
                            </Title>
                            <Title level={2} style={{ margin: 0, fontSize: screens.md ? '40px' : '26px', fontWeight: 700, color: token.colorText }}>
                              Made Simpler.
                            </Title>
                            <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 14, lineHeight: 1.7 }}>
                              This preview reflects the same hero area and announcements panel used on the public landing page.
                            </Text>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {previewMaintenance.active || previewMaintenance.scheduled ? (
                              <Card
                                size="small"
                                style={{
                                  width: '100%',
                                  background: token.colorBgContainer,
                                  border: `1px solid ${token.colorBorder}`,
                                  borderRadius: token.borderRadiusLG,
                                }}
                                bodyStyle={{ padding: screens.md ? 16 : 12, paddingTop: screens.md ? 48 : 32 }}
                              >
                                <WarningOutlined style={{ fontSize: screens.md ? 24 : 20, color: token.colorTextSecondary, marginBottom: 8 }} />
                                <Title level={5} style={{ margin: 0 }}>
                                  {previewMaintenance.active ? 'System Maintenance' : 'Scheduled Maintenance'}
                                </Title>
                                <Text style={{ display: 'block', marginTop: 4, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                  {(previewMaintenance.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable.").replace(/^Upcoming:\s*/i, '')}
                                </Text>
                                {previewMaintenance.scheduledStartAt && (
                                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                                    Starting at: {formatAnnouncementDate(previewMaintenance.scheduledStartAt, 'MMM D, YYYY h:mm A')}
                                  </Text>
                                )}
                                {previewMaintenance.expectedResumeAt && (
                                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                                    Back online at: {formatAnnouncementDate(previewMaintenance.expectedResumeAt, 'MMM D, YYYY h:mm A')}
                                  </Text>
                                )}
                              </Card>
                            ) : null}

                            {(previewAnnouncements.length > 0 || (selected && formValues.title)) ? (
                              <Card
                                size="small"
                                style={{
                                  width: '100%',
                                  background: token.colorBgContainer,
                                  border: `1px solid ${token.colorBorder}`,
                                  borderRadius: token.borderRadiusLG,
                                }}
                                bodyStyle={{ padding: screens.md ? '16px 16px 16px 16px' : '12px', paddingTop: screens.md ? 48 : 32 }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                  <NotificationOutlined style={{ fontSize: 20, color: token.colorTextSecondary }} />
                                  <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                                    Announcements
                                  </Title>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {[...(selected && formValues.title ? [{ title: formValues.title, body: formValues.body || 'No content', createdAt: selected.createdAt }] : []), ...previewAnnouncements].slice(0, 2).map((announcement, index) => (
                                    <Button
                                      key={`preview-announcement-${index}`}
                                      type="default"
                                      size="small"
                                      disabled
                                      style={{
                                        textAlign: 'left',
                                        height: 'auto',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        justifyContent: 'flex-start',
                                        whiteSpace: 'normal',
                                      }}
                                    >
                                      {announcement.title}
                                    </Button>
                                  ))}
                                  {[...(selected && formValues.title ? [{ title: formValues.title, body: formValues.body || 'No content', createdAt: selected.createdAt }] : []), ...previewAnnouncements].length > 2 && (
                                    <Button
                                      type="default"
                                      size="small"
                                      disabled
                                      style={{
                                        textAlign: 'left',
                                        height: 'auto',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        justifyContent: 'flex-start',
                                        whiteSpace: 'normal',
                                      }}
                                    >
                                      View all {[...(selected && formValues.title ? [{ title: formValues.title, body: formValues.body || 'No content', createdAt: selected.createdAt }] : []), ...previewAnnouncements].length} announcements →
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            ) : null}
                          </div>
                        </div>
                      </div>
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
                      <LottieSpinner />
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
