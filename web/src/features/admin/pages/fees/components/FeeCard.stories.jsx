import FeeCard from './FeeCard'

export default {
  title: 'Admin/Fees/FeeCard',
  component: FeeCard,
  tags: ['autodocs'],
  argTypes: {
    item: { control: 'object' },
    selectedId: { control: 'text' },
    selectedType: { control: 'select', options: ['fee_groups', 'fee_library', 'penalty_fees'] },
    onSelect: { action: 'clicked' },
  },
}

const mockToken = {
  colorPrimary: '#1677ff',
  colorFillAlter: 'rgba(0, 0, 0, 0.04)',
  colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
  colorBorderSecondary: 'rgba(0, 0, 0, 0.06)',
}

const mockFeeGroup = {
  _id: '1',
  name: 'New Business Permit',
  description: 'Standard fee package for new business applications including mayor\'s permit, environmental protection, and barangay clearance fees',
  fees: ['Mayor\'s Permit Fee', 'Environmental Protection Fee', 'Barangay Clearance Fee'],
  isActive: true,
  version: 1,
  effectiveDate: '2024-01-01',
}

const mockFee = {
  _id: 'f1',
  name: 'Mayor\'s Permit Fee',
  description: 'Standard permit fee for business operations and license renewal',
  amount: 500,
  category: 'permit',
  isActive: true,
  version: 1,
  effectiveDate: '2024-01-01',
}

const mockPenalty = {
  _id: 'p1',
  name: 'Late Renewal Penalty',
  description: 'Penalty fee for late business renewal applications submitted after the deadline',
  amount: 500,
  category: 'late_renewal',
  isActive: true,
  version: 1,
  effectiveDate: '2024-01-01',
}

export const FeeGroupActive = {
  args: {
    item: mockFeeGroup,
    selectedId: null,
    selectedType: 'fee_groups',
    token: mockToken,
  },
}

export const FeeGroupSelected = {
  args: {
    item: mockFeeGroup,
    selectedId: '1',
    selectedType: 'fee_groups',
    token: mockToken,
  },
}

export const FeeGroupDisabled = {
  args: {
    item: { ...mockFeeGroup, isActive: false },
    selectedId: null,
    selectedType: 'fee_groups',
    token: mockToken,
  },
}

export const FeeActive = {
  args: {
    item: mockFee,
    selectedId: null,
    selectedType: 'fee_library',
    token: mockToken,
  },
}

export const FeeSelected = {
  args: {
    item: mockFee,
    selectedId: 'f1',
    selectedType: 'fee_library',
    token: mockToken,
  },
}

export const FeeDisabled = {
  args: {
    item: { ...mockFee, isActive: false },
    selectedId: null,
    selectedType: 'fee_library',
    token: mockToken,
  },
}

export const PenaltyActive = {
  args: {
    item: mockPenalty,
    selectedId: null,
    selectedType: 'penalty_fees',
    token: mockToken,
  },
}

export const PenaltySelected = {
  args: {
    item: mockPenalty,
    selectedId: 'p1',
    selectedType: 'penalty_fees',
    token: mockToken,
  },
}

export const PenaltyDisabled = {
  args: {
    item: { ...mockPenalty, isActive: false },
    selectedId: null,
    selectedType: 'penalty_fees',
    token: mockToken,
  },
}

export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FeeCard item={mockFeeGroup} selectedId={null} selectedType="fee_groups" token={mockToken} onSelect={() => {}} />
      <FeeCard item={mockFee} selectedId={null} selectedType="fee_library" token={mockToken} onSelect={() => {}} />
      <FeeCard item={mockPenalty} selectedId={null} selectedType="penalty_fees" token={mockToken} onSelect={() => {}} />
    </div>
  ),
}
