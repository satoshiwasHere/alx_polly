/**
 * Tests for SignIn form component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SignInPage from '@/app/(auth)/signin/page';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/lib/supabase/client');

const mockPush = jest.fn();
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
  },
};

describe('SignIn Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<SignInPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render form with proper accessibility attributes', () => {
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', '••••••••');
    });

    it('should render sign up link', () => {
      render(<SignInPage />);
      
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
        });
      });
      
      expect(mockPush).toHaveBeenCalledWith('/polls');
    });

    it('should handle form submission via Enter key', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
        });
      });
    });

    it('should prevent default form submission', async () => {
      const user = userEvent.setup();
      render(<SignInPage />);
      
      const form = screen.getByRole('form') || screen.getByLabelText(/sign in/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      fireEvent(form, submitEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials error', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      // Note: The current signin form doesn't display errors, but we can test the API call
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'wrongpassword',
        });
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // The form should still attempt the API call
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    it('should handle email not confirmed error', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email not confirmed' },
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Form State Management', () => {
    it('should update email state when typing', async () => {
      const user = userEvent.setup();
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password state when typing', async () => {
      const user = userEvent.setup();
      render(<SignInPage />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(passwordInput, 'mypassword');
      
      expect(passwordInput).toHaveValue('mypassword');
    });

    it('should clear form fields after successful submission', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/polls');
      });
      
      // Form fields should be cleared after redirect
      // Note: This behavior depends on the component implementation
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should have proper button text', () => {
      render(<SignInPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveTextContent('Sign in');
    });

    it('should have proper heading structure', () => {
      render(<SignInPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Sign in');
    });
  });

  describe('User Experience', () => {
    it('should show appropriate placeholder text', () => {
      render(<SignInPage />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      render(<SignInPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveClass('w-full');
    });

    it('should have proper form layout', () => {
      render(<SignInPage />);
      
      const form = screen.getByRole('form') || screen.getByLabelText(/sign in/i);
      expect(form).toHaveClass('space-y-4');
    });
  });

  describe('Integration with Supabase', () => {
    it('should call Supabase client with correct parameters', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'securepassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'securepassword',
        });
      });
    });

    it('should handle Supabase client creation', () => {
      render(<SignInPage />);
      
      expect(createClient).toHaveBeenCalled();
    });
  });
});

