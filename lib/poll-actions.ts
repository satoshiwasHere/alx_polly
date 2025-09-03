/**
 * Poll Actions - Centralized poll operations with Supabase integration
 * 
 * This module provides:
 * - Centralized Supabase client creation
 * - Modular poll operations (CRUD + voting)
 * - Abstracted user authentication logic
 * - Encapsulated poll input validation
 * - Standardized error response handling
 * - Comprehensive TypeScript types
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { 
  validatePollTitle, 
  validatePollDescription, 
  validatePollOptions,
  type ValidationResult 
} from '@/lib/validation';
import { 
  parseApiError, 
  createFormError, 
  type FormError,
  type ApiError 
} from '@/lib/error-handling';

// ============================================================================
// TYPES
// ============================================================================

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  created_at?: string;
  updated_at?: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  total_votes: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  expires_at?: string;
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  options?: string[];
  expires_at?: string;
  is_active?: boolean;
}

export interface VoteData {
  poll_id: string;
  option_id: string;
}

export interface PollOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: FormError;
  validationErrors?: Record<string, string>;
}

export interface PollListResult {
  polls: Poll[];
  total: number;
  page: number;
  limit: number;
}

export interface PollStats {
  total_polls: number;
  active_polls: number;
  total_votes: number;
  user_polls: number;
}

// ============================================================================
// SUPABASE CLIENT MANAGEMENT
// ============================================================================

/**
 * Get Supabase client for client-side operations
 */
export const getSupabaseClient = () => {
  return createClient();
};

/**
 * Get Supabase client for server-side operations
 */
export const getSupabaseServerClient = () => {
  return createServerClient();
};

/**
 * Get authenticated Supabase client with user session
 */
export const getAuthenticatedClient = async () => {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw createFormError('Authentication required', 'api');
  }
  
  return { supabase, user };
};

/**
 * Get authenticated server client with user session
 */
export const getAuthenticatedServerClient = async () => {
  const supabase = getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw createFormError('Authentication required', 'api');
  }
  
  return { supabase, user };
};

// ============================================================================
// USER AUTHENTICATION LOGIC
// ============================================================================

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { user } = await getAuthenticatedClient();
    return !!user;
  } catch {
    return false;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const { user } = await getAuthenticatedClient();
  return user;
};

/**
 * Require authentication for poll operations
 */
export const requireAuth = async () => {
  const { user } = await getAuthenticatedClient();
  if (!user) {
    throw createFormError('You must be signed in to perform this action', 'api');
  }
  return user;
};

/**
 * Check if user owns a poll
 */
export const checkPollOwnership = async (pollId: string, userId?: string) => {
  const user = userId || (await getCurrentUser());
  if (!user) return false;
  
  const supabase = getSupabaseClient();
  const { data: poll, error } = await supabase
    .from('polls')
    .select('created_by')
    .eq('id', pollId)
    .single();
  
  if (error || !poll) return false;
  return poll.created_by === user.id;
};

// ============================================================================
// POLL INPUT VALIDATION
// ============================================================================

/**
 * Validate poll creation data
 */
export const validateCreatePollData = (data: CreatePollData): PollOperationResult<null> => {
  const validationErrors: Record<string, string> = {};
  
  // Validate title
  const titleResult = validatePollTitle(data.title);
  if (!titleResult.isValid && titleResult.error) {
    validationErrors.title = titleResult.error;
  }
  
  // Validate description (optional)
  if (data.description) {
    const descriptionResult = validatePollDescription(data.description);
    if (!descriptionResult.isValid && descriptionResult.error) {
      validationErrors.description = descriptionResult.error;
    }
  }
  
  // Validate options
  const optionsResult = validatePollOptions(data.options);
  if (!optionsResult.isValid && optionsResult.error) {
    validationErrors.options = optionsResult.error;
  }
  
  // Validate expiration date if provided
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    if (expiresAt <= now) {
      validationErrors.expires_at = 'Expiration date must be in the future';
    }
  }
  
  const hasErrors = Object.keys(validationErrors).length > 0;
  
  return {
    success: !hasErrors,
    validationErrors: hasErrors ? validationErrors : undefined,
    error: hasErrors ? createFormError('Validation failed', 'validation') : undefined
  };
};

/**
 * Validate poll update data
 */
