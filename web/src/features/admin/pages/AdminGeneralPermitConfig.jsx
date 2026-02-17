import React, { useState, useCallback, useEffect } from 'react'
import {
  Card, Tabs, Table, Button, Form, Input, Space, Typography, Alert, Empty, Tag, Spin
} from 'antd'
import { SettingOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout.jsx'
import { useNotifier } from '@/shared/notifications.js'
import { get, put } from '@/lib/http.js'

const { Title, Text, Paragraph } = Typography

const PERMIT_CATEGORIES = [
  { key: 'cooperative', label: 'Cooperative' },
  { key: 'association_foundation', label: 'Association / Foundation' },
  { key: 'chainsaw', label: 'Chainsaw Permit' },
  { key: 'firecrackers_stallholders', label: 'Firecrackers Stallholders' },
  { key: 'bazaar_festival_vendors', label: 'Bazaar / Festival Vendors' },
  { key: 'peddlers', label: 'Peddlers' },
  { key: 'promotions_exhibitors', label: 'Promotions / Exhibitors' },
  { key: 'cemetery_stallholders', label: 'Cemetery Stallholders' },
  { key: 'fish_trap_fish_pen', label: 'Fish Trap / Fish Pen' },
  { key: 'fish_pond', label: 'Fish Pond' },
]

// Default requirements per category (used as fallback when API returns nothing)
const DEFAULT_REQUIREMENTS = {
  cooperative: ['CDA Registration', 'Board Resolution', 'Financial Statement', 'List of Officers'],
  association_foundation: ['SEC Registration', 'Board Resolution', 'Articles of Incorporation'],
  chainsaw: ['DENR Permit', 'Barangay Clearance', 'Proof of Ownership'],
  firecrackers_stallholders: ['Fire Safety Inspection Certificate', 'Barangay Clearance', 'Business Permit'],
  bazaar_festival_vendors: ['Barangay Clearance', 'Health Certificate', 'Sanitary Permit'],
  peddlers: ['Barangay Clearance', 'Community Tax Certificate', 'Photo ID'],
  promotions_exhibitors: ['Business Permit', 'Event Permit', 'Insurance Certificate'],
  cemetery_stallholders: ['Barangay Clearance', 'Health Certificate'],
  fish_trap_fish_pen: ['BFAR Permit', 'Barangay Clearance', 'Environmental Compliance Certificate'],
  fish_pond: ['BFAR Permit', 'Barangay Clearance', 'Environmental Compliance Certificate', 'Water Rights Permit'],
}

export default function AdminGeneralPermitConfig() {
  const [requirements, setRequirements] = useState(DEFAULT_REQUIREMENTS)
  const [activeTab, setActiveTab] = useState('cooperative')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { success, error: notifyError } = useNotifier()

  // Fetch persisted requirements from API on mount
  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/admin/general-permit-config')
      const data = res?.data || res
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        setRequirements(prev => ({ ...prev, ...data }))
      }
    } catch (err) {
      // Silently fall back to defaults if API not available yet
      console.warn('General permit config API not available, using defaults:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequirements() }, [fetchRequirements])

  const addRequirement = useCallback((category) => {
    setRequirements((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), ''],
    }))
  }, [])

  const removeRequirement = useCallback((category, index) => {
    setRequirements((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index),
    }))
  }, [])

  const updateRequirement = useCallback((category, index, value) => {
    setRequirements((prev) => ({
      ...prev,
      [category]: (prev[category] || []).map((r, i) => (i === index ? value : r)),
    }))
  }, [])

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      await put('/api/admin/general-permit-config', requirements)
      success('General permit requirements saved')
    } catch (err) {
      notifyError(err, 'Failed to save general permit requirements')
    } finally {
      setSaving(false)
    }
  }, [requirements, success, notifyError])

  return (
    <AdminLayout pageTitle="General Permit Configuration" pageIcon={<SettingOutlined />}>
      <Spin spinning={loading} size="large">
      <div style={{ padding: 16 }}>
        <Paragraph type="secondary">
          Configure the requirements for each general permit category. These requirements will be shown to applicants.
        </Paragraph>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabPosition="left"
          items={PERMIT_CATEGORIES.map((cat) => ({
            key: cat.key,
            label: (
              <Space>
                <span>{cat.label}</span>
                <Tag>{(requirements[cat.key] || []).length}</Tag>
              </Space>
            ),
            children: (
              <Card
                title={`${cat.label} Requirements`}
                extra={
                  <Space>
                    <Button icon={<PlusOutlined />} onClick={() => addRequirement(cat.key)}>
                      Add Requirement
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                      Save
                    </Button>
                  </Space>
                }
              >
                {(requirements[cat.key] || []).length === 0 ? (
                  <Empty description="No requirements configured. Add your first requirement." />
                ) : (
                  <Table
                    aria-label="Permit requirements"
                    dataSource={(requirements[cat.key] || []).map((r, i) => ({ key: i, requirement: r }))}
                    scroll={{ x: 'max-content' }}
                    columns={[
                      {
                        title: '#',
                        width: 50,
                        render: (_, __, idx) => idx + 1,
                      },
                      {
                        title: 'Requirement',
                        dataIndex: 'requirement',
                        render: (val, _, idx) => (
                          <Input
                            value={val}
                            placeholder="Enter requirement name"
                            onChange={(e) => updateRequirement(cat.key, idx, e.target.value)}
                          />
                        ),
                      },
                      {
                        title: '',
                        width: 60,
                        render: (_, __, idx) => (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label="Remove requirement"
                            onClick={() => removeRequirement(cat.key, idx)}
                          />
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                )}
              </Card>
            ),
          }))}
        />
      </div>
      </Spin>
    </AdminLayout>
  )
}
