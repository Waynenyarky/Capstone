import React from 'react'
import { Table, Splitter, Empty, Typography } from 'antd'
import { TABLE_MIN_WIDTH } from '../constants'
import FormStatsPieChart from './FormStatsPieChart'
import AuditLogSection from './AuditLogSection'
import IndustryFormDetailPanel from '../../IndustryFormDetailPanel'

const { Text } = Typography

export default function DesktopView({
  token,
  displayStats,
  industryRows,
  columns,
  loading,
  selectedIndustryScope,
  handleRowClick,
  auditLog,
  loadGroups,
  selectedGroupsByType,
}) {
  return (
    <Splitter style={{ height: '100%', minHeight: 400 }}>
      {/* Left panel */}
      <Splitter.Panel defaultSize="30%" min="30%">
        <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Summary section */}
          <div style={{ flexShrink: 0, padding: 16, borderBottom: `1px solid ${token.colorBorder}` }}>
            <Text strong style={{ margin: 0 }}>Summary</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                <FormStatsPieChart stats={displayStats} size={80} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>{displayStats.activated}</Text>
                  <Text type="secondary">active</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>{displayStats.deactivated}</Text>
                  <Text type="secondary">deactivated</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>{displayStats.retired}</Text>
                  <Text type="secondary">retired</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical splitter: Industries + Recent Activity */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Splitter style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} layout="vertical">
              <Splitter.Panel defaultSize="40%" min={100}>
                <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <Text strong style={{ padding: 16, paddingBottom: 8 }}>Select An Industry</Text>
                  <div style={{ flex: 1, minHeight: 0, margin: 16, marginTop: 0, overflow: 'auto', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 12, background: 'white' }}>
                    <Table
                      bordered
                      rowKey="industryScope"
                      dataSource={industryRows}
                      columns={columns}
                      loading={loading}
                      size="small"
                      scroll={{ x: TABLE_MIN_WIDTH }}
                      pagination={false}
                      onRow={(record) => ({
                        onClick: () => handleRowClick(record),
                        style: { cursor: 'pointer' },
                        className: selectedIndustryScope === record.industryScope ? 'admin-form-defs-selected-row' : '',
                      })}
                    />
                  </div>
                </div>
              </Splitter.Panel>
              <Splitter.Panel defaultSize="60%" min={80}>
                <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
                  <AuditLogSection entries={auditLog} />
                </div>
              </Splitter.Panel>
            </Splitter>
          </div>
        </div>
      </Splitter.Panel>

      {/* Right panel */}
      <Splitter.Panel defaultSize="70%" min="50%">
        {selectedIndustryScope ? (
          <IndustryFormDetailPanel
            industryScope={selectedIndustryScope}
            groupsByType={selectedGroupsByType}
            onRetired={loadGroups}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select an industry to view or edit forms" />
          </div>
        )}
      </Splitter.Panel>
    </Splitter>
  )
}
