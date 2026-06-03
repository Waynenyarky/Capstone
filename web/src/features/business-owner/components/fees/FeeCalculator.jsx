import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  Alert,
  Row,
  Col,
  Switch,
  Tooltip,
  Progress,
  Tag,
  Statistic,
  Table
} from 'antd';
import {
  CalculatorOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const FeeCalculator = ({ business, onCalculationComplete }) => {
  const { calculateBusinessFees } = useBusiness();
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [whatIfScenarios, setWhatIfScenarios] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);

  // Business types with their characteristics
  const businessTypes = {
    restaurant: {
      label: 'Restaurant',
      baseFee: 5000,
      multiplier: 1.2,
      sanitaryInspection: true,
      fireInspection: true,
      healthPermit: true
    },
    retail: {
      label: 'Retail Store',
      baseFee: 3000,
      multiplier: 1.0,
      sanitaryInspection: false,
      fireInspection: true,
      healthPermit: false
    },
    service: {
      label: 'Service Business',
      baseFee: 2000,
      multiplier: 0.8,
      sanitaryInspection: false,
      fireInspection: false,
      healthPermit: false
    },
    manufacturing: {
      label: 'Manufacturing',
      baseFee: 8000,
      multiplier: 1.5,
      sanitaryInspection: true,
      fireInspection: true,
      environmentalPermit: true
    },
    ecommerce: {
      label: 'E-commerce',
      baseFee: 1500,
      multiplier: 0.6,
      sanitaryInspection: false,
      fireInspection: false,
      healthPermit: false
    }
  };

  // Tax brackets based on gross receipts
  const taxBrackets = [
    { min: 0, max: 400000, rate: 0.02, bracket: 'A' },
    { min: 400001, max: 800000, rate: 0.03, bracket: 'B' },
    { min: 800001, max: 1500000, rate: 0.04, bracket: 'C' },
    { min: 1500001, max: 3000000, rate: 0.05, bracket: 'D' },
    { min: 3000001, max: Infinity, rate: 0.06, bracket: 'E' }
  ];

  useEffect(() => {
    if (business) {
      // Pre-fill form with business data
      form.setFieldsValue({
        businessType: business.businessType?.toLowerCase(),
        grossReceipts: business.annualRevenue || 0,
        employees: business.employees || 0,
        businessArea: business.businessArea || 100
      });
    }
  }, [business, form]);

  const calculateFees = async (values) => {
    setLoading(true);
    
    try {
      // Mock fee calculation - in real implementation, this would call the API
      const businessType = businessTypes[values.businessType];
      const taxBracket = getTaxBracket(values.grossReceipts);
      
      // Calculate base fees
      const mayorsPermitFee = businessType.baseFee * businessType.multiplier;
      
      // Calculate business tax
      const businessTax = calculateBusinessTax(values.grossReceipts, taxBracket);
      
      // Calculate regulatory fees
      const regulatoryFees = calculateRegulatoryFees(values, businessType);
      
      // Calculate inspection fees
      const inspectionFees = calculateInspectionFees(values, businessType);
      
      // Calculate additional fees
      const additionalFees = calculateAdditionalFees(values, businessType);
      
      const totalFees = mayorsPermitFee + businessTax + regulatoryFees + inspectionFees + additionalFees;
      
      const breakdown = {
        mayorsPermitFee,
        businessTax,
        regulatoryFees,
        inspectionFees,
        additionalFees,
        totalFees,
        taxBracket,
        businessType: businessType.label,
        breakdown: [
          {
            category: "Mayor's Permit Fee",
            amount: mayorsPermitFee,
            description: "Annual permit for business operation",
            legalBasis: "Local Government Code Section 132"
          },
          {
            category: "Business Tax",
            amount: businessTax,
            description: `Tax based on gross receipts (${taxBracket.bracket} bracket)`,
            legalBasis: "Revenue Code Section 143"
          },
          {
            category: "Regulatory Fees",
            amount: regulatoryFees,
            description: "Sanitary, Fire Safety, and other regulatory fees",
            legalBasis: "Health and Safety Code"
          },
          {
            category: "Inspection Fees",
            amount: inspectionFees,
            description: "Annual inspection and compliance fees",
            legalBasis: "Building Code Section 150"
          },
          {
            category: "Additional Fees",
            amount: additionalFees,
            description: "Environmental, signage, and other miscellaneous fees",
            legalBasis: "Local Ordinance 2023-001"
          }
        ]
      };

      setFeeBreakdown(breakdown);
      
      // Generate what-if scenarios
      await generateWhatIfScenarios(values, businessType);
      
      // Generate historical data
      await generateHistoricalData(values, businessType);
      
      onCalculationComplete?.(breakdown);
      
    } catch (error) {
      console.error('Error calculating fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaxBracket = (grossReceipts) => {
    return taxBrackets.find(bracket => 
      grossReceipts >= bracket.min && grossReceipts <= bracket.max
    ) || taxBrackets[0];
  };

  const calculateBusinessTax = (grossReceipts, bracket) => {
    const taxableAmount = Math.min(grossReceipts, bracket.max) - bracket.min;
    return taxableAmount * bracket.rate;
  };

  const calculateRegulatoryFees = (values, businessType) => {
    let fees = 0;
    
    if (businessType.sanitaryInspection) {
      fees += 1500; // Sanitary permit
    }
    
    if (businessType.fireInspection) {
      fees += 2000; // Fire safety permit
    }
    
    if (businessType.healthPermit) {
      fees += 1000; // Health permit
    }
    
    if (businessType.environmentalPermit) {
      fees += 3000; // Environmental permit
    }
    
    // Employee-based fees
    if (values.employees > 10) {
      fees += (values.employees - 10) * 100;
    }
    
    return fees;
  };

  const calculateInspectionFees = (values, businessType) => {
    let fees = 0;
    
    // Base inspection fee
    fees += 500;
    
    // Area-based inspection fee
    if (values.businessArea > 100) {
      fees += Math.ceil((values.businessArea - 100) / 50) * 200;
    }
    
    // Business type-specific inspection fees
    if (businessType.label === 'Restaurant') {
      fees += 1000; // Food service inspection
    }
    
    if (businessType.label === 'Manufacturing') {
      fees += 1500; // Industrial inspection
    }
    
    return fees;
  };

  const calculateAdditionalFees = (values, businessType) => {
    let fees = 0;
    
    // Signage fee
    fees += 300;
    
    // Waste management fee
    fees += 500;
    
    // Community tax
    fees += 200;
    
    // Business type-specific additional fees
    if (businessType.label === 'Restaurant') {
      fees += 800; // Food handling permit
    }
    
    if (businessType.label === 'Retail') {
      fees += 400; // Display permit
    }
    
    return fees;
  };

  const generateWhatIfScenarios = async (currentValues, businessType) => {
    const scenarios = [
      {
        name: 'Revenue Increase 20%',
        values: { ...currentValues, grossReceipts: currentValues.grossReceipts * 1.2 }
      },
      {
        name: 'Add 5 Employees',
        values: { ...currentValues, employees: currentValues.employees + 5 }
      },
      {
        name: 'Expand Business Area',
        values: { ...currentValues, businessArea: currentValues.businessArea + 50 }
      },
      {
        name: 'Revenue Decrease 20%',
        values: { ...currentValues, grossReceipts: currentValues.grossReceipts * 0.8 }
      }
    ];

    const scenarioResults = await Promise.all(
      scenarios.map(async (scenario) => {
        const taxBracket = getTaxBracket(scenario.values.grossReceipts);
        const mayorsPermitFee = businessType.baseFee * businessType.multiplier;
        const businessTax = calculateBusinessTax(scenario.values.grossReceipts, taxBracket);
        const regulatoryFees = calculateRegulatoryFees(scenario.values, businessType);
        const inspectionFees = calculateInspectionFees(scenario.values, businessType);
        const additionalFees = calculateAdditionalFees(scenario.values, businessType);
        
        return {
          name: scenario.name,
          totalFees: mayorsPermitFee + businessTax + regulatoryFees + inspectionFees + additionalFees,
          change: 0 // Will be calculated relative to current
        };
      })
    );

    // Calculate changes relative to current
    const currentTotal = feeBreakdown?.totalFees || 0;
    scenarioResults.forEach(scenario => {
      scenario.change = ((scenario.totalFees - currentTotal) / currentTotal * 100).toFixed(1);
    });

    setWhatIfScenarios(scenarioResults);
  };

  const generateHistoricalData = async (values, businessType) => {
    // Mock historical data for the past 3 years
    const historical = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 2; i >= 0; i--) {
      const year = currentYear - i;
      const historicalValues = {
        ...values,
        grossReceipts: values.grossReceipts * (1 - i * 0.1), // Assume 10% growth per year
        employees: Math.max(1, values.employees - i * 2)
      };
      
      const taxBracket = getTaxBracket(historicalValues.grossReceipts);
      const mayorsPermitFee = businessType.baseFee * businessType.multiplier;
      const businessTax = calculateBusinessTax(historicalValues.grossReceipts, taxBracket);
      const regulatoryFees = calculateRegulatoryFees(historicalValues, businessType);
      const inspectionFees = calculateInspectionFees(historicalValues, businessType);
      const additionalFees = calculateAdditionalFees(historicalValues, businessType);
      
      historical.push({
        year,
        totalFees: mayorsPermitFee + businessTax + regulatoryFees + inspectionFees + additionalFees,
        grossReceipts: historicalValues.grossReceipts,
        employees: historicalValues.employees
      });
    }
    
    setHistoricalData(historical);
  };

  const onFinish = (values) => {
    calculateFees(values);
  };

  const renderFeeBreakdown = () => {
    if (!feeBreakdown) return null;

    const columns = [
      {
        title: 'Fee Category',
        dataIndex: 'category',
        key: 'category',
        render: (text, record) => (
          <Space direction="vertical" size="small">
            <Text strong>{text}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          </Space>
        )
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount) => (
          <Text strong>₱{amount.toLocaleString()}</Text>
        )
      },
      {
        title: 'Legal Basis',
        dataIndex: 'legalBasis',
        key: 'legalBasis',
        render: (basis) => (
          <Tooltip title={basis}>
            <Text type="secondary" style={{ fontSize: '12px', cursor: 'help' }}>
              {basis}
            </Text>
          </Tooltip>
        )
      },
      {
        title: 'Percentage',
        key: 'percentage',
        render: (_, record) => {
          const percentage = (record.amount / feeBreakdown.totalFees * 100).toFixed(1);
          return (
            <Space>
              <Progress 
                percent={parseFloat(percentage)} 
                size="small" 
                style={{ width: 60 }}
              />
              <Text type="secondary">{percentage}%</Text>
            </Space>
          );
        }
      }
    ];

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Annual Fees"
                value={feeBreakdown.totalFees}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Business Tax"
                value={feeBreakdown.businessTax}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Regulatory Fees"
                value={feeBreakdown.regulatoryFees}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tax Bracket"
                value={feeBreakdown.taxBracket.bracket}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Fee Breakdown" style={{ marginBottom: '24px' }}>
          <Table
            dataSource={feeBreakdown.breakdown}
            columns={columns}
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="Tax Bracket Information" style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message={`Current Tax Bracket: ${feeBreakdown.taxBracket.bracket}`}
              description={
                <div>
                  <p>Gross Receipts Range: ₱{feeBreakdown.taxBracket.min.toLocaleString()} - ₱{feeBreakdown.taxBracket.max === Infinity ? '∞' : feeBreakdown.taxBracket.max.toLocaleString()}</p>
                  <p>Tax Rate: {(feeBreakdown.taxBracket.rate * 100).toFixed(1)}%</p>
                  <p>Business Type: {feeBreakdown.businessType}</p>
                </div>
              }
              type="info"
              showIcon
            />
            
            <div style={{ marginTop: '16px' }}>
              <Text strong>All Tax Brackets:</Text>
              <div style={{ marginTop: '8px' }}>
                {taxBrackets.map((bracket, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Tag color={bracket.bracket === feeBreakdown.taxBracket.bracket ? 'blue' : 'default'}>
                      Bracket {bracket.bracket}: {(bracket.rate * 100).toFixed(1)}%
                    </Tag>
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      ₱{bracket.min.toLocaleString()} - {bracket.max === Infinity ? '∞' : `₱${bracket.max.toLocaleString()}`}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </Space>
        </Card>
      </div>
    );
  };

  const renderWhatIfScenarios = () => {
    if (whatIfScenarios.length === 0) return null;

    return (
      <Card title="What-If Scenarios" style={{ marginBottom: '24px' }}>
        <Table
          dataSource={whatIfScenarios}
          columns={[
            {
              title: 'Scenario',
              dataIndex: 'name',
              key: 'name'
            },
            {
              title: 'New Total Fees',
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
          ]}
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  const renderHistoricalData = () => {
    if (historicalData.length === 0) return null;

    return (
      <Card title="Historical Fee Trends" style={{ marginBottom: '24px' }}>
        <Table
          dataSource={historicalData}
          columns={[
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
              title: 'Gross Receipts',
              dataIndex: 'grossReceipts',
              key: 'grossReceipts',
              render: (amount) => `₱${amount.toLocaleString()}`
            },
            {
              title: 'Employees',
              dataIndex: 'employees',
              key: 'employees'
            }
          ]}
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  return (
    <div className="fee-calculator">
      <Title level={2}>
        <CalculatorOutlined /> Fee Calculator
      </Title>
      <Paragraph type="secondary">
        Calculate and understand your business fees with complete transparency
      </Paragraph>

      <Card title="Business Information" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            businessType: 'restaurant',
            grossReceipts: 1000000,
            employees: 10,
            businessArea: 100
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Business Type"
                name="businessType"
                rules={[{ required: true, message: 'Please select business type' }]}
              >
                <Select placeholder="Select business type">
                  {Object.entries(businessTypes).map(([key, type]) => (
                    <Option key={key} value={key}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={
                  <Space>
                    Annual Gross Receipts
                    <Tooltip title="Total annual revenue before expenses">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                name="grossReceipts"
                rules={[{ required: true, message: 'Please enter gross receipts' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₱\s?|(,*)/g, '')}
                  min={0}
                  step={10000}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Number of Employees"
                name="employees"
                rules={[{ required: true, message: 'Please enter number of employees' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={1000}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Business Area (sq meters)"
                name="businessArea"
                rules={[{ required: true, message: 'Please enter business area' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={10}
                  max={10000}
                  step={10}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<CalculatorOutlined />}
                  >
                    Calculate Fees
                  </Button>
                  
                  <Button 
                    type="default" 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    icon={<SettingOutlined />}
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          {showAdvanced && (
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Alert
                  message="Advanced Options"
                  description="Additional calculation parameters for more accurate fee estimation"
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item label="Has Food Service">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item label="Has Liquor License">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item label="Outdoor Seating">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
        </Form>
      </Card>

      {renderFeeBreakdown()}
      {renderWhatIfScenarios()}
      {renderHistoricalData()}
    </div>
  );
};

export default FeeCalculator;