export const validateUpdatePollData = (data: UpdatePollData): PollOperationResult<null> => {
  const validationErrors: Record<string, string> = {};
  
  // Validate title if provided
  if (data.title !== undefined) {
    const titleResult = validatePollTitle(data.title);
    if (!titleResult.isValid && titleResult.error) {
      validationErrors.title = titleResult.error;
    }
  }
  
  // Validate description if provided
  if (data.description !== undefined) {
    const descriptionResult = validatePollDescription(data.description);
    if (!descriptionResult.isValid && descriptionResult.error) {
      validationErrors.description = descriptionResult.error;
    }
  }
  
  // Validate options if provided
  if (data.options !== undefined) {
    const optionsResult = validatePollOptions(data.options);
    if (!optionsResult.isValid && optionsResult.error) {
      validationErrors.options = optionsResult.error;
    }
  }
  
  // Validate expiration date if provided
  if (data.expires_at !== undefined && data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    if (expiresAt <= now) {
      validationErrors.expires_at = 'Expiration date must be in the future';
    }
  }
  
  const hasErrors = Object.keys(validationErrors).length > 0;
  
  return {
    success: !hasErrors,
    validationErrors: hasErrors ? validationErrors : undefined,
    error: hasErrors ? createFormError('Validation failed', 'validation') : undefined
  };
};

/**
 * Validate vote data
 */
export const validateVoteData = (data: VoteData): PollOperationResult<null> => {
  const validationErrors: Record<string, string> = {};
  
  if (!data.poll_id || !data.poll_id.trim()) {
    validationErrors.poll_id = 'Poll ID is required';
  }
  
  if (!data.option_id || !data.option_id.trim()) {
    validationErrors.option_id = 'Option ID is required';
  }
  
  const hasErrors = Object.keys(validationErrors).length > 0;
  
  return {
    success: !hasErrors,
    validationErrors: hasErrors ? validationErrors : undefined,
    error: hasErrors ? createFormError('Validation failed', 'validation') : undefined
  };
};

// ============================================================================
// STANDARDIZED ERROR RESPONSE HANDLING
// ============================================================================

/**
 * Create standardized error response
 */
export const createErrorResponse = (error: any, context?: string): PollOperationResult<null> => {
  const formError = parseApiError(error);
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Poll Actions${context ? ` - ${context}` : ''}]:`, error);
  }
  
  return {
    success: false,
    error: formError
  };
};

/**
 * Create standardized success response
 */
export const createSuccessResponse = <T>(data: T): PollOperationResult<T> => {
  return {
    success: true,
    data
  };
};

/**
 * Handle database operation errors
 */
export const handleDatabaseError = (error: any, operation: string): PollOperationResult<null> => {
  if (error.code === 'PGRST116') {
    return createErrorResponse(createFormError('Resource not found', 'api'), operation);
  }
  
  if (error.code === '23505') {
    return createErrorResponse(createFormError('Resource already exists', 'api'), operation);
  }
  
  if (error.code === '23503') {
    return createErrorResponse(createFormError('Referenced resource not found', 'api'), operation);
  }
  
  return createErrorResponse(error, operation);
};

// ============================================================================
// POLL OPERATIONS
// ============================================================================

/**
 * Create a new poll
 */
export const createPoll = async (pollData: CreatePollData): Promise<PollOperationResult<Poll>> => {
  try {
    // Validate input data
    const validation = validateCreatePollData(pollData);
    if (!validation.success) {
      return validation;
    }
    
    // Require authentication
    const { user, supabase } = await getAuthenticatedClient();
    
    // Prepare poll data
    const pollRecord = {
      title: pollData.title.trim(),
      description: pollData.description?.trim() || null,
      created_by: user.id,
      expires_at: pollData.expires_at || null,
      is_active: true
    };
    
    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert(pollRecord)
      .select()
      .single();
    
    if (pollError) {
      return handleDatabaseError(pollError, 'createPoll');
    }
    
    // Create poll options
    const optionsData = pollData.options.map((text, index) => ({
      poll_id: poll.id,
      text: text.trim(),
      votes: 0,
      order_index: index
    }));
    
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData)
      .select();
    
    if (optionsError) {
      // Clean up created poll if options creation fails
      await supabase.from('polls').delete().eq('id', poll.id);
      return handleDatabaseError(optionsError, 'createPollOptions');
    }
    
    // Return complete poll with options
    const completePoll: Poll = {
      ...poll,
      options: options || [],
      total_votes: 0
    };
    
    return createSuccessResponse(completePoll);
    
  } catch (error) {
    return createErrorResponse(error, 'createPoll');
  }
};

/**
 * Get a poll by ID
 */
export const getPoll = async (pollId: string): Promise<PollOperationResult<Poll>> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `)
      .eq('id', pollId)
      .single();
    
    if (pollError) {
      return handleDatabaseError(pollError, 'getPoll');
    }
    
    if (!poll) {
      return createErrorResponse(createFormError('Poll not found', 'api'), 'getPoll');
    }
    
    // Calculate total votes
    const totalVotes = poll.poll_options?.reduce((sum: number, option: PollOption) => sum + option.votes, 0) || 0;
    
    const completePoll: Poll = {
      ...poll,
      options: poll.poll_options || [],
      total_votes: totalVotes
    };
    
    return createSuccessResponse(completePoll);
    
  } catch (error) {
    return createErrorResponse(error, 'getPoll');
  }
};

