import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Form, Input, Select, Upload, Table, Tag, Space, Typography, message, Progress } from 'antd';
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getPermitCategories, submitPermitApplication, getPermitApplications } from '../../services/permitService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;

const GeneralPermitApplication = () => {
  const { business } = useBusiness();
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoriesData, applicationsData] = await Promise.all([
          getPermitCategories(),
          business?.id ? getPermitApplications(business.id) : Promise.resolve({ applications: [] })
        ]);
        setCategories(categoriesData?.categories || []);
        setApplications(applicationsData?.applications || []);
      } catch (error) {
        message.error('Failed to fetch permit data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [business]);

  const handleCategorySelect = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    setSelectedCategory(category);
    setCurrentStep(1);
  };

  const handleSubmitApplication = async (values) => {
    try {
      const applicationData = {
        ...values,
        businessId: business.id,
        categoryId: selectedCategory.id,
        documents: values.fileList?.map(file => ({
          name: file.name,
          url: file.response?.url || file.url,
          type: file.type
        })) || []
      };
      await submitPermitApplication(applicationData);
      message.success('Permit application submitted successfully.');
      form.resetFields();
      setCurrentStep(0);
      setSelectedCategory(null);
      // Refresh applications list
      if (business?.id) {
        const apps = await getPermitApplications(business.id);
        setApplications(apps?.applications || []);
      }
    } catch (error) {
      message.error('Failed to submit permit application.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'default',
      'Submitted': 'processing',
      'Under Review': 'warning',
      'Approved': 'success',
      'Rejected': 'error',
      'Requires Action': 'warning'
    };
    return colors[status] || 'default';
  };

  const applicationColumns = [
    {
      title: 'Permit Type',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Text strong>{category}</Text>,
    },
    {
      title: 'Application ID',
      dataIndex: 'applicationId',
      key: 'applicationId',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Submitted Date',
      dataIndex: 'submittedDate',
      key: 'submittedDate',
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <Progress percent={record.progress} size="small" status={getStatusColor(record.status)} />
      ),
    },
  ];

  const steps = [
    {
      title: 'Select Permit Type',
      content: (
        <div>
          <Title level={4}>Choose Permit Category</Title>
          <Select
            style={{ width: '100%', marginBottom: 16 }}
            placeholder="Select a permit category"
            onChange={handleCategorySelect}
            loading={loading}
          >
            {categories.map(category => (
              <Select.Option key={category.id} value={category.id}>
                <Space>
                  <FileTextOutlined />
                  {category.name}
                  <Tag color="blue">{category.processingTime}</Tag>
                </Space>
              </Select.Option>
            ))}
          </Select>
          {selectedCategory && (
            <Card size="small" title="Requirements">
              <ul>
                {selectedCategory.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      ),
    },
    {
      title: 'Application Details',
      content: (
        <Form form={form} onFinish={handleSubmitApplication} layout="vertical">
          <Form.Item name="businessName" label="Business Name" initialValue={business?.businessName}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="description" label="Application Description" rules={[{ required: true, message: 'Please enter a description' }]}>
            <Input.TextArea rows={4} placeholder="Describe your permit application" />
          </Form.Item>
          <Form.Item name="documents" label="Supporting Documents">
            <Upload.Dragger name="documents" multiple>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag files to upload</p>
              <p className="ant-upload-hint">Support for PDF, DOC, DOCX files</p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Submit Application</Button>
              <Button onClick={() => setCurrentStep(0)}>Back</Button>
            </Space>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <Card loading={loading} title="General Permit Application">
      <Steps current={currentStep} items={steps.map(step => ({ title: step.title }))} />
      <div className="steps-content" style={{ marginTop: 24 }}>
        {steps[currentStep].content}
      </div>
      
      <Title level={4} style={{ marginTop: 32 }}>Your Applications</Title>
      <Table dataSource={applications} columns={applicationColumns} rowKey="applicationId" />
    </Card>
  );
};

export default GeneralPermitApplication;
