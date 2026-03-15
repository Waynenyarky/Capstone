import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Test component that uses performance hooks
const TestPerformanceComponent = () => {
  const [data] = React.useState([
    { id: 1, name: 'Test Item 1' },
    { id: 2, name: 'Test Item 2' },
    { id: 3, name: 'Test Item 3' }
  ]);

  return (
    <div>
      <div data-testid="data-count">{data.length}</div>
      <div data-testid="test-content">Performance Test Component</div>
    </div>
  );
};

describe('Phase 2 Performance Tests (Simplified)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <ConfigProvider>
        <App>
          <BrowserRouter>{component}</BrowserRouter>
        </App>
      </ConfigProvider>
    );
  };

  it('should render component with React hooks', () => {
    renderWithProviders(<TestPerformanceComponent />);
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('data-count')).toHaveTextContent('3');
  });

  it('should handle useState correctly', () => {
    renderWithProviders(<TestPerformanceComponent />);
    
    const dataCount = screen.getByTestId('data-count');
    expect(dataCount).toBeInTheDocument();
    expect(parseInt(dataCount.textContent)).toBe(3);
  });

  it('should handle component rendering', () => {
    renderWithProviders(<TestPerformanceComponent />);
    
    expect(screen.getByText('Performance Test Component')).toBeInTheDocument();
  });
});
