import React, { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  List,
  Checkbox,
  Empty,
  Modal,
  Form,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
} from '@ant-design/icons'

const { Text } = Typography

export default function SectionEditor({ sections = [], onChange, disabled = false }) {
  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [editingSectionIndex, setEditingSectionIndex] = useState(-1)
  const [sectionForm] = Form.useForm()

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingItemIndex, setEditingItemIndex] = useState(-1)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1)
  const [itemForm] = Form.useForm()

  // Section handlers
  const openAddSection = () => {
    setEditingSection(null)
    setEditingSectionIndex(-1)
    sectionForm.resetFields()
    setSectionModalOpen(true)
  }

  const openEditSection = (section, index) => {
    setEditingSection(section)
    setEditingSectionIndex(index)
    sectionForm.setFieldsValue({
      category: section.category,
      source: section.source || '',
      notes: section.notes || '',
    })
    setSectionModalOpen(true)
  }

  const handleSaveSection = async () => {
    try {
      const values = await sectionForm.validateFields()
      const newSections = [...sections]

      if (editingSectionIndex >= 0) {
        // Update existing
        newSections[editingSectionIndex] = {
          ...newSections[editingSectionIndex],
          category: values.category,
          source: values.source || '',
          notes: values.notes || '',
        }
      } else {
        // Add new
        newSections.push({
          category: values.category,
          source: values.source || '',
          notes: values.notes || '',
          items: [],
        })
      }

      onChange(newSections)
      setSectionModalOpen(false)
    } catch (err) {
      // Validation error
    }
  }

  const handleDeleteSection = (index) => {
    const newSections = sections.filter((_, i) => i !== index)
    onChange(newSections)
  }

  // Item handlers
  const openAddItem = (sectionIndex) => {
    setCurrentSectionIndex(sectionIndex)
    setEditingItem(null)
    setEditingItemIndex(-1)
    itemForm.resetFields()
    itemForm.setFieldsValue({ required: true })
    setItemModalOpen(true)
  }

  const openEditItem = (sectionIndex, item, itemIndex) => {
    setCurrentSectionIndex(sectionIndex)
    setEditingItem(item)
    setEditingItemIndex(itemIndex)
    itemForm.setFieldsValue({
      label: item.label,
      required: item.required !== false,
      notes: item.notes || '',
    })
    setItemModalOpen(true)
  }

  const handleSaveItem = async () => {
    try {
      const values = await itemForm.validateFields()
      const newSections = [...sections]
      const section = { ...newSections[currentSectionIndex] }
      const items = [...(section.items || [])]

      const itemData = {
        label: values.label,
        required: values.required,
        notes: values.notes || '',
      }

      if (editingItemIndex >= 0) {
        items[editingItemIndex] = itemData
      } else {
        items.push(itemData)
      }

      section.items = items
      newSections[currentSectionIndex] = section
      onChange(newSections)
      setItemModalOpen(false)
    } catch (err) {
      // Validation error
    }
  }

  const handleDeleteItem = (sectionIndex, itemIndex) => {
    const newSections = [...sections]
    const section = { ...newSections[sectionIndex] }
    section.items = section.items.filter((_, i) => i !== itemIndex)
    newSections[sectionIndex] = section
    onChange(newSections)
  }

  const handleToggleRequired = (sectionIndex, itemIndex) => {
    const newSections = [...sections]
    const section = { ...newSections[sectionIndex] }
    const items = [...section.items]
    items[itemIndex] = { ...items[itemIndex], required: !items[itemIndex].required }
    section.items = items
    newSections[sectionIndex] = section
    onChange(newSections)
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {sections.length === 0 ? (
        <Empty description="No sections yet">
          {!disabled && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddSection}>
              Add Section
            </Button>
          )}
        </Empty>
      ) : (
        <>
          {!disabled && (
            <Button type="dashed" icon={<PlusOutlined />} onClick={openAddSection}>
              Add Section
            </Button>
          )}

          {sections.map((section, sectionIndex) => (
        <Card
          key={sectionIndex}
          title={
            <Space>
              <Text strong>{section.category}</Text>
              {section.source && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({section.source})
                </Text>
              )}
            </Space>
          }
          extra={
            !disabled && (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditSection(section, sectionIndex)}
                />
                <Popconfirm
                  title="Delete section"
                  description="This will remove all items in this section."
                  onConfirm={() => handleDeleteSection(sectionIndex)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        >
          {section.notes && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
              {section.notes}
            </Text>
          )}

          <List
            size="small"
            dataSource={section.items || []}
            locale={{ emptyText: 'No items yet' }}
            renderItem={(item, itemIndex) => (
              <List.Item
                actions={
                  !disabled
                    ? [
                        <Button
                          key="edit"
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => openEditItem(sectionIndex, item, itemIndex)}
                        />,
                        <Popconfirm
                          key="delete"
                          title="Delete item"
                          onConfirm={() => handleDeleteItem(sectionIndex, itemIndex)}
                          okText="Delete"
                          okButtonProps={{ danger: true }}
                        >
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]
                    : []
                }
              >
                <Space>
                  <Checkbox
                    checked={item.required !== false}
                    onChange={() => !disabled && handleToggleRequired(sectionIndex, itemIndex)}
                    disabled={disabled}
                  />
                  <div>
                    <Text>{item.label}</Text>
                    {item.notes && (
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        {item.notes}
                      </Text>
                    )}
                  </div>
                </Space>
              </List.Item>
            )}
            footer={
              !disabled && (
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => openAddItem(sectionIndex)}
                  block
                >
                  Add Item
                </Button>
              )
            }
          />
        </Card>
          ))}
        </>
      )}

      {/* Section Modal */}
      <Modal
        title={editingSectionIndex >= 0 ? 'Edit Section' : 'Add Section'}
        open={sectionModalOpen}
        onCancel={() => setSectionModalOpen(false)}
        onOk={handleSaveSection}
        okText={editingSectionIndex >= 0 ? 'Update' : 'Add'}
      >
        <Form form={sectionForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="category"
            label="Category Name"
            rules={[{ required: true, message: 'Category name is required' }]}
          >
            <Input placeholder="e.g., LGU Requirements" />
          </Form.Item>
          <Form.Item name="source" label="Source (optional)">
            <Input placeholder="e.g., City Business Permits Office" />
          </Form.Item>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea placeholder="Additional notes for this section" rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Item Modal */}
      <Modal
        title={editingItemIndex >= 0 ? 'Edit Requirement' : 'Add Requirement'}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        onOk={handleSaveItem}
        okText={editingItemIndex >= 0 ? 'Update' : 'Add'}
      >
        <Form form={itemForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="label"
            label="Requirement"
            rules={[{ required: true, message: 'Requirement text is required' }]}
          >
            <Input placeholder="e.g., Barangay Business Clearance" />
          </Form.Item>
          <Form.Item name="required" valuePropName="checked">
            <Checkbox>Required document</Checkbox>
          </Form.Item>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea placeholder="e.g., Original copy required" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