/**
 * Get all polls with pagination
 */
export const getPolls = async (
  page: number = 1, 
  limit: number = 10, 
  userId?: string
): Promise<PollOperationResult<PollListResult>> => {
  try {
    const supabase = getSupabaseClient();
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by user if provided
    if (userId) {
      query = query.eq('created_by', userId);
    }
    
    const { data: polls, error, count } = await query;
    
    if (error) {
      return handleDatabaseError(error, 'getPolls');
    }
    
    // Process polls to include total votes
    const processedPolls: Poll[] = (polls || []).map(poll => {
      const totalVotes = poll.poll_options?.reduce((sum: number, option: PollOption) => sum + option.votes, 0) || 0;
      return {
        ...poll,
        options: poll.poll_options || [],
        total_votes: totalVotes
      };
    });
    
    const result: PollListResult = {
      polls: processedPolls,
      total: count || 0,
      page,
      limit
    };
    
    return createSuccessResponse(result);
    
  } catch (error) {
    return createErrorResponse(error, 'getPolls');
  }
};

/**
 * Update a poll
 */
export const updatePoll = async (
  pollId: string, 
  updateData: UpdatePollData
): Promise<PollOperationResult<Poll>> => {
  try {
    // Validate input data
    const validation = validateUpdatePollData(updateData);
    if (!validation.success) {
      return validation;
    }
    
    // Require authentication and ownership
    const { user, supabase } = await getAuthenticatedClient();
    const isOwner = await checkPollOwnership(pollId, user.id);
    
    if (!isOwner) {
      return createErrorResponse(createFormError('You can only update your own polls', 'api'), 'updatePoll');
    }
    
    // Prepare update data
    const pollUpdate: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updateData.title !== undefined) pollUpdate.title = updateData.title.trim();
    if (updateData.description !== undefined) pollUpdate.description = updateData.description?.trim() || null;
    if (updateData.expires_at !== undefined) pollUpdate.expires_at = updateData.expires_at;
    if (updateData.is_active !== undefined) pollUpdate.is_active = updateData.is_active;
    
    // Update poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .update(pollUpdate)
      .eq('id', pollId)
      .select()
      .single();
    
    if (pollError) {
      return handleDatabaseError(pollError, 'updatePoll');
    }
    
    // Update options if provided
    if (updateData.options) {
      // Delete existing options
      const { error: deleteError } = await supabase
        .from('poll_options')
        .delete()
        .eq('poll_id', pollId);
      
      if (deleteError) {
        return handleDatabaseError(deleteError, 'updatePollOptions');
      }
      
      // Create new options
      const optionsData = updateData.options.map((text, index) => ({
        poll_id: pollId,
        text: text.trim(),
        votes: 0,
        order_index: index
      }));
      
      const { data: options, error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData)
        .select();
      
      if (optionsError) {
        return handleDatabaseError(optionsError, 'updatePollOptions');
      }
      
      poll.poll_options = options;
    } else {
      // Get existing options
      const { data: options } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', pollId)
        .order('order_index');
      
      poll.poll_options = options || [];
    }
    
    // Calculate total votes
    const totalVotes = poll.poll_options?.reduce((sum: number, option: PollOption) => sum + option.votes, 0) || 0;
    
    const completePoll: Poll = {
      ...poll,
      options: poll.poll_options || [],
      total_votes: totalVotes
    };
    
    return createSuccessResponse(completePoll);
    
  } catch (error) {
    return createErrorResponse(error, 'updatePoll');
  }
};

