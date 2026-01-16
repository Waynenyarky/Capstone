import React from 'react'
import { Card, List, Button, Tag, Space, Popconfirm, Empty, Typography } from 'antd'
import { ShopOutlined, EditOutlined, DeleteOutlined, StarOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useBusinessList } from '../hooks/useBusinessList'

const { Text } = Typography

const BusinessListWidget = () => {
  const navigate = useNavigate()
  const { businesses, loading, primaryBusiness, setPrimaryBusiness, deleteBusiness } = useBusinessList()

  const handleAddNew = () => {
    navigate('/owner/business-registration')
  }

  const handleEdit = (businessId) => {
    navigate(`/owner/business-registration?businessId=${businessId}`)
  }

  const handleSetPrimary = async (businessId) => {
    try {
      await setPrimaryBusiness(businessId)
    } catch (err) {
      // Error already handled in hook
    }
  }

  const handleDelete = async (businessId) => {
    try {
      await deleteBusiness(businessId)
    } catch (err) {
      // Error already handled in hook
    }
  }

  const canDelete = businesses.length > 1

  return (
    <>
      <Card
        title={
          <Space>
            <ShopOutlined />
            <span>My Businesses</span>
            {businesses.length > 0 && (
              <Tag>{businesses.length} {businesses.length === 1 ? 'Business' : 'Businesses'}</Tag>
            )}
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
            Add New Business
          </Button>
        }
        style={{ height: '100%' }}
        loading={loading}
      >
        {businesses.length === 0 ? (
          <Empty
            description="No businesses registered"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
              Register Your First Business
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={businesses}
            renderItem={(business) => (
              <List.Item
                actions={[
                  <Button
                    key="edit"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(business.businessId)}
                  >
                    Edit
                  </Button>,
                  !business.isPrimary && (
                    <Button
                      key="primary"
                      type="link"
                      icon={<StarOutlined />}
                      onClick={() => handleSetPrimary(business.businessId)}
                    >
                      Set Primary
                    </Button>
                  ),
                  <Popconfirm
                    key="delete"
                    title="Delete Business"
                    description="Are you sure you want to delete this business? This action cannot be undone."
                    onConfirm={() => handleDelete(business.businessId)}
                    okText="Yes"
                    cancelText="No"
                    disabled={!canDelete}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={!canDelete}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<ShopOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={
                    <Space>
                      <span>{business.businessName}</span>
                      {business.isPrimary && (
                        <Tag color="blue" icon={<StarOutlined />}>
                          Primary
                        </Tag>
                      )}
                      <Tag color={business.riskProfile?.riskLevel === 'high' ? 'red' : business.riskProfile?.riskLevel === 'medium' ? 'orange' : 'green'}>
                        {business.riskProfile?.riskLevel || 'low'} Risk
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {business.businessType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {business.registrationAgency} - {business.businessRegistrationNumber}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {business.location?.city}, {business.location?.province}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </>
  )
}

export default BusinessListWidget
