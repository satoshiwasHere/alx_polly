/**
 * Example usage of the refactored poll-actions.ts
 * 
 * This file demonstrates how to use the centralized poll operations
 * with proper error handling and validation.
 */

import { 
  createPoll, 
  getPoll, 
  getPolls, 
  updatePoll, 
  deletePoll, 
  voteOnPoll,
  getPollStats,
  getCurrentUser,
  requireAuth,
  type CreatePollData,
  type UpdatePollData,
  type VoteData,
  type Poll,
  type PollOperationResult
} from '../poll-actions';

// ============================================================================
// EXAMPLE: Creating a Poll
// ============================================================================

export const exampleCreatePoll = async () => {
  try {
    // Prepare poll data
    const pollData: CreatePollData = {
      title: "What's your favorite programming language?",
      description: "Help us decide which language to focus on for our next project",
      options: ["JavaScript", "TypeScript", "Python", "Rust", "Go"],
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    // Create the poll
    const result: PollOperationResult<Poll> = await createPoll(pollData);

    if (result.success && result.data) {
      console.log('Poll created successfully:', result.data);
      return result.data;
    } else {
      console.error('Failed to create poll:', result.error);
      if (result.validationErrors) {
        console.error('Validation errors:', result.validationErrors);
      }
      return null;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

// ============================================================================
// EXAMPLE: Fetching Polls
// ============================================================================

export const exampleGetPolls = async () => {
  try {
    // Get first page of polls (10 per page)
    const result = await getPolls(1, 10);

    if (result.success && result.data) {
      console.log('Polls fetched:', result.data.polls);
      console.log('Total polls:', result.data.total);
      return result.data;
    } else {
      console.error('Failed to fetch polls:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

// ============================================================================
// EXAMPLE: Getting a Specific Poll
// ============================================================================

export const exampleGetPoll = async (pollId: string) => {
  try {
    const result = await getPoll(pollId);

    if (result.success && result.data) {
      console.log('Poll details:', result.data);
      return result.data;
    } else {
      console.error('Failed to fetch poll:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

// ============================================================================
// EXAMPLE: Voting on a Poll
// ============================================================================

export const exampleVoteOnPoll = async (pollId: string, optionId: string) => {
  try {
    const voteData: VoteData = {
      poll_id: pollId,
      option_id: optionId
    };

    const result = await voteOnPoll(voteData);

    if (result.success && result.data) {
      console.log('Vote recorded successfully:', result.data);
      return result.data;
    } else {
      console.error('Failed to vote:', result.error);
      if (result.validationErrors) {
        console.error('Validation errors:', result.validationErrors);
      }
      return null;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

// ============================================================================
// EXAMPLE: Updating a Poll
// ============================================================================

export const exampleUpdatePoll = async (pollId: string) => {
  try {
    // Check if user is authenticated and owns the poll
    const user = await getCurrentUser();
    if (!user) {
      console.error('User must be authenticated to update polls');
      return null;
    }

    const updateData: UpdatePollData = {
      title: "Updated: What's your favorite programming language?",
      description: "Updated description with more context",
      options: ["JavaScript", "TypeScript", "Python", "Rust", "Go", "C++"], // Added C++
      is_active: true
    };

    const result = await updatePoll(pollId, updateData);

    if (result.success && result.data) {
      console.log('Poll updated successfully:', result.data);
      return result.data;
    } else {
      console.error('Failed to update poll:', result.error);
      if (result.validationErrors) {
        console.error('Validation errors:', result.validationErrors);
      }
      return null;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

// ============================================================================
// EXAMPLE: Deleting a Poll
// ============================================================================

export const exampleDeletePoll = async (pollId: string) => {
  try {
    const result = await deletePoll(pollId);

    if (result.success) {
      console.log('Poll deleted successfully');
      return true;
    } else {
      console.error('Failed to delete poll:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
};

// ============================================================================
// EXAMPLE: Getting Poll Statistics
// ============================================================================

export const exampleGetPollStats = async () => {
  try {
    // Get stats for current user
    const user = await getCurrentUser();
    const result = await getPollStats(user?.id);

    if (result.success && result.data) {
      console.log('Poll statistics:', result.data);
      return result.data;
    } else {
      console.error('Failed to get poll stats:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

// ============================================================================
// EXAMPLE: React Hook for Poll Operations
// ============================================================================

import { useState, useCallback } from 'react';

export const usePollOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPollWithLoading = useCallback(async (pollData: CreatePollData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createPoll(pollData);
      
      if (result.success) {
        return result.data;
      } else {
        setError(result.error?.message || 'Failed to create poll');
        return null;
      }
    } catch (err) {
      setError('Unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const voteWithLoading = useCallback(async (pollId: string, optionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await voteOnPoll({ poll_id: pollId, option_id: optionId });
      
      if (result.success) {
        return result.data;
      } else {
        setError(result.error?.message || 'Failed to vote');
        return null;
      }
    } catch (err) {
      setError('Unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createPoll: createPollWithLoading,
    vote: voteWithLoading,
    clearError: () => setError(null)
  };
};

// ============================================================================
// EXAMPLE: Form Integration
// ============================================================================

export const exampleFormIntegration = {
  // This shows how to integrate with the NewPollForm component
  handleSubmit: async (formData: { title: string; description: string; options: string[] }) => {
    try {
      const pollData: CreatePollData = {
        title: formData.title,
        description: formData.description,
        options: formData.options.filter(option => option.trim() !== '')
      };

      const result = await createPoll(pollData);

      if (result.success) {
        // Redirect to poll page or show success message
        return { success: true, pollId: result.data?.id };
      } else {
        // Handle validation errors
        return { 
          success: false, 
          errors: result.validationErrors,
          generalError: result.error?.message 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        generalError: 'An unexpected error occurred' 
      };
    }
  }
};

// ============================================================================
// EXAMPLE: Error Handling Patterns
// ============================================================================

export const exampleErrorHandling = {
  // Handle different types of errors
  handlePollOperation: async <T>(operation: () => Promise<PollOperationResult<T>>) => {
    try {
      const result = await operation();
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        // Handle specific error types
        if (result.error?.type === 'validation') {
          return { 
            success: false, 
            type: 'validation',
            errors: result.validationErrors,
            message: result.error.message 
          };
        } else if (result.error?.type === 'api') {
          return { 
            success: false, 
            type: 'api',
            message: result.error.message 
          };
        } else {
          return { 
            success: false, 
            type: 'general',
            message: result.error?.message || 'An error occurred' 
          };
        }
      }
    } catch (error) {
      return { 
        success: false, 
        type: 'unexpected',
        message: 'An unexpected error occurred' 
      };
    }
  }
};
