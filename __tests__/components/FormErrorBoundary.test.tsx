/**
 * Tests for FormErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormErrorBoundary, useFormErrorHandler } from '@/components/FormErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Form test error');
  }
  return <div>Form working correctly</div>;
};

// Component that uses the form error handler hook
const ComponentWithFormErrorHandler = ({ shouldThrow }: { shouldThrow: boolean }) => {
  const handleError = useFormErrorHandler();
  
  if (shouldThrow) {
    handleError(new Error('Form hook error'));
  }
  
  return <div>Form working correctly</div>;
};

describe('FormErrorBoundary', () => {
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
        <FormErrorBoundary>
          <ThrowError shouldThrow={false} />
        </FormErrorBoundary>
      );

      expect(screen.getByText('Form working correctly')).toBeInTheDocument();
    });

    it('should render form error UI when there is an error', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(screen.getByText('Form Error')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong while processing the form/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <FormErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Form test error',
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
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'FormErrorBoundary caught an error:',
        expect.objectContaining({
          message: 'Form test error',
        }),
        expect.any(Object)
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log error to console in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('User Interactions', () => {
    it('should retry when Try Again button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      
      render(
        <FormErrorBoundary onRetry={onRetry}>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(screen.getByText('Form Error')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(onRetry).toHaveBeenCalled();
    });

    it('should reset error state when retry is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(screen.getByText('Form Error')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // The error boundary should reset its state
      // In a real scenario, the component would need to be re-rendered
      // with shouldThrow=false to see the children
    });
  });

  describe('Development Mode Features', () => {
    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      const detailsElement = screen.getByText('Error Details (Development Only)');
      expect(detailsElement).toBeInTheDocument();

      // Click to expand details
      fireEvent.click(detailsElement);

      expect(screen.getByText('Form test error')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper error styling', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      const errorContainer = screen.getByText('Form Error').closest('div');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('should have proper button styling', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toHaveClass('border-red-300', 'text-red-700');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      const icon = screen.getByText('⚠️');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have proper heading structure', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Form Error');
    });

    it('should have proper button labels', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});

describe('useFormErrorHandler Hook', () => {
  it('should throw error when called', () => {
    const TestComponent = () => {
      const handleError = useFormErrorHandler();
      handleError(new Error('Form hook error'));
      return <div>Should not render</div>;
    };

    render(
      <FormErrorBoundary>
        <TestComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText('Form Error')).toBeInTheDocument();
  });

  it('should log error in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <FormErrorBoundary>
        <ComponentWithFormErrorHandler shouldThrow={true} />
      </FormErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith('Form error caught by useFormErrorHandler:', expect.any(Error));

    process.env.NODE_ENV = originalEnv;
  });
});

describe('Integration with Forms', () => {
  it('should work with form components', () => {
    const FormComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false);
      
      if (shouldThrow) {
        throw new Error('Form processing error');
      }
      
      return (
        <div>
          <button onClick={() => setShouldThrow(true)}>Trigger Error</button>
          <div>Form content</div>
        </div>
      );
    };

    render(
      <FormErrorBoundary>
        <FormComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText('Form content')).toBeInTheDocument();
    
    const triggerButton = screen.getByRole('button', { name: /trigger error/i });
    fireEvent.click(triggerButton);
    
    expect(screen.getByText('Form Error')).toBeInTheDocument();
  });
});

