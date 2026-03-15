import React, { useState, useEffect } from 'react';
import { Card, Typography, message, Descriptions, Slider, InputNumber, Row, Col } from 'antd';
import { getRiskImpactAnalysis } from '../../services/riskProfileService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;

const RiskImpactCalculator = () => {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    if (business?.id) {
      const fetchAnalysis = async () => {
        setLoading(true);
        try {
          const impactAnalysis = await getRiskImpactAnalysis(business.id);
          setAnalysis(impactAnalysis);
          setRevenue(impactAnalysis?.baseRevenue || 0);
        } catch (error) {
          message.error('Failed to load risk impact analysis.');
        } finally {
          setLoading(false);
        }
      };
      fetchAnalysis();
    }
  }, [business]);

  const calculateImpact = (newRevenue) => {
    if (!analysis) return { fees: 0, inspections: 0 };
    const feeImpact = (newRevenue / analysis.baseRevenue) * analysis.feeMultiplier;
    const inspectionImpact = (newRevenue / analysis.baseRevenue) * analysis.inspectionMultiplier;
    return {
        fees: (analysis.baseFees * feeImpact).toFixed(2),
        inspections: Math.ceil(analysis.baseInspections * inspectionImpact)
    };
  };

  const impact = calculateImpact(revenue);

  return (
    <Card loading={loading} title="Risk Impact Calculator">
        {analysis ? (
            <div>
                <Title level={4}>What-If Scenario</Title>
                <Row>
                    <Col span={12}>
                        <Slider
                            min={0}
                            max={analysis.baseRevenue * 2}
                            onChange={setRevenue}
                            value={typeof revenue === 'number' ? revenue : 0}
                        />
                    </Col>
                    <Col span={4}>
                        <InputNumber
                            min={0}
                            max={analysis.baseRevenue * 2}
                            style={{ margin: '0 16px' }}
                            value={revenue}
                            onChange={setRevenue}
                        />
                    </Col>
                </Row>
                <Descriptions bordered column={1} style={{ marginTop: 20 }}>
                    <Descriptions.Item label="Estimated Annual Fees">
                        <Text strong>${impact.fees}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Estimated Annual Inspections">
                        <Text strong>{impact.inspections}</Text>
                    </Descriptions.Item>
                </Descriptions>
            </div>
        ) : (
            <Text>No impact analysis data available.</Text>
        )}
    </Card>
  );
};

export default RiskImpactCalculator;
