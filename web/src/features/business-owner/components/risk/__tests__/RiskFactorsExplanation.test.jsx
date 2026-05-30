import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock antd
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Typography: {
      Title: ({ children }) => <h1>{children}</h1>,
      Text: ({ children }) => <span>{children}</span>,
    },
    Card: ({ children, title, ...props }) => <div title={title} {...props}>{children}</div>,
    List: {
      Item: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

import RiskFactorsExplanation from '../RiskFactorsExplanation';

describe('RiskFactorsExplanation - Test', () => {
  it('renders component without errors', () => {
    render(<RiskFactorsExplanation />);
    expect(true).toBe(true);
  });
});
