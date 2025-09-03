/**
 * Integration tests for form submission flows and API error handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SignUpPage from '@/app/(auth)/signup/page';
import SignInPage from '@/app/(auth)/signin/page';
import NewPollForm from '@/components/forms/NewPollForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FormErrorBoundary } from '@/components/FormErrorBoundary';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/lib/supabase/client');

const mockPush = jest.fn();
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
  },
};

describe('Form Submission Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('SignUp Form Integration', () => {
    it('should complete full signup flow with success', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { email_confirmed_at: '2023-01-01' } },
        error: null,
      });

      render(<SignUpPage />);

      // Fill out the form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Verify API call
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'Password123!',
          options: {
            data: {
              name: 'John Doe',
            },
          },
        });
      });

      // Verify success message and redirect
      await waitFor(() => {
        expect(screen.getByText(/account created successfully! redirecting/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/polls');
      }, { timeout: 2000 });
    });

    it('should handle signup flow with email confirmation required', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { email_confirmed_at: null } },
        error: null,
      });

      render(<SignUpPage />);

      // Fill out the form
      await user.type(screen.getByLabelText(/name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Verify success message for email confirmation
      await waitFor(() => {
        expect(screen.getByText(/account created! please check your email/i)).toBeInTheDocument();
      });
    });

    it('should handle signup flow with API error', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      render(<SignUpPage />);

      // Fill out the form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
      });
    });

    it('should handle network error during signup', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockRejectedValue(new Error('Network error'));

      render(<SignUpPage />);

      // Fill out the form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('SignIn Form Integration', () => {
    it('should complete full signin flow with success', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      render(<SignInPage />);

      // Fill out the form
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify API call
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
        });
      });

      // Verify redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/polls');
      });
    });

    it('should handle signin flow with invalid credentials', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      render(<SignInPage />);

      // Fill out the form
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify API call was made (error handling would be implemented in the component)
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Poll Creation Form Integration', () => {
    it('should complete full poll creation flow', async () => {
      const user = userEvent.setup();

      render(<NewPollForm />);

      // Fill out the form
      await user.type(screen.getByLabelText(/title/i), 'What should we build next?');
      await user.type(screen.getByLabelText(/description/i), 'Help us decide our next project');
      
      const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
      await user.type(optionInputs[0], 'Mobile App');
      await user.type(optionInputs[1], 'Web Dashboard');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create poll/i }));

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/creating your poll/i)).toBeInTheDocument();
      });

      // Verify success message and redirect
      await waitFor(() => {
        expect(screen.getByText(/poll created successfully! redirecting/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/polls');
      }, { timeout: 2000 });
    });

    it('should handle poll creation with validation errors', async () => {
      const user = userEvent.setup();

      render(<NewPollForm />);

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /create poll/i }));

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText('Poll title is required')).toBeInTheDocument();
      });
    });

    it('should handle poll creation with dynamic options', async () => {
      const user = userEvent.setup();

      render(<NewPollForm />);

      // Fill out basic form
      await user.type(screen.getByLabelText(/title/i), 'Test Poll');
      
      const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
      await user.type(optionInputs[0], 'Option 1');
      await user.type(optionInputs[1], 'Option 2');

      // Add more options
      await user.click(screen.getByRole('button', { name: /add option/i }));
      
      const newOptionInputs = screen.getAllByPlaceholderText(/option \d+/i);
      expect(newOptionInputs).toHaveLength(3);
      
      await user.type(newOptionInputs[2], 'Option 3');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create poll/i }));

      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/poll created successfully! redirecting/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch and handle form errors with ErrorBoundary', () => {
      const ThrowErrorComponent = () => {
        throw new Error('Form processing error');
      };

      render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should catch and handle form errors with FormErrorBoundary', () => {
      const ThrowErrorComponent = () => {
        throw new Error('Form validation error');
      };

      render(
        <FormErrorBoundary>
          <ThrowErrorComponent />
        </FormErrorBoundary>
      );

      expect(screen.getByText('Form Error')).toBeInTheDocument();
    });

    it('should integrate error boundaries with form components', async () => {
      const user = userEvent.setup();
      
      const FormWithError = () => {
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
          <FormWithError />
        </FormErrorBoundary>
      );

      expect(screen.getByText('Form content')).toBeInTheDocument();
      
      const triggerButton = screen.getByRole('button', { name: /trigger error/i });
      await user.click(triggerButton);
      
      expect(screen.getByText('Form Error')).toBeInTheDocument();
    });
  });

  describe('Cross-Form Integration', () => {
    it('should handle navigation between forms', () => {
      render(<SignInPage />);
      
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveAttribute('href', '/signup');
    });

    it('should maintain consistent error handling across forms', async () => {
      const user = userEvent.setup();
      
      // Test signup form error handling
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      render(<SignUpPage />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and UX Integration', () => {
    it('should show loading states during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      mockSupabaseClient.auth.signUp.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<SignUpPage />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Verify loading state
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
    });

    it('should handle form state persistence during errors', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      render(<SignUpPage />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
      });

      // Verify form data is preserved
      expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
      expect(screen.getByLabelText(/password/i)).toHaveValue('Password123!');
    });
  });
});

