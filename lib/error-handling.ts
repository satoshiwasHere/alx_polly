/**
 * Error handling utilities for form validation and API errors
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface FormError {
  field?: string;
  message: string;
  type: 'validation' | 'api' | 'network' | 'general';
}

/**
 * Parse Supabase authentication errors
 */
export const parseSupabaseAuthError = (error: any): string => {
  const message = error.message || error.error_description || "An error occurred";
  
  // Handle specific Supabase error cases
  if (message.includes("already registered") || message.includes("User already registered")) {
    return "This email is already registered. Please sign in instead.";
  }
  
  if (message.includes("Invalid email")) {
    return "Please enter a valid email address.";
  }
  
  if (message.includes("Password should be at least")) {
    return "Password must be at least 6 characters long.";
  }
  
  if (message.includes("Unable to validate email address")) {
    return "Unable to validate email address. Please check your email and try again.";
  }
  
  if (message.includes("Signup is disabled")) {
    return "Account creation is currently disabled. Please contact support.";
  }
  
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  
  if (message.includes("Invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  
  if (message.includes("Email not confirmed")) {
    return "Please check your email and click the confirmation link before signing in.";
  }
  
  if (message.includes("User not found")) {
    return "No account found with this email address. Please sign up first.";
  }
  
  return message;
};

/**
 * Parse general API errors
 */
export const parseApiError = (error: any): FormError => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error || "Server error occurred";
    
    switch (status) {
      case 400:
        return { message: "Invalid request. Please check your input.", type: 'api' };
      case 401:
        return { message: "Authentication required. Please sign in.", type: 'api' };
      case 403:
        return { message: "You don't have permission to perform this action.", type: 'api' };
      case 404:
        return { message: "The requested resource was not found.", type: 'api' };
      case 409:
        return { message: "Conflict occurred. The resource may already exist.", type: 'api' };
      case 422:
        return { message, type: 'validation' };
      case 429:
        return { message: "Too many requests. Please wait a moment and try again.", type: 'api' };
      case 500:
        return { message: "Server error occurred. Please try again later.", type: 'api' };
      default:
        return { message, type: 'api' };
    }
  } else if (error.request) {
    // Network error
    return { 
      message: "Network error. Please check your connection and try again.", 
      type: 'network' 
    };
  } else {
    // Other error
    return { 
      message: error.message || "An unexpected error occurred.", 
      type: 'general' 
    };
  }
};

/**
 * Create a standardized error object
 */
export const createFormError = (
  message: string, 
  type: FormError['type'] = 'general',
  field?: string
): FormError => {
  return { message, type, field };
};

/**
 * Handle form submission errors
 */
export const handleFormError = (error: any, fieldValidators?: Record<string, any>): FormError => {
  // Check if it's a validation error
  if (error.type === 'validation' && error.field && fieldValidators) {
    return {
      field: error.field,
      message: error.message,
      type: 'validation'
    };
  }
  
  // Check if it's a Supabase auth error
  if (error.message && (
    error.message.includes('already registered') ||
    error.message.includes('Invalid email') ||
    error.message.includes('Password should be at least') ||
    error.message.includes('Unable to validate email address') ||
    error.message.includes('Signup is disabled') ||
    error.message.includes('rate limit') ||
    error.message.includes('Invalid login credentials') ||
    error.message.includes('Email not confirmed') ||
    error.message.includes('User not found')
  )) {
    return {
      message: parseSupabaseAuthError(error),
      type: 'api'
    };
  }
  
  // Parse as general API error
  return parseApiError(error);
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error: FormError): string => {
  if (error.field) {
    return `${error.field}: ${error.message}`;
  }
  return error.message;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: FormError): boolean => {
  return error.type === 'network' || 
         (error.type === 'api' && error.message.includes('Server error'));
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (error.error_description) {
    return error.error_description;
  }
  
  return "An unexpected error occurred. Please try again.";
};

/**
 * Error boundary helper for React components
 */
export const createErrorBoundaryState = (error: Error) => {
  return {
    hasError: true,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  };
};

/**
 * Log error for debugging (in development)
 */
export const logError = (error: any, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'Form Error'}]:`, error);
  }
};

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
}

export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2
};

/**
 * Execute function with retry logic
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === config.maxAttempts) {
        break;
      }
      
      const formError = parseApiError(error);
      if (!isRetryableError(formError)) {
        break;
      }
      
      const delay = config.delay * Math.pow(config.backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

