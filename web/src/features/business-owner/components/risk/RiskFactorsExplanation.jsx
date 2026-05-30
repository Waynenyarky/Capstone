import { useState, useEffect } from 'react';
import { Card, Typography, message, List } from 'antd';
import { getRiskFactors } from '../../services/riskProfileService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;
const { Item } = List;

const RiskFactorsExplanation = () => {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState([]);

  useEffect(() => {
    if (business?.id) {
      const fetchFactors = async () => {
        setLoading(true);
        try {
          const riskFactors = await getRiskFactors(business.id);
          setFactors(riskFactors?.factors || []);
        } catch (error) {
          message.error('Failed to load risk factors.');
        } finally {
          setLoading(false);
        }
      };
      fetchFactors();
    }
  }, [business]);

  return (
    <Card loading={loading} title="How Your Risk is Calculated">
      <div>
        {factors.map(item => (
          <div key={item.id} style={{ marginBottom: 16 }}>
            <Text strong>{item.name}</Text>
            <br />
            <Text>{item.description}</Text>
            <br />
            <Text type={item.impact > 0 ? 'danger' : 'success'}>
              {item.impact > 0 ? `+${item.impact}` : item.impact}% Impact
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RiskFactorsExplanation;
