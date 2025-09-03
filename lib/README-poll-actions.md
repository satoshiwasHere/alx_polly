# Poll Actions - Refactored Architecture

This document describes the refactored `poll-actions.ts` file that centralizes all poll-related operations with improved architecture and best practices.

## 🎯 Key Improvements

### 1. **Centralized Supabase Client Creation**
- `getSupabaseClient()` - Client-side operations
- `getSupabaseServerClient()` - Server-side operations  
- `getAuthenticatedClient()` - Client with user session
- `getAuthenticatedServerClient()` - Server client with user session

### 2. **Modular Poll Operations**
- `createPoll()` - Create new polls with validation
- `getPoll()` - Fetch single poll by ID
- `getPolls()` - Fetch polls with pagination
- `updatePoll()` - Update existing polls (owner only)
- `deletePoll()` - Delete polls (owner only)
- `voteOnPoll()` - Record votes on polls
- `getPollStats()` - Get poll statistics

### 3. **Abstracted User Authentication Logic**
- `isAuthenticated()` - Check authentication status
- `getCurrentUser()` - Get current user
- `requireAuth()` - Require authentication for operations
- `checkPollOwnership()` - Verify poll ownership

### 4. **Encapsulated Poll Input Validation**
- `validateCreatePollData()` - Validate poll creation data
- `validateUpdatePollData()` - Validate poll update data
- `validateVoteData()` - Validate vote data
- Comprehensive validation with detailed error messages

### 5. **Standardized Error Response Handling**
- `createErrorResponse()` - Standardized error responses
- `createSuccessResponse()` - Standardized success responses
- `handleDatabaseError()` - Database-specific error handling
- Consistent error structure across all operations

### 6. **Comprehensive TypeScript Types**
- `Poll` - Complete poll interface
- `PollOption` - Poll option interface
- `CreatePollData` - Poll creation data
- `UpdatePollData` - Poll update data
- `VoteData` - Vote data
- `PollOperationResult<T>` - Standardized operation results
- `PollListResult` - Paginated poll list
- `PollStats` - Poll statistics

## 📁 File Structure

```
lib/
├── poll-actions.ts           # Main refactored file
├── examples/
│   └── poll-actions-usage.ts # Usage examples
└── README-poll-actions.md    # This documentation
```

## 🚀 Usage Examples

### Basic Poll Creation

```typescript
import { createPoll, type CreatePollData } from '@/lib/poll-actions';

const pollData: CreatePollData = {
  title: "What's your favorite language?",
  description: "Help us decide our next focus",
  options: ["JavaScript", "TypeScript", "Python"],
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

const result = await createPoll(pollData);

if (result.success) {
  console.log('Poll created:', result.data);
} else {
  console.error('Error:', result.error);
  if (result.validationErrors) {
    console.error('Validation errors:', result.validationErrors);
  }
}
```

### Voting on a Poll

```typescript
import { voteOnPoll } from '@/lib/poll-actions';

const result = await voteOnPoll({
  poll_id: 'poll-123',
  option_id: 'option-456'
});

if (result.success) {
  console.log('Vote recorded:', result.data);
} else {
  console.error('Vote failed:', result.error);
}
```

### React Hook Integration

```typescript
import { usePollOperations } from '@/lib/examples/poll-actions-usage';

function PollComponent() {
  const { loading, error, createPoll, vote } = usePollOperations();

  const handleCreatePoll = async (data) => {
    const poll = await createPoll(data);
    if (poll) {
      // Handle success
    }
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {/* Your poll UI */}
    </div>
  );
}
```

## 🔧 Error Handling

All operations return a standardized `PollOperationResult<T>`:

```typescript
interface PollOperationResult<T> {
  success: boolean;
  data?: T;
  error?: FormError;
  validationErrors?: Record<string, string>;
}
```

### Error Types

- **Validation Errors**: Field-specific validation failures
- **API Errors**: Authentication, authorization, or server errors
- **Network Errors**: Connection issues
- **General Errors**: Unexpected errors

### Example Error Handling

```typescript
const result = await createPoll(pollData);

if (!result.success) {
  if (result.validationErrors) {
    // Handle field-specific validation errors
    Object.entries(result.validationErrors).forEach(([field, error]) => {
      console.error(`${field}: ${error}`);
    });
  } else if (result.error) {
    // Handle general errors
    console.error(result.error.message);
  }
}
```

## 🛡️ Security Features

### Authentication
- All operations require user authentication
- Automatic session validation
- User context passed to all operations

### Authorization
- Poll ownership verification for updates/deletes
- Row Level Security (RLS) integration
- User-specific data access

### Validation
- Input sanitization and validation
- SQL injection prevention
- XSS protection through proper escaping

## 📊 Database Schema Requirements

The poll-actions.ts expects the following Supabase tables:

### polls table
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);
```

### poll_options table
```sql
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS Policies
```sql
-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Users can view all active polls" ON polls
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- Poll options policies
CREATE POLICY "Users can view poll options" ON poll_options
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on polls" ON poll_options
  FOR UPDATE USING (true);
```

## 🔄 Migration from Old Code

### Before (scattered operations)
```typescript
// Old way - scattered across components
const response = await fetch('/api/polls', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

if (response.ok) {
  const data = await response.json();
  // Handle success
} else {
  // Handle error
}
```

### After (centralized operations)
```typescript
// New way - centralized and type-safe
const result = await createPoll(pollData);

if (result.success) {
  // Handle success with typed data
  console.log(result.data);
} else {
  // Handle errors with detailed information
  if (result.validationErrors) {
    // Handle validation errors
  } else {
    // Handle other errors
  }
}
```

## 🧪 Testing

The refactored code is designed to be easily testable:

```typescript
// Mock Supabase client for testing
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

// Test poll creation
test('should create poll successfully', async () => {
  const pollData = { title: 'Test Poll', options: ['A', 'B'] };
  const result = await createPoll(pollData);
  
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
});
```

## 📈 Performance Considerations

- **Connection Pooling**: Reuses Supabase client instances
- **Batch Operations**: Efficient database queries
- **Error Caching**: Prevents repeated failed requests
- **Type Safety**: Compile-time error prevention
- **Validation**: Early validation prevents unnecessary API calls

## 🔮 Future Enhancements

- **Caching**: Redis integration for frequently accessed polls
- **Real-time Updates**: WebSocket integration for live vote updates
- **Analytics**: Poll engagement and voting patterns
- **Export**: Poll data export functionality
- **Templates**: Pre-built poll templates
- **Collaboration**: Multi-user poll editing

## 📝 Contributing

When extending the poll-actions.ts:

1. **Follow the established patterns** for error handling and validation
2. **Add comprehensive TypeScript types** for all new interfaces
3. **Include validation functions** for all input data
4. **Write usage examples** in the examples directory
5. **Update this documentation** with new features
6. **Add tests** for all new functionality

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure user is signed in before calling operations
   - Check Supabase RLS policies are correctly configured

2. **Validation Errors**
   - Verify input data matches expected types
   - Check validation rules in validation.ts

3. **Database Errors**
   - Ensure tables exist with correct schema
   - Verify RLS policies allow the operation

4. **Type Errors**
   - Import types from poll-actions.ts
   - Use proper TypeScript interfaces

### Debug Mode

Enable debug logging in development:

```typescript
// Set environment variable
NODE_ENV=development

// Errors will be logged to console automatically
```
