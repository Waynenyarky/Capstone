import { useState, useEffect } from 'react';
import { Tour, Button, Card, Typography, Space, Badge } from 'antd';
import { 
  InfoCircleOutlined, 
  FileTextOutlined, 
  CalendarOutlined, 
  CreditCardOutlined, 
  BellOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const OnboardingTour = ({ 
  isOpen, 
  onClose, 
  business, 
  user, 
  completedSteps = [], 
  onStepComplete 
}) => {
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const tourRef = useRef();

  const tourSteps = [
    {
      title: 'Welcome to Your Dashboard!',
      content: (
        <Card size="small">
          <Paragraph>
            Congratulations! Your business <strong>{business?.businessName}</strong> has been approved.
            This tour will guide you through your new dashboard features.
          </Paragraph>
          <Space direction="vertical">
            <Text type="secondary">
              <InfoCircleOutlined /> Take a moment to explore each section
            </Text>
          </Space>
        </Card>
      ),
      target: () => document.querySelector('.dashboard-overview'),
      icon: <InfoCircleOutlined />
    },
    {
      title: 'Business Overview',
      content: (
        <Card size="small">
          <Paragraph>
            This is your business overview. Here you can see your business status, 
            permit information, and quick actions.
          </Paragraph>
          <Space>
            <Badge status="success" text="Active" />
            <Text type="secondary">Permit #: {business?.permitNumber}</Text>
          </Space>
        </Card>
      ),
      target: () => document.querySelector('.business-overview-card'),
      icon: <FileTextOutlined />
    },
    {
      title: 'Document Management',
      content: (
        <Card size="small">
          <Paragraph>
            Access all your business documents, permits, and certificates here.
            Download your official permit certificate.
          </Paragraph>
          <Button type="primary" size="small" icon={<FileTextOutlined />}>
            View Documents
          </Button>
        </Card>
      ),
      target: () => document.querySelector('.documents-section'),
      icon: <FileTextOutlined />
    },
    {
      title: 'Inspections & Compliance',
      content: (
        <Card size="small">
          <Paragraph>
            Schedule and track inspections. Stay compliant with local regulations
            by addressing any violations promptly.
          </Paragraph>
          <Space>
            <Badge count={business?.pendingInspections || 0} showZero>
              <Button size="small" icon={<CalendarOutlined />}>
                Inspections
              </Button>
            </Badge>
          </Space>
        </Card>
      ),
      target: () => document.querySelector('.inspections-section'),
      icon: <CalendarOutlined />
    },
    {
      title: 'Payments & Fees',
      content: (
        <Card size="small">
          <Paragraph>
            Manage payments for permits, fees, and violations. Set up automatic
            payments to never miss a deadline.
          </Paragraph>
          <Button type="primary" size="small" icon={<CreditCardOutlined />}>
            Manage Payments
          </Button>
        </Card>
      ),
      target: () => document.querySelector('.payments-section'),
      icon: <CreditCardOutlined />
    },
    {
      title: 'Notifications',
      content: (
        <Card size="small">
          <Paragraph>
            Stay updated with important deadlines, inspection results, and
            business requirements. Enable notifications to receive alerts.
          </Paragraph>
          <Space>
            <Badge count={business?.unreadNotifications || 0} showZero>
              <Button size="small" icon={<BellOutlined />}>
                Notifications
              </Button>
            </Badge>
          </Space>
        </Card>
      ),
      target: () => document.querySelector('.notifications-section'),
      icon: <BellOutlined />
    },
    {
      title: 'Analytics & Reports',
      content: (
        <Card size="small">
          <Paragraph>
            View your business analytics, generate reports, and track your
            compliance history.
          </Paragraph>
          <Button size="small" icon={<BarChartOutlined />}>
            View Analytics
          </Button>
        </Card>
      ),
      target: () => document.querySelector('.analytics-section'),
      icon: <BarChartOutlined />
    },
    {
      title: 'Settings & Profile',
      content: (
        <Card size="small">
          <Paragraph>
            Manage your business profile, update contact information, and
            configure your account settings.
          </Paragraph>
          <Button size="small" icon={<SettingOutlined />}>
            Settings
          </Button>
        </Card>
      ),
      target: () => document.querySelector('.settings-section'),
      icon: <SettingOutlined />
    },
    {
      title: 'Support & Help',
      content: (
        <Card size="small">
          <Paragraph>
            Need assistance? Contact our support team or browse our
            help documentation.
          </Paragraph>
          <Space>
            <Button size="small" icon={<TeamOutlined />}>
              Contact Support
            </Button>
          </Space>
        </Card>
      ),
      target: () => document.querySelector('.support-section'),
      icon: <TeamOutlined />
    }
  ];

  const handleTourComplete = () => {
    onStepComplete?.('tour_completed');
    onClose();
  };

  const handleTourSkip = () => {
    onStepComplete?.('tour_skipped');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentTourStep(0);
    }
  }, [isOpen]);

  return (
    <Tour
      ref={tourRef}
      open={isOpen}
      onClose={handleTourComplete}
      steps={tourSteps}
      current={currentTourStep}
      onChange={setCurrentTourStep}
      indicatorsRender={(current, total) => (
        <span>
          {current + 1} / {total}
        </span>
      )}
      type="default"
      className="onboarding-tour"
    />
  );
};

export default OnboardingTour;
