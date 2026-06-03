import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { message } from 'antd';
import TimelineEdgeCaseHandler from '../TimelineEdgeCaseHandler';
import { getTimelineEdgeCases } from '../../../services/timelineService';
import { useBusiness } from '@/hooks/useBusiness';

// Mock dependencies
vi.mock('../../../services/timelineService', () => ({
  getTimelineEdgeCases: vi.fn(),
  submitExtensionRequest: vi.fn(),
}));

vi.mock('@/hooks/useBusiness');

// Mock antd properly
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

describe('TimelineEdgeCaseHandler', () => {
  const mockBusiness = { id: 'business1', name: 'Test Business' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBusiness).mockReturnValue({ business: mockBusiness });
  });

  it('renders component with loading state', () => {
    render(<TimelineEdgeCaseHandler />);
    expect(screen.getByText('Timeline Edge Case Handler')).toBeInTheDocument();
  });

  it('shows no edge cases when none exist', async () => {
    vi.mocked(getTimelineEdgeCases).mockResolvedValue({ edgeCases: [] });
    render(<TimelineEdgeCaseHandler />);
    
    await waitFor(() => {
      expect(screen.getByText('No Edge Cases')).toBeInTheDocument();
      expect(screen.getByText('You have no special timing scenarios that require attention.')).toBeInTheDocument();
    });
  });

  it('displays edge cases when they exist', async () => {
    const mockEdgeCases = [
      {
        id: 'case1',
        type: 'Holiday Deadline',
        severity: 'High',
        description: 'Deadline falls on a public holiday',
        originalDeadline: '2023-12-25',
        gracePeriodEnds: '2023-12-27'
      }
    ];
    
    // Set up the mock before rendering
    vi.mocked(getTimelineEdgeCases).mockResolvedValue({ edgeCases: mockEdgeCases });
    render(<TimelineEdgeCaseHandler />);
    
    await waitFor(() => {
      expect(screen.getByText('Holiday Deadline')).toBeInTheDocument();
      expect(screen.getByText('Deadline falls on a public holiday')).toBeInTheDocument();
    });
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Network error';
    
    // Set up the mock before rendering
    vi.mocked(getTimelineEdgeCases).mockRejectedValue(new Error(errorMessage));
    render(<TimelineEdgeCaseHandler />);
    
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to fetch timeline edge cases.');
    });
  });
});
