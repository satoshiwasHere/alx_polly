"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('FormErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 text-red-500" aria-hidden="true">⚠️</div>
            <h3 className="text-sm font-medium text-red-800">
              Form Error
            </h3>
          </div>
          
          <p className="text-sm text-red-700 mb-4">
            Something went wrong while processing the form. Please try again.
          </p>
          
          <Button 
            onClick={this.handleRetry} 
            variant="outline" 
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-red-600 font-medium">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                <div><strong>Error:</strong> {this.state.error.message}</div>
                {this.state.error.stack && (
                  <div className="mt-1">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap break-words text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for form error handling
export function useFormErrorHandler() {
  return (error: Error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Form error caught by useFormErrorHandler:', error);
    }
    
    // Re-throw the error to trigger form error boundary
    throw error;
  };
}

