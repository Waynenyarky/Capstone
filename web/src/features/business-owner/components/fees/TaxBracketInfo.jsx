import { useState, useEffect } from 'react';
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
  Statistic,
  Modal,
  Badge,
  Slider,
  InputNumber,
  Select
} from 'antd';
import {
  CalculatorOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  DownloadOutlined,
  BarChartOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const TaxBracketInfo = ({ 
  currentGrossReceipts, 
  businessType, 
  onBracketChange,
  showCalculator = false 
}) => {
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [simulationGrossReceipts, setSimulationGrossReceipts] = useState(currentGrossReceipts || 0);
  const [historicalData, setHistoricalData] = useState([]);

  // Tax brackets based on LGU ordinance
  const taxBrackets = [
    {
      bracket: 'A',
      min: 0,
      max: 400000,
      rate: 0.02,
      description: 'Small businesses with gross receipts up to ₱400,000',
      examples: 'Sari-sari store, small carinderia, home-based business',
      legalBasis: 'Revenue Code Section 143(a)',
      effectiveDate: '2023-01-01'
    },
    {
      bracket: 'B',
      min: 400001,
      max: 800000,
      rate: 0.03,
      description: 'Medium-small businesses with gross receipts ₱400,001 - ₱800,000',
      examples: 'Medium restaurant, retail store, service center',
      legalBasis: 'Revenue Code Section 143(b)',
      effectiveDate: '2023-01-01'
    },
    {
      bracket: 'C',
      min: 800001,
      max: 1500000,
      rate: 0.04,
      description: 'Medium businesses with gross receipts ₱800,001 - ₱1,500,000',
      examples: 'Large restaurant, supermarket, manufacturing plant',
      legalBasis: 'Revenue Code Section 143(c)',
      effectiveDate: '2023-01-01'
    },
    {
      bracket: 'D',
      min: 1500001,
      max: 3000000,
      rate: 0.05,
      description: 'Large businesses with gross receipts ₱1,500,001 - ₱3,000,000',
      examples: 'Shopping mall, hotel chain, industrial complex',
      legalBasis: 'Revenue Code Section 143(d)',
      effectiveDate: '2023-01-01'
    },
    {
      bracket: 'E',
      min: 3000001,
      max: Infinity,
      rate: 0.06,
      description: 'Very large businesses with gross receipts over ₱3,000,000',
      examples: 'Corporate headquarters, large manufacturing, real estate development',
      legalBasis: 'Revenue Code Section 143(e)',
      effectiveDate: '2023-01-01'
    }
  ];

  useEffect(() => {
    if (currentGrossReceipts) {
      const bracket = getCurrentBracket(currentGrossReceipts);
      setSelectedBracket(bracket);
      setSimulationGrossReceipts(currentGrossReceipts);
      generateHistoricalData();
    }
  }, [currentGrossReceipts]);

  const getCurrentBracket = (grossReceipts) => {
    return taxBrackets.find(bracket => 
      grossReceipts >= bracket.min && grossReceipts <= bracket.max
    ) || taxBrackets[0];
  };

  const calculateTax = (grossReceipts, bracket) => {
    const taxableAmount = Math.min(grossReceipts, bracket.max) - bracket.min;
    return taxableAmount * bracket.rate;
  };

  const generateHistoricalData = () => {
    const currentYear = new Date().getFullYear();
    const historical = [];
    
    // Mock historical tax bracket changes
    for (let i = 5; i >= 0; i--) {
      const year = currentYear - i;
      let historicalBrackets = [...taxBrackets];
      
      // Simulate historical changes
      if (year <= 2020) {
        historicalBrackets = historicalBrackets.map(bracket => ({
          ...bracket,
          rate: bracket.rate * 0.8 // 20% lower rates before 2021
        }));
      } else if (year <= 2018) {
        historicalBrackets = historicalBrackets.map(bracket => ({
          ...bracket,
          rate: bracket.rate * 0.6 // 40% lower rates before 2019
        }));
      }
      
      historical.push({
        year,
        brackets: historicalBrackets,
        currentBracket: getCurrentBracket(currentGrossReceipts),
        tax: calculateTax(currentGrossReceipts, getCurrentBracket(currentGrossReceipts))
      });
    }
    
    setHistoricalData(historical);
  };

  const handleSimulationChange = (value) => {
    setSimulationGrossReceipts(value);
    const newBracket = getCurrentBracket(value);
    setSelectedBracket(newBracket);
    onBracketChange?.(newBracket, value);
  };

  const getBracketColor = (bracket) => {
    const colors = {
      'A': '#52c41a',
      'B': '#1890ff',
      'C': '#faad14',
      'D': '#722ed1',
      'E': '#f5222d'
    };
    return colors[bracket] || '#d9d9d9';
  };

  const renderBracketTable = () => {
    const columns = [
      {
        title: 'Bracket',
        dataIndex: 'bracket',
        key: 'bracket',
        render: (bracket, record) => (
          <Space>
            <Tag color={getBracketColor(bracket)}>
              {bracket}
            </Tag>
            {selectedBracket?.bracket === bracket && (
              <Badge status="processing" text="Current" />
            )}
          </Space>
        )
      },
      {
        title: 'Gross Receipts Range',
        key: 'range',
        render: (_, record) => (
          <Text>
            ₱{record.min.toLocaleString()} - {record.max === Infinity ? '∞' : `₱${record.max.toLocaleString()}`}
          </Text>
        )
      },
      {
        title: 'Tax Rate',
        dataIndex: 'rate',
        key: 'rate',
        render: (rate) => (
          <Text strong>{(rate * 100).toFixed(1)}%</Text>
        )
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
        title: 'Examples',
        dataIndex: 'examples',
        key: 'examples',
        render: (examples) => (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {examples}
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
                onClick={() => setSelectedBracket(record)}
              />
            </Tooltip>
          </Space>
        )
      }
    ];

    return (
      <Table
        dataSource={taxBrackets}
        columns={columns}
        pagination={false}
        size="middle"
        rowKey="bracket"
      />
    );
  };

  const renderCurrentBracketInfo = () => {
    if (!selectedBracket) return null;

    const currentTax = calculateTax(simulationGrossReceipts, selectedBracket);
    const nextBracket = taxBrackets.find(bracket => bracket.min > selectedBracket.max);
    const previousBracket = taxBrackets.find(bracket => bracket.max < selectedBracket.min);

    return (
      <Card 
        title={
          <Space>
            <Tag color={getBracketColor(selectedBracket.bracket)}>
              Current Bracket: {selectedBracket.bracket}
            </Tag>
            <Text strong>₱{currentTax.toLocaleString()}</Text>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic
              title="Tax Rate"
              value={(selectedBracket.rate * 100).toFixed(1)}
              suffix="%"
              prefix={<CalculatorOutlined />}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Taxable Amount"
              value={Math.min(simulationGrossReceipts, selectedBracket.max) - selectedBracket.min}
              prefix={<DollarOutlined />}
              precision={0}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Business Tax"
              value={currentTax}
              prefix={<DollarOutlined />}
              precision={0}
            />
          </Col>
        </Row>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Bracket Information:</Text>
          <Text>{selectedBracket.description}</Text>
          <Text type="secondary">Examples: {selectedBracket.examples}</Text>
          <Text type="secondary">Legal Basis: {selectedBracket.legalBasis}</Text>
          <Text type="secondary">Effective Date: {selectedBracket.effectiveDate}</Text>
        </Space>

        {nextBracket && (
          <Alert
            message="Next Bracket Information"
            description={
              <div>
                <p>To reach Bracket {nextBracket.bracket}, increase gross receipts to ₱{(nextBracket.min).toLocaleString()}</p>
                <p>Next bracket rate: {(nextBracket.rate * 100).toFixed(1)}%</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}

        {previousBracket && (
          <Alert
            message="Previous Bracket Information"
            description={
              <div>
                <p>To stay in Bracket {previousBracket.bracket}, keep gross receipts below ₱{(previousBracket.max + 1).toLocaleString()}</p>
                <p>Previous bracket rate: {(previousBracket.rate * 100).toFixed(1)}%</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>
    );
  };

  const renderTaxCalculator = () => {
    if (!showCalculator) return null;

    const currentTax = calculateTax(simulationGrossReceipts, selectedBracket);
    const nextBracket = taxBrackets.find(bracket => bracket.min > simulationGrossReceipts);
    const bracketThreshold = nextBracket ? nextBracket.min : null;
    const distanceToNext = bracketThreshold ? bracketThreshold - simulationGrossReceipts : 0;

    return (
      <Card title="Tax Calculator" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Gross Receipts Simulation:</Text>
            <Slider
              min={0}
              max={5000000}
              step={10000}
              value={simulationGrossReceipts}
              onChange={handleSimulationChange}
              formatter={value => `₱${value.toLocaleString()}`}
              style={{ marginTop: '8px' }}
            />
            <InputNumber
              style={{ width: '100%', marginTop: '8px' }}
              value={simulationGrossReceipts}
              onChange={handleSimulationChange}
              formatter={value => `₱${value.toLocaleString()}`}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
              min={0}
              step={10000}
            />
          </div>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Statistic
                title="Current Tax"
                value={currentTax}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Statistic
                title="Effective Rate"
                value={(currentTax / simulationGrossReceipts * 100).toFixed(2)}
                suffix="%"
                prefix={<CalculatorOutlined />}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>

          {distanceToNext > 0 && (
            <Alert
              message="Next Bracket Threshold"
              description={
                <div>
                  <p>Increase gross receipts by ₱{distanceToNext.toLocaleString()} to reach the next tax bracket</p>
                  <Progress 
                    percent={(simulationGrossReceipts / bracketThreshold) * 100} 
                    status="active"
                    style={{ marginTop: '8px' }}
                  />
                </div>
              }
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>
    );
  };

  const renderHistoricalTrends = () => {
    if (historicalData.length === 0) return null;

    const columns = [
      {
        title: 'Year',
        dataIndex: 'year',
        key: 'year'
      },
      {
        title: 'Current Bracket',
        dataIndex: ['currentBracket', 'bracket'],
        key: 'currentBracket',
        render: (bracket) => (
          <Tag color={getBracketColor(bracket)}>
            {bracket}
          </Tag>
        )
      },
      {
        title: 'Tax Rate',
        dataIndex: ['currentBracket', 'rate'],
        key: 'taxRate',
        render: (rate) => `${(rate * 100).toFixed(1)}%`
      },
      {
        title: 'Tax Amount',
        dataIndex: 'tax',
        key: 'tax',
        render: (tax) => `₱${tax.toLocaleString()}`
      }
    ];

    return (
      <Card title="Historical Tax Trends" style={{ marginBottom: '24px' }}>
        <Table
          dataSource={historicalData}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  return (
    <div className="tax-bracket-info">
      <Title level={2}>
        <CalculatorOutlined /> Tax Bracket Information
      </Title>
      <Paragraph type="secondary">
        Understand your business tax classification and optimize your tax strategy
      </Paragraph>

      <Space style={{ marginBottom: '16px' }}>
        <Button 
          icon={<BarChartOutlined />}
          onClick={() => setShowCalculator(!showCalculator)}
        >
          {showCalculator ? 'Hide' : 'Show'} Calculator
        </Button>
        <Button 
          icon={<HistoryOutlined />}
          onClick={() => setShowDetailsModal(true)}
        >
          Historical Trends
        </Button>
        <Button 
          icon={<DownloadOutlined />}
        >
          Export Tax Info
        </Button>
      </Space>

      {renderCurrentBracketInfo()}
      {renderTaxCalculator()}
      {renderBracketTable()}
      {renderHistoricalTrends()}

      {/* Historical Trends Modal */}
      <Modal
        title="Historical Tax Trends"
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        ]}
      >
        {renderHistoricalTrends()}
      </Modal>
    </div>
  );
};

export default TaxBracketInfo;
