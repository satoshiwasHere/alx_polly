/**
 * Tests for validation utility functions
 */

import {
  validateEmail,
  validatePassword,
  validateName,
  validatePollTitle,
  validatePollDescription,
  validatePollOption,
  validatePollOptions,
  validateRequired,
  validateLength,
  validateForm,
  hasValidationErrors,
  getFirstErrorField,
  ValidationResult,
  ValidationErrors,
} from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return valid for correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test123@test-domain.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should return invalid for empty or whitespace emails', () => {
      const invalidEmails = ['', '   ', '\t', '\n'];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Email is required');
      });
    });

    it('should return invalid for malformed emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test@example..com',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid email address');
      });
    });
  });

  describe('validatePassword', () => {
    it('should return valid for strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng@Pass',
        'Test123$',
        'ComplexP@ssw0rd',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should return invalid for empty passwords', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should return invalid for passwords shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('should return invalid for passwords without lowercase letters', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one lowercase letter');
    });

    it('should return invalid for passwords without uppercase letters', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one uppercase letter');
    });

    it('should return invalid for passwords without numbers', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one number');
    });

    it('should return invalid for passwords without special characters', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one special character (@$!%*?&)');
    });
  });

  describe('validateName', () => {
    it('should return valid for proper names', () => {
      const validNames = [
        'John Doe',
        'Jane',
        'Mary-Jane',
        "O'Connor",
        'José María',
        'Jean-Pierre',
      ];

      validNames.forEach(name => {
        const result = validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should return invalid for empty or whitespace names', () => {
      const invalidNames = ['', '   ', '\t', '\n'];

      invalidNames.forEach(name => {
        const result = validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Name is required');
      });
    });

    it('should return invalid for names shorter than 2 characters', () => {
      const result = validateName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be at least 2 characters long');
    });

    it('should return invalid for names longer than 50 characters', () => {
      const longName = 'A'.repeat(51);
      const result = validateName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be less than 50 characters');
    });

    it('should return invalid for names with invalid characters', () => {
      const invalidNames = [
        'John123',
        'Jane@Doe',
        'Test#Name',
        'User$Name',
      ];

      invalidNames.forEach(name => {
        const result = validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
      });
    });
  });

  describe('validatePollTitle', () => {
    it('should return valid for proper poll titles', () => {
      const validTitles = [
        'What should we build next?',
        'Best programming language',
        'A',
        'A'.repeat(200),
      ];

      validTitles.forEach(title => {
        const result = validatePollTitle(title);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should return invalid for empty titles', () => {
      const result = validatePollTitle('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Poll title is required');
    });

    it('should return invalid for titles shorter than 3 characters', () => {
      const result = validatePollTitle('AB');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Poll title must be at least 3 characters long');
    });

    it('should return invalid for titles longer than 200 characters', () => {
      const longTitle = 'A'.repeat(201);
      const result = validatePollTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Poll title must be less than 200 characters');
    });
  });

  describe('validatePollDescription', () => {
    it('should return valid for empty descriptions', () => {
      const result = validatePollDescription('');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for descriptions under 1000 characters', () => {
      const result = validatePollDescription('A'.repeat(999));
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for descriptions longer than 1000 characters', () => {
      const longDescription = 'A'.repeat(1001);
      const result = validatePollDescription(longDescription);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description must be less than 1000 characters');
    });
  });

  describe('validatePollOption', () => {
    it('should return valid for proper options', () => {
      const validOptions = [
        'Option 1',
        'A',
        'A'.repeat(100),
      ];

      validOptions.forEach(option => {
        const result = validatePollOption(option);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should return invalid for empty options', () => {
      const result = validatePollOption('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Option text is required');
    });

    it('should return invalid for options longer than 100 characters', () => {
      const longOption = 'A'.repeat(101);
      const result = validatePollOption(longOption);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Option text must be less than 100 characters');
    });
  });

  describe('validatePollOptions', () => {
    it('should return valid for proper option arrays', () => {
      const validOptions = [
        ['Option 1', 'Option 2'],
        ['A', 'B', 'C', 'D'],
        ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'],
      ];

      validOptions.forEach(options => {
        const result = validatePollOptions(options);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should return invalid for less than 2 options', () => {
      const result = validatePollOptions(['Option 1']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least 2 options are required');
    });

    it('should return invalid for more than 10 options', () => {
      const manyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
      const result = validatePollOptions(manyOptions);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Maximum 10 options allowed');
    });

    it('should return invalid for duplicate options', () => {
      const result = validatePollOptions(['Option 1', 'Option 2', 'Option 1']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Duplicate options are not allowed');
    });

    it('should return invalid for empty options', () => {
      const result = validatePollOptions(['Option 1', '']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Option 2: Option text is required');
    });
  });

  describe('validateRequired', () => {
    it('should return valid for non-empty values', () => {
      const result = validateRequired('test', 'Field');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty values', () => {
      const result = validateRequired('', 'Field');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field is required');
    });
  });

  describe('validateLength', () => {
    it('should return valid for values within length range', () => {
      const result = validateLength('test', 1, 10, 'Field');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for values shorter than minimum', () => {
      const result = validateLength('a', 2, 10, 'Field');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field must be at least 2 characters long');
    });

    it('should return invalid for values longer than maximum', () => {
      const result = validateLength('abcdefghijk', 1, 10, 'Field');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field must be less than 10 characters');
    });
  });

  describe('validateForm', () => {
    it('should return empty errors for valid form data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      };

      const validators = {
        name: validateName,
        email: validateEmail,
        password: validatePassword,
      };

      const errors = validateForm(data, validators);
      expect(errors).toEqual({});
    });

    it('should return errors for invalid form data', () => {
      const data = {
        name: '',
        email: 'invalid-email',
        password: 'weak',
      };

      const validators = {
        name: validateName,
        email: validateEmail,
        password: validatePassword,
      };

      const errors = validateForm(data, validators);
      expect(errors.name).toBe('Name is required');
      expect(errors.email).toBe('Please enter a valid email address');
      expect(errors.password).toBe('Password must be at least 8 characters long');
    });
  });

  describe('hasValidationErrors', () => {
    it('should return false for empty errors object', () => {
      const errors: ValidationErrors = {};
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should return false for errors with undefined values', () => {
      const errors: ValidationErrors = {
        name: undefined,
        email: undefined,
      };
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should return true for errors with defined values', () => {
      const errors: ValidationErrors = {
        name: 'Name is required',
        email: undefined,
      };
      expect(hasValidationErrors(errors)).toBe(true);
    });
  });

  describe('getFirstErrorField', () => {
    it('should return null for empty errors object', () => {
      const errors: ValidationErrors = {};
      expect(getFirstErrorField(errors)).toBe(null);
    });

    it('should return first field with error', () => {
      const errors: ValidationErrors = {
        name: undefined,
        email: 'Email is required',
        password: 'Password is required',
      };
      expect(getFirstErrorField(errors)).toBe('email');
    });

    it('should return null when no errors exist', () => {
      const errors: ValidationErrors = {
        name: undefined,
        email: undefined,
      };
      expect(getFirstErrorField(errors)).toBe(null);
    });
  });
});

