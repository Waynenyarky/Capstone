import {
  Card,
  Button,
  Space,
  Tabs,
  Form,
  Input,
  Spin,
} from 'antd'
import {
  SaveOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons'
import SectionEditor from '../components/SectionEditor'
import DownloadsManager from '../components/DownloadsManager'
import FormDefinitionPreview from '../components/FormDefinitionPreview'
import { TargetingTab } from './formDefinitions/components'
import { useFormDefinitionEditorPanel } from './formDefinitions/useFormDefinitionEditorPanel'

export default function FormDefinitionEditorPanel({
  definitionId,
  viewOnly: viewOnlyProp = false,
  onSelectVersion,
  groupId,
  onRetired,
}) {
  const {
    loading,
    saving,
    definition,
    form,
    lgus,
    activeTab,
    setActiveTab,
    viewOnly,
    handleSave,
    handleSectionsChange,
    handleDownloadsChange,
    handleSubmitForApproval,
    handleCancelApproval,
  } = useFormDefinitionEditorPanel({
    definitionId,
    viewOnlyProp,
    onSelectVersion,
    groupId,
    onRetired,
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Spin size="large" />
        <Form form={form} style={{ display: 'none' }} />
      </div>
    )
  }

  if (!definition) {
    return <Form form={form} style={{ display: 'none' }} />
  }

  const tabItems = [
    {
      key: 'sections',
      label: `Sections (${definition.sections?.length || 0})`,
      children: (
        <SectionEditor
          sections={definition.sections || []}
          onChange={handleSectionsChange}
          disabled={viewOnly}
        />
      ),
    },
    {
      key: 'downloads',
      label: `Downloads (${definition.downloads?.length || 0})`,
      children: (
        <DownloadsManager
          formDefinitionId={definitionId}
          downloads={definition.downloads || []}
          onChange={handleDownloadsChange}
          disabled={viewOnly}
        />
      ),
    },
    {
      key: 'targeting',
      label: 'Targeting',
      children: (
        <TargetingTab
          form={form}
          definition={definition}
          lgus={lgus}
          viewOnly={viewOnly}
        />
      ),
    },
    {
      key: 'preview',
      label: 'Preview',
      children: <FormDefinitionPreview definition={definition} />,
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16 }}>
        <Form form={form} style={{ display: 'none' }}>
          <Form.Item name="formType" noStyle>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="version" rules={[{ required: true }]} noStyle>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="name" noStyle>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="description" noStyle>
            <Input type="hidden" />
          </Form.Item>
        </Form>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Card size="small">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>

          <Space wrap>
            {definition.status === 'draft' && (
              <>
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                >
                  Save Draft
                </Button>
                {definition.sections?.length > 0 && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSubmitForApproval}
                  >
                    Submit for Approval
                  </Button>
                )}
              </>
            )}
            {definition.status === 'pending_approval' && (
              <Button
                icon={<StopOutlined />}
                onClick={handleCancelApproval}
                danger
              >
                Cancel Approval
              </Button>
            )}
          </Space>
        </Space>
      </div>
    </div>
  )
}
