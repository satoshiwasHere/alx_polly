/**
 * Tests for SignUp form component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SignUpPage from '@/app/(auth)/signup/page';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/lib/supabase/client');

const mockPush = jest.fn();
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
  },
};

describe('SignUp Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<SignUpPage />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render form with proper accessibility attributes', () => {
      render(<SignUpPage />);
      
      const form = screen.getByRole('main');
      expect(form).toHaveAttribute('aria-labelledby', 'signup-title');
      
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(nameInput).toHaveAttribute('autocomplete', 'name');
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    });

    it('should show password requirements help text', () => {
      render(<SignUpPage />);
      
      const helpText = screen.getByText(/password must be at least 8 characters/i);
      expect(helpText).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should validate password strength', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      // Test weak password
      await user.type(passwordInput, 'weak');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
      
      // Test password without uppercase
      await user.clear(passwordInput);
      await user.type(passwordInput, 'password123!');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
      });
      
      // Test password without lowercase
      await user.clear(passwordInput);
      await user.type(passwordInput, 'PASSWORD123!');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one lowercase letter')).toBeInTheDocument();
      });
      
      // Test password without number
      await user.clear(passwordInput);
      await user.type(passwordInput, 'Password!');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
      });
      
      // Test password without special character
      await user.clear(passwordInput);
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one special character (@$!%*?&)')).toBeInTheDocument();
      });
    });

    it('should validate name length', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'A');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters long')).toBeInTheDocument();
      });
    });

    it('should clear field errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      // Trigger validation error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      // Start typing to clear error
      await user.type(nameInput, 'John');
      
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });

    it('should show success message for valid password', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(passwordInput, 'Password123!');
      
      await waitFor(() => {
        expect(screen.getByText('✓ Password meets all requirements')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { email_confirmed_at: '2023-01-01' } },
        error: null,
      });
      
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);
      
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
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);
      
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle successful signup with email confirmation', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { email_confirmed_at: null } },
        error: null,
      });
      
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/account created! please check your email/i)).toBeInTheDocument();
      });
    });

    it('should handle successful signup without email confirmation', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { email_confirmed_at: '2023-01-01' } },
        error: null,
      });
      
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/account created successfully! redirecting/i)).toBeInTheDocument();
      });
      
      // Should redirect after delay
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/polls');
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase auth errors', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });
      
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockRejectedValue(new Error('Network error'));
      
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });

    it('should clear general errors when user starts typing', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });
      
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
      });
      
      // Start typing to clear error
      await user.type(nameInput, 'x');
      
      await waitFor(() => {
        expect(screen.queryByText(/this email is already registered/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate between fields with Enter key', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(nameInput, 'John');
      await user.keyboard('{Enter}');
      
      expect(emailInput).toHaveFocus();
      
      await user.type(emailInput, 'john@example.com');
      await user.keyboard('{Enter}');
      
      expect(passwordInput).toHaveFocus();
    });

    it('should clear errors with Escape key', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for error messages', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Name is required');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper ARIA attributes for success messages', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { email_confirmed_at: null } },
        error: null,
      });
      
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);
      
      await waitFor(() => {
        const successMessage = screen.getByText(/account created! please check your email/i);
        expect(successMessage.closest('div')).toHaveAttribute('role', 'status');
        expect(successMessage.closest('div')).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper ARIA attributes for form fields with errors', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      });
    });
  });
});

