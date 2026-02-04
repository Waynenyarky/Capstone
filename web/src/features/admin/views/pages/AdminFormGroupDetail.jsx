import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Space,
  Typography,
  List,
  Tag,
  App,
  Spin,
  Empty,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import {
  getFormGroup,
  createFormGroupVersion,
  setFormVersionActive,
  retireFormGroup,
} from '../../services'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const STATUS_COLORS = {
  draft: 'default',
  pending_approval: 'processing',
  published: 'success',
  archived: 'warning',
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  published: 'Published',
  archived: 'Archived',
}

export default function AdminFormGroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [settingActive, setSettingActive] = useState(null)
  const [retiring, setRetiring] = useState(false)
  const [group, setGroup] = useState(null)
  const [versions, setVersions] = useState([])

  const loadGroup = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    try {
      const res = await getFormGroup(groupId)
      setGroup(res.group)
      setVersions(res.versions || [])
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load form group:', err)
      message.error('Failed to load form group')
      navigate('/admin/form-definitions')
    } finally {
      setLoading(false)
    }
  }, [groupId, message, navigate])

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

  const handleCreateVersion = useCallback(async () => {
    try {
      setCreating(true)
      const res = await createFormGroupVersion(groupId)
      message.success(`Version ${res.definition?.version} created`)
      loadGroup()
      if (res?.definition?._id) {
        navigate(`/admin/form-definitions/${res.definition._id}`)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to create version:', err)
      message.error(err.message || 'Failed to create version')
    } finally {
      setCreating(false)
    }
  }, [groupId, loadGroup, message, navigate])

  const handleSetActive = useCallback(async (definitionId) => {
    try {
      setSettingActive(definitionId)
      await setFormVersionActive(definitionId)
      message.success('Version set as active')
      loadGroup()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to set version active:', err)
      message.error(err.message || 'Failed to set version active')
    } finally {
      setSettingActive(null)
    }
  }, [loadGroup, message])

  const goToEdit = useCallback((def) => {
    navigate(`/admin/form-definitions/${def._id}`)
  }, [navigate])

  const goToView = useCallback((def) => {
    navigate(`/admin/form-definitions/${def._id}?view=true`)
  }, [navigate])

  const confirmRetire = useCallback(() => {
    modal.confirm({
      title: 'Retire Form Group',
      content:
        'This will hide the form group from the default list. Versions remain for history. You can show retired groups using the filter.',
      okText: 'Retire',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setRetiring(true)
          await retireFormGroup(groupId)
          message.success('Form group retired')
          navigate('/admin/form-definitions')
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to retire form group:', err)
          message.error(err.message || 'Failed to retire form group')
        } finally {
          setRetiring(false)
        }
      },
    })
  }, [groupId, modal, message, navigate])

  if (loading) {
    return (
      <AdminLayout showPageHeader={false}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
          <Spin size="large" />
        </div>
      </AdminLayout>
    )
  }

  if (!group) {
    return null
  }

  return (
    <AdminLayout showPageHeader={false}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/form-definitions')}>
              Back
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {group.displayName || 'Form Group'}
            </Title>
          </Space>
          <Space>
            {!group.retiredAt && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={confirmRetire}
                loading={retiring}
              >
                Retire
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateVersion}
              loading={creating}
              disabled={!!group.retiredAt}
            >
              Create new version
            </Button>
          </Space>
        </div>

        <Card title="Versions">
          {versions.length === 0 ? (
            <Empty description="No versions yet. Create the first version." />
          ) : (
            <List
              dataSource={versions}
              renderItem={(def) => (
                <List.Item
                  key={def._id}
                  actions={
                    def.status === 'draft'
                      ? [
                          <Button
                            key="edit"
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => goToEdit(def)}
                          >
                            Edit
                          </Button>,
                          def.sections?.length > 0 && (
                            <Button
                              key="setActive"
                              type="link"
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleSetActive(def._id)}
                              loading={settingActive === def._id}
                            >
                              Set as active
                            </Button>
                          ),
                        ].filter(Boolean)
                      : [
                          <Button
                            key="view"
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => goToView(def)}
                          >
                            View
                          </Button>,
                        ]
                  }
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>v{def.version}</Text>
                        <Tag color={STATUS_COLORS[def.status]}>{STATUS_LABELS[def.status]}</Tag>
                        {def.status === 'published' && (
                          <Tag color="green">Active</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Last updated: {def.updatedAt ? dayjs(def.updatedAt).format('MMM D, YYYY') : '—'}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>
    </AdminLayout>
  )
}
