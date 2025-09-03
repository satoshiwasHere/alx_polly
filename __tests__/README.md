# Test Suite Documentation

This directory contains a comprehensive test suite for form validation and error handling in the ALx Polly polling application.

## Test Structure

```
__tests__/
├── components/           # Component-specific tests
│   ├── SignUpForm.test.tsx
│   ├── SignInForm.test.tsx
│   ├── NewPollForm.test.tsx
│   ├── EnhancedNewPollForm.test.tsx
│   ├── ErrorBoundary.test.tsx
│   └── FormErrorBoundary.test.tsx
├── integration/          # Integration tests
│   └── form-submission.test.tsx
├── utils/               # Test utilities and helpers
│   └── test-utils.tsx
├── validation.test.ts   # Validation utility tests
├── error-handling.test.ts # Error handling utility tests
└── README.md           # This file
```

## Test Categories

### 1. Unit Tests

#### Validation Utilities (`validation.test.ts`)
- Tests for all validation functions
- Email validation (format, required, edge cases)
- Password validation (strength requirements, complexity)
- Name validation (length, characters, required)
- Poll validation (title, description, options)
- Form validation helpers

#### Error Handling Utilities (`error-handling.test.ts`)
- Supabase error parsing
- API error handling
- Network error handling
- Retry logic
- Error formatting and user-friendly messages

### 2. Component Tests

#### SignUp Form (`SignUpForm.test.tsx`)
- Form rendering and accessibility
- Field validation (name, email, password)
- Form submission flow
- Error handling and display
- Success states and redirects
- Keyboard navigation
- Loading states

#### SignIn Form (`SignInForm.test.tsx`)
- Form rendering and accessibility
- Form submission flow
- Error handling
- Navigation between forms
- State management

#### Poll Creation Forms
- **Basic Form** (`NewPollForm.test.tsx`): Tests for the current implementation
- **Enhanced Form** (`EnhancedNewPollForm.test.tsx`): Tests for the improved form with validation

#### Error Boundaries
- **ErrorBoundary** (`ErrorBoundary.test.tsx`): General error boundary component
- **FormErrorBoundary** (`FormErrorBoundary.test.tsx`): Form-specific error boundary

### 3. Integration Tests

#### Form Submission Flow (`form-submission.test.tsx`)
- Complete signup flow with success
- Signup with email confirmation
- Signup with API errors
- Network error handling
- Signin flow integration
- Poll creation flow
- Cross-form navigation
- Error boundary integration

## Test Utilities

### `test-utils.tsx`
Provides helper functions and utilities for testing:

- **Custom render function** with providers
- **Test data factories** for creating valid/invalid form data
- **Mock API responses** for different scenarios
- **Form interaction helpers** for filling out forms
- **Error simulation helpers** for testing error scenarios
- **Wait helpers** for async operations
- **Accessibility test helpers**
- **Mock cleanup helpers**

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
npm test -- SignUpForm.test.tsx
npm test -- validation.test.ts
npm test -- integration
```

## Test Coverage

The test suite covers:

- ✅ **Form Validation**: All validation rules and error messages
- ✅ **Error Handling**: API errors, network errors, validation errors
- ✅ **User Interactions**: Form submission, keyboard navigation, focus management
- ✅ **Accessibility**: ARIA attributes, screen reader support, keyboard navigation
- ✅ **Loading States**: Form submission loading indicators
- ✅ **Success States**: Success messages and redirects
- ✅ **Error Boundaries**: Error catching and recovery
- ✅ **Integration**: Complete user flows across multiple forms

## Test Data

### Valid Test Data
```typescript
// User data
{
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123!'
}

// Poll data
{
  title: 'What should we build next?',
  description: 'Help us decide our next project',
  options: ['Mobile App', 'Web Dashboard', 'API Service']
}
```

### Invalid Test Data
```typescript
// Invalid user data
{
  name: '',
  email: 'invalid-email',
  password: 'weak'
}

// Invalid poll data
{
  title: '',
  description: 'A'.repeat(1001),
  options: ['Only One Option']
}
```

## Mocking Strategy

### Supabase Client
- Mocked authentication methods
- Mocked database operations
- Configurable success/error responses

### Next.js Router
- Mocked navigation functions
- Configurable redirect behavior

### WebSocket
- Mocked WebSocket connections
- Simulated connection states

## Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Management
- Clear mocks between tests
- Use realistic mock data
- Test both success and error scenarios

### 3. Accessibility Testing
- Test ARIA attributes
- Verify keyboard navigation
- Check screen reader compatibility

### 4. Error Testing
- Test all error scenarios
- Verify error messages are user-friendly
- Test error recovery mechanisms

### 5. Integration Testing
- Test complete user flows
- Verify cross-component interactions
- Test error boundary integration

## Common Test Patterns

### Form Validation Test
```typescript
it('should validate required fields', async () => {
  const user = userEvent.setup();
  render(<Component />);
  
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(screen.getByText('Field is required')).toBeInTheDocument();
  });
});
```

### API Error Test
```typescript
it('should handle API errors', async () => {
  const user = userEvent.setup();
  mockApi.mockResolvedValue({ error: { message: 'API Error' } });
  
  render(<Component />);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/api error/i)).toBeInTheDocument();
  });
});
```

### Accessibility Test
```typescript
it('should have proper ARIA attributes', () => {
  render(<Component />);
  
  const input = screen.getByLabelText(/field/i);
  expect(input).toHaveAttribute('aria-required', 'true');
  expect(input).toHaveAttribute('aria-invalid', 'false');
});
```

## Troubleshooting

### Common Issues

1. **Async Operations**: Use `waitFor` for async operations
2. **Mock Cleanup**: Clear mocks between tests
3. **Environment Variables**: Mock environment variables when needed
4. **Timers**: Use fake timers for time-dependent tests

### Debug Tips

1. Use `screen.debug()` to see current DOM state
2. Use `screen.logTestingPlaygroundURL()` for element queries
3. Check console for mock warnings
4. Verify mock implementations are correct

## Contributing

When adding new tests:

1. Follow existing patterns and structure
2. Add tests for both success and error scenarios
3. Include accessibility tests
4. Update this documentation
5. Ensure tests are deterministic and reliable

