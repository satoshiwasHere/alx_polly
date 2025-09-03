/**
 * Validation utility functions for form validation and error handling
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

/**
 * Email validation
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: "Email is required" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  
  return { isValid: true };
};

/**
 * Password validation with comprehensive rules
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" };
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, error: "Password must contain at least one special character (@$!%*?&)" };
  }
  
  return { isValid: true };
};

/**
 * Name validation
 */
export const validateName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, error: "Name is required" };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long" };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: "Name must be less than 50 characters" };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    return { isValid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  
  return { isValid: true };
};

/**
 * Poll title validation
 */
export const validatePollTitle = (title: string): ValidationResult => {
  if (!title.trim()) {
    return { isValid: false, error: "Poll title is required" };
  }
  
  if (title.trim().length < 3) {
    return { isValid: false, error: "Poll title must be at least 3 characters long" };
  }
  
  if (title.trim().length > 200) {
    return { isValid: false, error: "Poll title must be less than 200 characters" };
  }
  
  return { isValid: true };
};

/**
 * Poll description validation
 */
export const validatePollDescription = (description: string): ValidationResult => {
  if (description && description.length > 1000) {
    return { isValid: false, error: "Description must be less than 1000 characters" };
  }
  
  return { isValid: true };
};

/**
 * Poll option validation
 */
export const validatePollOption = (option: string): ValidationResult => {
  if (!option.trim()) {
    return { isValid: false, error: "Option text is required" };
  }
  
  if (option.trim().length < 1) {
    return { isValid: false, error: "Option text must be at least 1 character long" };
  }
  
  if (option.trim().length > 100) {
    return { isValid: false, error: "Option text must be less than 100 characters" };
  }
  
  return { isValid: true };
};

/**
 * Validate multiple poll options
 */
export const validatePollOptions = (options: string[]): ValidationResult => {
  if (!options || options.length < 2) {
    return { isValid: false, error: "At least 2 options are required" };
  }
  
  if (options.length > 10) {
    return { isValid: false, error: "Maximum 10 options allowed" };
  }
  
  // Check for duplicate options
  const trimmedOptions = options.map(opt => opt.trim().toLowerCase());
  const uniqueOptions = new Set(trimmedOptions);
  if (uniqueOptions.size !== trimmedOptions.length) {
    return { isValid: false, error: "Duplicate options are not allowed" };
  }
  
  // Validate each option
  for (let i = 0; i < options.length; i++) {
    const result = validatePollOption(options[i]);
    if (!result.isValid) {
      return { isValid: false, error: `Option ${i + 1}: ${result.error}` };
    }
  }
  
  return { isValid: true };
};

/**
 * Generic required field validation
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
};

/**
 * Generic length validation
 */
export const validateLength = (
  value: string, 
  minLength: number, 
  maxLength: number, 
  fieldName: string
): ValidationResult => {
  if (value.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` };
  }
  
  if (value.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  return { isValid: true };
};

/**
 * Validate form data and return errors object
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => ValidationResult>
): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  for (const [field, validator] of Object.entries(validators)) {
    const result = validator(data[field]);
    if (!result.isValid && result.error) {
      errors[field] = result.error;
    }
  }
  
  return errors;
};

/**
 * Check if form has any validation errors
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined);
};

/**
 * Get first validation error field name
 */
export const getFirstErrorField = (errors: ValidationErrors): string | null => {
  for (const [field, error] of Object.entries(errors)) {
    if (error) {
      return field;
    }
  }
  return null;
};
