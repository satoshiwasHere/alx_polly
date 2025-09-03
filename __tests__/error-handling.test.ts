/**
 * Tests for error handling utilities
 */

import {
  parseSupabaseAuthError,
  parseApiError,
  createFormError,
  handleFormError,
  formatErrorMessage,
  isRetryableError,
  getUserFriendlyMessage,
  logError,
  withRetry,
  FormError,
  RetryConfig,
} from '@/lib/error-handling';

describe('Error Handling Utilities', () => {
  describe('parseSupabaseAuthError', () => {
    it('should handle already registered error', () => {
      const error = { message: 'User already registered' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('This email is already registered. Please sign in instead.');
    });

    it('should handle invalid email error', () => {
      const error = { message: 'Invalid email' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Please enter a valid email address.');
    });

    it('should handle password length error', () => {
      const error = { message: 'Password should be at least 6 characters' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Password must be at least 6 characters long.');
    });

    it('should handle email validation error', () => {
      const error = { message: 'Unable to validate email address' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Unable to validate email address. Please check your email and try again.');
    });

    it('should handle signup disabled error', () => {
      const error = { message: 'Signup is disabled' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Account creation is currently disabled. Please contact support.');
    });

    it('should handle rate limit error', () => {
      const error = { message: 'rate limit exceeded' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Too many attempts. Please wait a moment and try again.');
    });

    it('should handle invalid login credentials', () => {
      const error = { message: 'Invalid login credentials' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Invalid email or password. Please check your credentials and try again.');
    });

    it('should handle email not confirmed error', () => {
      const error = { message: 'Email not confirmed' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Please check your email and click the confirmation link before signing in.');
    });

    it('should handle user not found error', () => {
      const error = { message: 'User not found' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('No account found with this email address. Please sign up first.');
    });

    it('should return original message for unknown errors', () => {
      const error = { message: 'Unknown error occurred' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Unknown error occurred');
    });

    it('should handle error with error_description', () => {
      const error = { error_description: 'Custom error description' };
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('Custom error description');
    });

    it('should handle error without message or error_description', () => {
      const error = {};
      const result = parseSupabaseAuthError(error);
      expect(result).toBe('An error occurred');
    });
  });

  describe('parseApiError', () => {
    it('should handle 400 Bad Request', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Bad request' }
        }
      };
      const result = parseApiError(error);
      expect(result.message).toBe('Invalid request. Please check your input.');
      expect(result.type).toBe('api');
    });

    it('should handle 401 Unauthorized', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      const result = parseApiError(error);
      expect(result.message).toBe('Authentication required. Please sign in.');
      expect(result.type).toBe('api');
    });

    it('should handle 403 Forbidden', () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        }
      };
      const result = parseApiError(error);
      expect(result.message).toBe("You don't have permission to perform this action.");
      expect(result.type).toBe('api');
    });

    it('should handle 404 Not Found', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' }
        }
      };
      const result = parseApiError(error);
      expect(result.message).toBe('The requested resource was not found.');
      expect(result.type).toBe('api');
    });

    it('should handle 409 Conflict', () => {
      const error = {
        response: {
          status: 409,
          data: { message: 'Conflict' }
        }
      };
      const result = parseApiError(error);
      expect(result.message).toBe('Conflict occurred. The resource may already exist.');
      expect(result.type).toBe('api');
    });

    it('should handle 422 Unprocessable Entity', () => {
      const error = {
        response: {
          status: 422,
          data: { message: 'Validation failed' }
        }
      };
      const result = parseApiError(error);
      expect(result.message).toBe('Validation failed');
      expect(result.type).toBe('validation');
    });

    it('should handle 429 Too Many Requests', () => {
      const error = {
        response: {
          status: 429,
          data: { message: 'Rate limited' }
        }
      };
      const result = parseApiError(error);
      expect(result.message).toBe('Too many requests. Please wait a moment and try again.');
      expect(result.type).toBe('api');
    });

    it('should handle 500 Internal Server Error', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      const result = parseApiError(error);
      expect(result.message).toBe('Server error occurred. Please try again later.');
      expect(result.type).toBe('api');
    });

    it('should handle network errors', () => {
      const error = { request: {} };
      const result = parseApiError(error);
      expect(result.message).toBe('Network error. Please check your connection and try again.');
      expect(result.type).toBe('network');
    });

    it('should handle other errors', () => {
      const error = { message: 'Custom error' };
      const result = parseApiError(error);
      expect(result.message).toBe('Custom error');
      expect(result.type).toBe('general');
    });

    it('should handle errors without message', () => {
      const error = {};
      const result = parseApiError(error);
      expect(result.message).toBe('An unexpected error occurred.');
      expect(result.type).toBe('general');
    });
  });

  describe('createFormError', () => {
    it('should create a general error by default', () => {
      const error = createFormError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.type).toBe('general');
      expect(error.field).toBeUndefined();
    });

    it('should create a validation error with field', () => {
      const error = createFormError('Field is required', 'validation', 'email');
      expect(error.message).toBe('Field is required');
      expect(error.type).toBe('validation');
      expect(error.field).toBe('email');
    });

    it('should create an API error', () => {
      const error = createFormError('API error', 'api');
      expect(error.message).toBe('API error');
      expect(error.type).toBe('api');
    });
  });

  describe('handleFormError', () => {
    it('should handle validation errors with field', () => {
      const error = {
        type: 'validation',
        field: 'email',
        message: 'Email is required'
      };
      const result = handleFormError(error);
      expect(result.field).toBe('email');
      expect(result.message).toBe('Email is required');
      expect(result.type).toBe('validation');
    });

    it('should handle Supabase auth errors', () => {
      const error = { message: 'User already registered' };
      const result = handleFormError(error);
      expect(result.message).toBe('This email is already registered. Please sign in instead.');
      expect(result.type).toBe('api');
    });

    it('should handle general API errors', () => {
      const error = { response: { status: 500 } };
      const result = handleFormError(error);
      expect(result.message).toBe('Server error occurred. Please try again later.');
      expect(result.type).toBe('api');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error with field', () => {
      const error: FormError = {
        field: 'email',
        message: 'Email is required',
        type: 'validation'
      };
      const result = formatErrorMessage(error);
      expect(result).toBe('email: Email is required');
    });

    it('should format error without field', () => {
      const error: FormError = {
        message: 'General error',
        type: 'general'
      };
      const result = formatErrorMessage(error);
      expect(result).toBe('General error');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error: FormError = {
        message: 'Network error',
        type: 'network'
      };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors', () => {
      const error: FormError = {
        message: 'Server error occurred',
        type: 'api'
      };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for validation errors', () => {
      const error: FormError = {
        message: 'Validation failed',
        type: 'validation'
      };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for general errors', () => {
      const error: FormError = {
        message: 'General error',
        type: 'general'
      };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return string errors as-is', () => {
      const result = getUserFriendlyMessage('String error');
      expect(result).toBe('String error');
    });

    it('should return error.message', () => {
      const error = { message: 'Error message' };
      const result = getUserFriendlyMessage(error);
      expect(result).toBe('Error message');
    });

    it('should return error.error_description', () => {
      const error = { error_description: 'Error description' };
      const result = getUserFriendlyMessage(error);
      expect(result).toBe('Error description');
    });

    it('should return default message for unknown errors', () => {
      const error = {};
      const result = getUserFriendlyMessage(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('logError', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logError('Test error', 'Test context');
      expect(consoleSpy).toHaveBeenCalledWith('[Test context]:', 'Test error');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logError('Test error', 'Test context');
      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValue('success');

      const result = await withRetry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const fn = jest.fn().mockRejectedValue({ response: { status: 400 } });
      
      await expect(withRetry(fn)).rejects.toEqual({ response: { status: 400 } });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const fn = jest.fn().mockRejectedValue({ response: { status: 500 } });
      
      await expect(withRetry(fn, { maxAttempts: 2, delay: 10, backoffMultiplier: 1 }))
        .rejects.toEqual({ response: { status: 500 } });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use custom retry config', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValue('success');

      const config: RetryConfig = {
        maxAttempts: 2,
        delay: 10,
        backoffMultiplier: 1
      };

      const result = await withRetry(fn, config);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

