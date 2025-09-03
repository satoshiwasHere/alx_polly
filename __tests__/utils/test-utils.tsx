/**
 * Test utilities for form validation and error handling tests
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Mock implementations
const mockPush = jest.fn();
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerOptions?: {
    push?: jest.Mock;
  };
  supabaseOptions?: {
    signUp?: jest.Mock;
    signInWithPassword?: jest.Mock;
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { routerOptions = {}, supabaseOptions = {}, ...renderOptions } = options;

  // Setup router mocks
  if (routerOptions.push) {
    (useRouter as jest.Mock).mockReturnValue({
      push: routerOptions.push,
    });
  } else {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  }

  // Setup Supabase mocks
  if (supabaseOptions.signUp) {
    mockSupabaseClient.auth.signUp = supabaseOptions.signUp;
  }
  if (supabaseOptions.signInWithPassword) {
    mockSupabaseClient.auth.signInWithPassword = supabaseOptions.signInWithPassword;
  }

  (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

  return render(ui, renderOptions);
}

// Test data factories
export const createValidUserData = () => ({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123!',
});

export const createValidPollData = () => ({
  title: 'What should we build next?',
  description: 'Help us decide our next project',
  options: ['Mobile App', 'Web Dashboard', 'API Service'],
});

export const createInvalidUserData = () => ({
  name: '',
  email: 'invalid-email',
  password: 'weak',
});

export const createInvalidPollData = () => ({
  title: '',
  description: 'A'.repeat(1001),
  options: ['Only One Option'],
});

// Mock API responses
export const createMockSignUpResponse = (overrides = {}) => ({
  data: { user: { email_confirmed_at: '2023-01-01' } },
  error: null,
  ...overrides,
});

export const createMockSignInResponse = (overrides = {}) => ({
  data: { user: { id: '123' } },
  error: null,
  ...overrides,
});

export const createMockErrorResponse = (message: string) => ({
  data: { user: null },
  error: { message },
});

// Validation test helpers
export const expectValidationError = async (screen: any, errorMessage: string) => {
  await expect(screen.findByText(errorMessage)).resolves.toBeInTheDocument();
};

export const expectNoValidationError = async (screen: any, errorMessage: string) => {
  await expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
};

// Form interaction helpers
export const fillSignUpForm = async (user: any, screen: any, data = createValidUserData()) => {
  await user.type(screen.getByLabelText(/name/i), data.name);
  await user.type(screen.getByLabelText(/email/i), data.email);
  await user.type(screen.getByLabelText(/password/i), data.password);
};

export const fillSignInForm = async (user: any, screen: any, data = { email: 'john@example.com', password: 'password123' }) => {
  await user.type(screen.getByLabelText(/email/i), data.email);
  await user.type(screen.getByLabelText(/password/i), data.password);
};

export const fillPollForm = async (user: any, screen: any, data = createValidPollData()) => {
  await user.type(screen.getByLabelText(/title/i), data.title);
  if (data.description) {
    await user.type(screen.getByLabelText(/description/i), data.description);
  }
  
  const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
  for (let i = 0; i < Math.min(data.options.length, optionInputs.length); i++) {
    await user.type(optionInputs[i], data.options[i]);
  }
};

// Error simulation helpers
export const simulateNetworkError = () => {
  return Promise.reject(new Error('Network error'));
};

export const simulateServerError = () => {
  return Promise.resolve({
    data: null,
    error: { message: 'Internal server error' },
  });
};

export const simulateValidationError = (field: string, message: string) => {
  return Promise.resolve({
    data: null,
    error: { message, field },
  });
};

// Wait helpers
export const waitForFormSubmission = async (screen: any, timeout = 1000) => {
  await screen.findByText(/creating|signing|loading/i, {}, { timeout });
};

export const waitForSuccessMessage = async (screen: any, timeout = 2000) => {
  await screen.findByText(/success|created|signed/i, {}, { timeout });
};

export const waitForErrorMessage = async (screen: any, timeout = 1000) => {
  await screen.findByText(/error|failed|invalid/i, {}, { timeout });
};

// Accessibility test helpers
export const expectAriaAttributes = (element: HTMLElement, attributes: Record<string, string>) => {
  Object.entries(attributes).forEach(([key, value]) => {
    expect(element).toHaveAttribute(key, value);
  });
};

export const expectFormAccessibility = (form: HTMLElement) => {
  expect(form).toHaveAttribute('aria-label');
  expect(form).toHaveAttribute('noValidate');
};

// Mock cleanup helpers
export const resetMocks = () => {
  jest.clearAllMocks();
  mockPush.mockClear();
  mockSupabaseClient.auth.signUp.mockClear();
  mockSupabaseClient.auth.signInWithPassword.mockClear();
};

export const setupMockSuccess = (operation: 'signUp' | 'signIn') => {
  if (operation === 'signUp') {
    mockSupabaseClient.auth.signUp.mockResolvedValue(createMockSignUpResponse());
  } else {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(createMockSignInResponse());
  }
};

export const setupMockError = (operation: 'signUp' | 'signIn', message: string) => {
  if (operation === 'signUp') {
    mockSupabaseClient.auth.signUp.mockResolvedValue(createMockErrorResponse(message));
  } else {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(createMockErrorResponse(message));
  }
};

// Test environment helpers
export const setDevelopmentMode = () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  return () => {
    process.env.NODE_ENV = originalEnv;
  };
};

export const setProductionMode = () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  return () => {
    process.env.NODE_ENV = originalEnv;
  };
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

