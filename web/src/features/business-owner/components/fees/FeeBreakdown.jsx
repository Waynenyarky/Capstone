import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Space,
  Tag,
  Button,
  Divider,
  Row,
  Col,
  Progress,
  Tooltip,
  Alert,
  Timeline,
  List,
  Statistic,
  Modal,
  Descriptions,
  Badge,
  Switch
} from 'antd';
import {
  DollarOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  TrendingUpOutlined,
  EyeOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const FeeBreakdown = ({ 
  fees, 
  businessDetails, 
  showComparison = false, 
  onExport,
  onOptimize 
}) => {
  const [selectedFee, setSelectedFee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    if (fees) {
      generateHistoricalData();
    }
  }, [fees]);

  const generateHistoricalData = () => {
    // Mock historical data for fee changes
    const currentYear = new Date().getFullYear();
    const historical = [];
    
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const multiplier = 1 - (i * 0.05); // Assume 5% decrease per year going back
      
      historical.push({
        year,
        totalFees: Math.round(fees.totalFees * multiplier),
        mayorsPermitFee: Math.round(fees.mayorsPermitFee * multiplier),
        businessTax: Math.round(fees.businessTax * multiplier),
        regulatoryFees: Math.round(fees.regulatoryFees * multiplier),
        inspectionFees: Math.round(fees.inspectionFees * multiplier),
        additionalFees: Math.round(fees.additionalFees * multiplier),
        change: i === 0 ? 0 : Math.round((1 - multiplier) * 100)
      });
    }
    
    setHistoricalData(historical);
  };

  const getFeeCategoryColor = (category) => {
    const colors = {
      "Mayor's Permit Fee": '#1890ff',
      "Business Tax": '#52c41a',
      "Regulatory Fees": '#faad14',
      "Inspection Fees": '#722ed1',
      "Additional Fees": '#13c2c2'
    };
    return colors[category] || '#d9d9d9';
  };

  const getFeeIcon = (category) => {
    const icons = {
      "Mayor's Permit Fee": <FileTextOutlined />,
      "Business Tax": <BarChartOutlined />,
      "Regulatory Fees": <ExclamationCircleOutlined />,
      "Inspection Fees": <EyeOutlined />,
      "Additional Fees": <CalculatorOutlined />
    };
    return icons[category] || <DollarOutlined />;
  };

  const getOptimizationSuggestions = () => {
    const suggestions = [];
    
    // Analyze fee breakdown for optimization opportunities
    if (fees.businessTax > fees.totalFees * 0.4) {
      suggestions.push({
        type: 'tax_optimization',
        title: 'Tax Bracket Optimization',
        description: 'Consider revenue timing to optimize tax bracket',
        potentialSavings: Math.round(fees.businessTax * 0.1),
        difficulty: 'medium'
      });
    }
    
    if (fees.regulatoryFees > fees.totalFees * 0.3) {
      suggestions.push({
        type: 'regulatory_optimization',
        title: 'Regulatory Fee Reduction',
        description: 'Bundle inspections and permits for reduced fees',
        potentialSavings: Math.round(fees.regulatoryFees * 0.15),
        difficulty: 'easy'
      });
    }
    
    if (fees.inspectionFees > fees.totalFees * 0.2) {
      suggestions.push({
        type: 'inspection_optimization',
        title: 'Inspection Schedule Optimization',
        description: 'Schedule inspections during off-peak periods',
        potentialSavings: Math.round(fees.inspectionFees * 0.1),
        difficulty: 'easy'
      });
    }
    
    return suggestions;
  };

  const handleFeeClick = (fee) => {
    setSelectedFee(fee);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    onExport?.(fees);
  };

  const handleOptimize = () => {
    setShowOptimizationModal(true);
  };

  const renderFeeTable = () => {
    const columns = [
      {
        title: 'Fee Category',
        dataIndex: 'category',
        key: 'category',
        render: (text, record) => (
          <Space>
            <span style={{ color: getFeeCategoryColor(text) }}>
              {getFeeIcon(text)}
            </span>
            <Text strong>{text}</Text>
          </Space>
        )
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount) => (
          <Text strong style={{ fontSize: '16px' }}>
            ₱{amount.toLocaleString()}
          </Text>
        )
      },
      {
        title: 'Percentage',
        key: 'percentage',
        render: (_, record) => {
          const percentage = (record.amount / fees.totalFees * 100).toFixed(1);
          return (
            <Space>
              <Progress 
                percent={parseFloat(percentage)} 
                size="small" 
                strokeColor={getFeeCategoryColor(record.category)}
                style={{ width: 80 }}
              />
              <Text type="secondary">{percentage}%</Text>
            </Space>
          );
        }
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (description) => (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {description}
          </Text>
        )
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Tooltip title="View Details">
              <Button 
                type="text" 
                size="small" 
                icon={<InfoCircleOutlined />}
                onClick={() => handleFeeClick(record)}
              />
            </Tooltip>
            <Tooltip title="Legal Information">
              <Button 
                type="text" 
                size="small" 
                icon={<FileTextOutlined />}
              />
            </Tooltip>
          </Space>
        )
      }
    ];

    return (
      <Table
        dataSource={fees.breakdown}
        columns={columns}
        pagination={false}
        size="middle"
        rowKey="category"
      />
    );
  };

  const renderFeeSummary = () => {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Annual Fees"
              value={fees.totalFees}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Business Tax"
              value={fees.businessTax}
              prefix={<BarChartOutlined />}
              precision={0}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Regulatory Fees"
              value={fees.regulatoryFees}
              prefix={<ExclamationCircleOutlined />}
              precision={0}
              valueStyle={{ color: '#faad14', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tax Bracket"
              value={fees.taxBracket.bracket}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderFeeComparison = () => {
    if (!showComparison || historicalData.length === 0) return null;

    const comparisonColumns = [
      {
        title: 'Year',
        dataIndex: 'year',
        key: 'year'
      },
      {
        title: 'Total Fees',
        dataIndex: 'totalFees',
        key: 'totalFees',
        render: (amount) => `₱${amount.toLocaleString()}`
      },
      {
        title: 'Change',
        dataIndex: 'change',
        key: 'change',
        render: (change) => (
          <Tag color={change > 0 ? 'red' : change < 0 ? 'green' : 'default'}>
            {change > 0 ? '+' : ''}{change}%
          </Tag>
        )
      }
    ];

    return (
      <Card title="Historical Fee Comparison" style={{ marginBottom: '24px' }}>
        <Table
          dataSource={historicalData}
          columns={comparisonColumns}
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  const renderOptimizationSuggestions = () => {
    const suggestions = getOptimizationSuggestions();
    
    if (suggestions.length === 0) {
      return (
        <Alert
          message="No Optimization Opportunities"
          description="Your current fee structure is already optimized."
          type="success"
          showIcon
        />
      );
    }

    return (
      <div>
        <Title level={4}>Optimization Suggestions</Title>
        <List
          dataSource={suggestions}
          renderItem={(suggestion) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => handleOptimize()}
                >
                  Apply
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Badge count={`₱${suggestion.potentialSavings.toLocaleString()}`} />}
                title={
                  <Space>
                    {suggestion.title}
                    <Tag color={suggestion.difficulty === 'easy' ? 'green' : 'orange'}>
                      {suggestion.difficulty}
                    </Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical">
                    <Text>{suggestion.description}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Potential savings: ₱{suggestion.potentialSavings.toLocaleString()}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  return (
    <div className="fee-breakdown">
      <Title level={2}>
        <DollarOutlined /> Fee Breakdown
      </Title>
      <Paragraph type="secondary">
        Detailed breakdown of all business fees with legal references
      </Paragraph>

      <Space style={{ marginBottom: '16px' }}>
        <Button 
          icon={<DownloadOutlined />}
          onClick={handleExport}
        >
          Export Report
        </Button>
        <Button 
          icon={<BarChartOutlined />}
          onClick={() => setComparisonMode(!comparisonMode)}
        >
          {comparisonMode ? 'Hide' : 'Show'} Comparison
        </Button>
        <Button 
          icon={<TrendingUpOutlined />}
          onClick={handleOptimize}
        >
          Optimize Fees
        </Button>
      </Space>

      {renderFeeSummary()}
      {renderFeeTable()}
      {renderFeeComparison()}
      {renderOptimizationSuggestions()}

      {/* Fee Details Modal */}
      <Modal
        title={
          <Space>
            {selectedFee && getFeeIcon(selectedFee.category)}
            <span>{selectedFee?.category} Details</span>
          </Space>
        }
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        ]}
      >
        {selectedFee && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Category">
                {selectedFee.category}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong>₱{selectedFee.amount.toLocaleString()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedFee.description}
              </Descriptions.Item>
              <Descriptions.Item label="Legal Basis">
                {selectedFee.legalBasis}
              </Descriptions.Item>
              <Descriptions.Item label="Percentage of Total">
                {((selectedFee.amount / fees.totalFees) * 100).toFixed(1)}%
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Legal Information</Title>
            <Alert
              message={selectedFee.legalBasis}
              description="This fee is mandated by local government regulations. Please refer to the official code for complete details."
              type="info"
              showIcon
            />

            <Divider />

            <Title level={5}>Payment Schedule</Title>
            <Timeline>
              <Timeline.Item>
                <Text>Annual payment due on January 1st</Text>
              </Timeline.Item>
              <Timeline.Item>
                <Text>Late payment penalty: 2% per month</Text>
              </Timeline.Item>
              <Timeline.Item>
                <Text>Early payment discount: 5% before December 15th</Text>
              </Timeline.Item>
            </Timeline>
          </div>
        )}
      </Modal>

      {/* Optimization Modal */}
      <Modal
        title="Fee Optimization"
        open={showOptimizationModal}
        onCancel={() => setShowOptimizationModal(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setShowOptimizationModal(false)}>
            Cancel
          </Button>,
          <Button key="apply" type="primary" onClick={() => setShowOptimizationModal(false)}>
            Apply Optimizations
          </Button>
        ]}
      >
        {renderOptimizationSuggestions()}
      </Modal>

      {/* Historical Modal */}
      <Modal
        title="Historical Fee Trends"
        open={showHistoricalModal}
        onCancel={() => setShowHistoricalModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowHistoricalModal(false)}>
            Close
          </Button>
        ]}
      >
        <Timeline>
          {historicalData.map((data, index) => (
            <Timeline.Item
              key={data.year}
              color={index === 0 ? 'green' : 'blue'}
              dot={index === 0 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            >
              <div>
                <Text strong>{data.year}</Text>
                <br />
                <Text>Total Fees: ₱{data.totalFees.toLocaleString()}</Text>
                {data.change !== 0 && (
                  <Tag color={data.change > 0 ? 'red' : 'green'} style={{ marginLeft: '8px' }}>
                    {data.change > 0 ? '+' : ''}{data.change}%
                  </Tag>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Modal>
    </div>
  );
};

export default FeeBreakdown;
