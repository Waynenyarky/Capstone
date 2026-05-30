import BorderBeam from './BorderBeam.jsx'
import { Typography } from 'antd'

const { Title, Text } = Typography

export default {
  title: 'Shared/BorderBeam',
  component: BorderBeam,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    children: (
      <div style={{ padding: 24, textAlign: 'center', width: 300 }}>
        <Title level={4}>BorderBeam Effect</Title>
        <Text type="secondary">Animated beam of light traveling along the border</Text>
      </div>
    ),
  },
}

export const FastBeam = {
  args: {
    duration: 2,
    children: (
      <div style={{ padding: 24, textAlign: 'center', width: 300 }}>
        <Title level={4}>Fast Beam</Title>
        <Text type="secondary">2 second duration</Text>
      </div>
    ),
  },
}

export const ThickBorder = {
  args: {
    borderWidth: 4,
    children: (
      <div style={{ padding: 24, textAlign: 'center', width: 300 }}>
        <Title level={4}>Thick Border</Title>
        <Text type="secondary">4px border width</Text>
      </div>
    ),
  },
}

export const Reversed = {
  args: {
    reverse: true,
    children: (
      <div style={{ padding: 24, textAlign: 'center', width: 300 }}>
        <Title level={4}>Reverse Direction</Title>
        <Text type="secondary">Beam traveling counter-clockwise</Text>
      </div>
    ),
  },
}

export const CustomColors = {
  args: {
    colorFrom: '#ff6b6b',
    colorMid: '#4ecdc4',
    colorTo: '#ffe66d',
    children: (
      <div style={{ padding: 24, textAlign: 'center', width: 300 }}>
        <Title level={4}>Custom Colors</Title>
        <Text type="secondary">Custom gradient colors</Text>
      </div>
    ),
  },
}