/**
 * Delete a poll
 */
export const deletePoll = async (pollId: string): Promise<PollOperationResult<null>> => {
  try {
    // Require authentication and ownership
    const { user, supabase } = await getAuthenticatedClient();
    const isOwner = await checkPollOwnership(pollId, user.id);
    
    if (!isOwner) {
      return createErrorResponse(createFormError('You can only delete your own polls', 'api'), 'deletePoll');
    }
    
    // Delete poll (options will be deleted via cascade)
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);
    
    if (error) {
      return handleDatabaseError(error, 'deletePoll');
    }
    
    return createSuccessResponse(null);
    
  } catch (error) {
    return createErrorResponse(error, 'deletePoll');
  }
};

/**
 * Vote on a poll
 */
export const voteOnPoll = async (voteData: VoteData): Promise<PollOperationResult<Poll>> => {
  try {
    // Validate input data
    const validation = validateVoteData(voteData);
    if (!validation.success) {
      return validation;
    }
    
    // Require authentication
    const { user, supabase } = await getAuthenticatedClient();
    
    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', voteData.poll_id)
      .eq('is_active', true)
      .single();
    
    if (pollError || !poll) {
      return createErrorResponse(createFormError('Poll not found or inactive', 'api'), 'voteOnPoll');
    }
    
    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return createErrorResponse(createFormError('This poll has expired', 'api'), 'voteOnPoll');
    }
    
    // Check if option exists
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('id', voteData.option_id)
      .eq('poll_id', voteData.poll_id)
      .single();
    
    if (optionError || !option) {
      return createErrorResponse(createFormError('Invalid option', 'api'), 'voteOnPoll');
    }
    
    // Check if user has already voted (optional - depends on business rules)
    // This would require a votes table to track individual votes
    
    // Increment vote count
    const { error: voteError } = await supabase
      .from('poll_options')
      .update({ votes: option.votes + 1 })
      .eq('id', voteData.option_id);
    
    if (voteError) {
      return handleDatabaseError(voteError, 'voteOnPoll');
    }
    
    // Return updated poll
    return getPoll(voteData.poll_id);
    
  } catch (error) {
    return createErrorResponse(error, 'voteOnPoll');
  }
};

/**
 * Get poll statistics
 */
export const getPollStats = async (userId?: string): Promise<PollOperationResult<PollStats>> => {
  try {
    const supabase = getSupabaseClient();
    
    let pollsQuery = supabase.from('polls').select('id, is_active, created_by');
    if (userId) {
      pollsQuery = pollsQuery.eq('created_by', userId);
    }
    
    const { data: polls, error: pollsError } = await pollsQuery;
    
    if (pollsError) {
      return handleDatabaseError(pollsError, 'getPollStats');
    }
    
    const pollIds = polls?.map(p => p.id) || [];
    
    const { data: votes, error: votesError } = await supabase
      .from('poll_options')
      .select('votes')
      .in('poll_id', pollIds);
    
    if (votesError) {
      return handleDatabaseError(votesError, 'getPollStats');
    }
    
    const stats: PollStats = {
      total_polls: polls?.length || 0,
      active_polls: polls?.filter(p => p.is_active).length || 0,
      total_votes: votes?.reduce((sum, v) => sum + v.votes, 0) || 0,
      user_polls: userId ? polls?.length || 0 : 0
    };
    
    return createSuccessResponse(stats);
    
  } catch (error) {
    return createErrorResponse(error, 'getPollStats');
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if poll is active and not expired
 */
export const isPollActive = (poll: Poll): boolean => {
  if (!poll.is_active) return false;
  if (poll.expires_at && new Date(poll.expires_at) < new Date()) return false;
  return true;
};

/**
 * Get poll option by ID
 */
export const getPollOption = (poll: Poll, optionId: string): PollOption | undefined => {
  return poll.options.find(option => option.id === optionId);
};

/**
 * Calculate vote percentage for an option
 */
export const calculateVotePercentage = (optionVotes: number, totalVotes: number): number => {
  if (totalVotes === 0) return 0;
  return Math.round((optionVotes / totalVotes) * 100);
};

/**
 * Get poll with vote percentages
 */
export const getPollWithPercentages = (poll: Poll): Poll => {
  return {
    ...poll,
    options: poll.options.map(option => ({
      ...option,
      percentage: calculateVotePercentage(option.votes, poll.total_votes)
    }))
  };
};
