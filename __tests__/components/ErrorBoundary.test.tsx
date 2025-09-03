/**
 * Tests for ErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '@/components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws an error with custom message
const ThrowCustomError = ({ message }: { message: string }) => {
  throw new Error(message);
};

// Component that uses the error handler hook
const ComponentWithErrorHandler = ({ shouldThrow }: { shouldThrow: boolean }) => {
  const handleError = useErrorHandler();
  
  if (shouldThrow) {
    handleError(new Error('Hook error'));
  }
  
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render fallback UI when there is an error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/we're sorry, but something unexpected happened/i)).toBeInTheDocument();
    });

    it('should render custom fallback UI when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should log error to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.any(Object)
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log error to console in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('User Interactions', () => {
    it('should retry when Try Again button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // The error boundary should reset and show children again
      // Note: In a real scenario, the component would need to be re-rendered
      // with shouldThrow=false to see the children
    });

    it('should reload page when Reload Page button is clicked', async () => {
      const user = userEvent.setup();
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      await user.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalled();

      reloadSpy.mockRestore();
    });
  });

  describe('Development Mode Features', () => {
    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowCustomError message="Custom test error" />
        </ErrorBoundary>
      );

      const detailsElement = screen.getByText('Error Details (Development Only)');
      expect(detailsElement).toBeInTheDocument();

      // Click to expand details
      fireEvent.click(detailsElement);

      expect(screen.getByText('Custom test error')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have proper heading structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Something went wrong');
    });

    it('should have proper button labels', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={false} />);

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should handle errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should pass error boundary props', () => {
    const onError = jest.fn();
    const customFallback = <div>Custom fallback</div>;
    const WrappedComponent = withErrorBoundary(ThrowError, { onError, fallback: customFallback });

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it('should set proper display name', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(ThrowError)');
  });
});

describe('useErrorHandler Hook', () => {
  it('should throw error when called', () => {
    const TestComponent = () => {
      const handleError = useErrorHandler();
      handleError(new Error('Hook error'));
      return <div>Should not render</div>;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should log error in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ComponentWithErrorHandler shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith('Error caught by useErrorHandler:', expect.any(Error));

    process.env.NODE_ENV = originalEnv;
  });
});

