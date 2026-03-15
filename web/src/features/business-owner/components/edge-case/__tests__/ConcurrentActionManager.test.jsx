import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { message } from 'antd';
import ConcurrentActionManager from '../ConcurrentActionManager';
import { getConcurrentActions, cancelAction } from '../../../services/concurrentActionService';
import { useBusiness } from '@/hooks/useBusiness';

// Mock dependencies
vi.mock('../../../services/concurrentActionService', () => ({
  getConcurrentActions: vi.fn(),
  cancelAction: vi.fn(),
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

describe('ConcurrentActionManager', () => {
  const mockBusiness = { id: 'business1', name: 'Test Business' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBusiness).mockReturnValue({ business: mockBusiness });
  });

  it('renders component with loading state', () => {
    render(<ConcurrentActionManager />);
    expect(screen.getByText('Concurrent Action Manager')).toBeInTheDocument();
  });

  it('shows no actions when none exist', async () => {
    vi.mocked(getConcurrentActions).mockResolvedValue({ actions: [] });
    render(<ConcurrentActionManager />);
    
    await waitFor(() => {
      expect(screen.getByText('No Concurrent Actions')).toBeInTheDocument();
      expect(screen.getByText('You have no actions running concurrently.')).toBeInTheDocument();
    });
  });

  it('displays actions when they exist', async () => {
    const mockActions = [
      {
        id: 'action1',
        type: 'Permit Application',
        status: 'In Progress',
        description: 'Submitting general permit application',
        progress: 75,
        startedAt: '2023-12-01T10:00:00Z'
      }
    ];
    
    vi.mocked(getConcurrentActions).mockResolvedValue({ actions: mockActions });
    render(<ConcurrentActionManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Permit Application')).toBeInTheDocument();
      expect(screen.getByText('Submitting general permit application')).toBeInTheDocument();
    });
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Network error';
    vi.mocked(getConcurrentActions).mockRejectedValue(new Error(errorMessage));
    
    render(<ConcurrentActionManager />);
    
    // Wait for the error message to be called
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to fetch concurrent actions.');
    }, { timeout: 3000 });
  });
});
