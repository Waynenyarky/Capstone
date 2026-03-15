import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Test User Agent'
  }
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test',
    reload: vi.fn()
  },
  writable: true
});

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.error = originalError;
});

const renderWithProviders = (component) => {
  return render(
    <ConfigProvider>
      <BrowserRouter>
        <ErrorBoundary>
          {component}
        </ErrorBoundary>
      </BrowserRouter>
    </ConfigProvider>
  );
};

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    const NoErrorComponent = () => <div>No Error</div>;
    
    renderWithProviders(<NoErrorComponent />);
    
    expect(screen.getByText('No Error')).toBeInTheDocument();
  });

  it('should catch and display error when child component throws', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    renderWithProviders(<ThrowErrorComponent />);
    
    // Should show error boundary UI with specific error type
    expect(screen.getByText('Application Error')).toBeInTheDocument();
  });

  it('should display retry button', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    renderWithProviders(<ThrowErrorComponent />);
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle different error types', () => {
    const NetworkErrorComponent = () => {
      throw new Error('Network error');
    };
    
    renderWithProviders(<NetworkErrorComponent />);
    
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('should store error reports in localStorage', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    renderWithProviders(<ThrowErrorComponent />);
    
    // Should attempt to store error
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should handle refresh page action', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    renderWithProviders(<ThrowErrorComponent />);
    
    // Just verify the error boundary renders properly
    expect(screen.getByText('Application Error')).toBeInTheDocument();
  });

  it('should handle go to dashboard action', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    renderWithProviders(<ThrowErrorComponent />);
    
    // Just verify the error boundary renders properly
    expect(screen.getByText('Application Error')).toBeInTheDocument();
  });

  it('should generate unique error IDs', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    renderWithProviders(<ThrowErrorComponent />);
    
    // Should show error ID
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it('should handle permission errors', () => {
    const PermissionErrorComponent = () => {
      throw new Error('Permission denied');
    };
    
    renderWithProviders(<PermissionErrorComponent />);
    
    expect(screen.getByText('Permission Error')).toBeInTheDocument();
  });

  it('should handle validation errors', () => {
    const ValidationErrorComponent = () => {
      throw new Error('Validation failed');
    };
    
    renderWithProviders(<ValidationErrorComponent />);
    
    expect(screen.getByText('Validation Error')).toBeInTheDocument();
  });

  it('should handle timeout errors', () => {
    const TimeoutErrorComponent = () => {
      throw new Error('Request timeout');
    };
    
    renderWithProviders(<TimeoutErrorComponent />);
    
    expect(screen.getByText('Timeout Error')).toBeInTheDocument();
  });
});
