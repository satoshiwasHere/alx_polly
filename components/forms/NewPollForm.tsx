"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validatePollTitle, validatePollDescription, validatePollOptions } from "@/lib/validation";
import { handleFormError, FormError } from "@/lib/error-handling";

interface PollFormData {
  title: string;
  description: string;
  options: string[];
}

interface PollFormErrors {
  title?: string;
  description?: string;
  options?: string;
  general?: string;
}

interface PollFormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  generalError: string | null;
  successMessage: string | null;
}

export default function NewPollForm() {
  const [formData, setFormData] = useState<PollFormData>({
    title: '',
    description: '',
    options: ['', '']
  });
  const [errors, setErrors] = useState<PollFormErrors>({});
  const [formState, setFormState] = useState<PollFormState>({
    isSubmitting: false,
    isSuccess: false,
    generalError: null,
    successMessage: null,
  });
  const router = useRouter();
  
  // Refs for focus management
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const firstOptionRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Validation functions
  const validateForm = (): boolean => {
    const newErrors: PollFormErrors = {};
    
    const titleResult = validatePollTitle(formData.title);
    if (!titleResult.isValid && titleResult.error) {
      newErrors.title = titleResult.error;
    }
    
    const descriptionResult = validatePollDescription(formData.description);
    if (!descriptionResult.isValid && descriptionResult.error) {
      newErrors.description = descriptionResult.error;
    }
    
    const optionsResult = validatePollOptions(formData.options);
    if (!optionsResult.isValid && optionsResult.error) {
      newErrors.options = optionsResult.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper functions for error handling
  const clearErrors = () => {
    setErrors({});
    setFormState(prev => ({ ...prev, generalError: null }));
  };

  const setGeneralError = (message: string) => {
    setFormState(prev => ({ ...prev, generalError: message }));
  };

  const setSuccess = (message: string) => {
    setFormState(prev => ({ 
      ...prev, 
      isSuccess: true, 
      successMessage: message,
      generalError: null 
    }));
  };

  // Focus management functions
  const focusFirstError = () => {
    if (errors.title && titleRef.current) {
      titleRef.current.focus();
    } else if (errors.description && descriptionRef.current) {
      descriptionRef.current.focus();
    } else if (errors.options && firstOptionRef.current) {
      firstOptionRef.current.focus();
    } else if (formState.generalError && errorRef.current) {
      errorRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Escape key to clear errors
    if (e.key === "Escape") {
      clearErrors();
    }
  };

  // Focus management effects
  useEffect(() => {
    // Focus first error when errors change
    if (Object.keys(errors).length > 0 || formState.generalError) {
      setTimeout(focusFirstError, 100);
    }
  }, [errors, formState.generalError]);

  useEffect(() => {
    // Focus first field on mount
    titleRef.current?.focus();
  }, []);

  // Form field handlers
  const handleTitleChange = (value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
    if (formState.generalError) {
      clearErrors();
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
    if (formState.generalError) {
      clearErrors();
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
    if (errors.options) {
      setErrors(prev => ({ ...prev, options: undefined }));
    }
    if (formState.generalError) {
      clearErrors();
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, options: newOptions }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous errors and success states
    clearErrors();
    
    if (!validateForm()) {
      return;
    }
    
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // TODO: Implement actual poll creation API call
      // const response = await fetch('/api/polls', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess("Poll created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/polls");
      }, 1500);
    } catch (error) {
      console.error("Poll creation error:", error);
      const formError = handleFormError(error);
      setGeneralError(formError.message);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <section className="space-y-6 max-w-2xl" role="main" aria-labelledby="poll-title">
      <h1 id="poll-title" className="text-2xl font-semibold">Create a new poll</h1>
      
      {/* General Error Message */}
      {formState.generalError && (
        <div 
          ref={errorRef}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          tabIndex={-1}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-red-500" aria-hidden="true">⚠️</div>
            <p className="text-sm text-red-700">{formState.generalError}</p>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {formState.isSuccess && formState.successMessage && (
        <div 
          className="bg-green-50 border border-green-200 rounded-lg p-4"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-green-500" aria-hidden="true">✅</div>
            <p className="text-sm text-green-700">{formState.successMessage}</p>
          </div>
        </div>
      )}
      
      <div className="relative">
        {formState.isSubmitting && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600 font-medium">Creating your poll...</p>
            </div>
          </div>
        )}
        
        <form 
          className="space-y-4" 
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          aria-label="Create new poll"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              ref={titleRef}
              id="title"
              name="title"
              type="text"
              placeholder="What should we build next?"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={errors.title ? "border-red-500" : ""}
              aria-describedby={errors.title ? "title-error" : undefined}
              aria-invalid={!!errors.title}
              required
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-red-500" role="alert" aria-live="polite">
                {errors.title}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              ref={descriptionRef}
              id="description"
              name="description"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className={errors.description ? "border-red-500" : ""}
              aria-describedby={errors.description ? "description-error" : undefined}
              aria-invalid={!!errors.description}
              rows={3}
            />
            {errors.description && (
              <p id="description-error" className="text-sm text-red-500" role="alert" aria-live="polite">
                {errors.description}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="grid gap-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    ref={index === 0 ? firstOptionRef : undefined}
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className={errors.options ? "border-red-500" : ""}
                    aria-describedby={errors.options ? "options-error" : undefined}
                    aria-invalid={!!errors.options}
                    required
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      aria-label={`Remove option ${index + 1}`}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && (
              <p id="options-error" className="text-sm text-red-500" role="alert" aria-live="polite">
                {errors.options}
              </p>
            )}
            {formData.options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                Add Option
              </Button>
            )}
          </div>
          
          <Button 
            ref={submitRef}
            type="submit" 
            className="w-full" 
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                ></div>
                <span aria-live="polite">Creating poll...</span>
              </div>
            ) : (
              "Create Poll"
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}

