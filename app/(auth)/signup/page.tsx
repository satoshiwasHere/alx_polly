"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
}

interface SignupState {
  isSubmitting: boolean;
  isSuccess: boolean;
  generalError: string | null;
  successMessage: string | null;
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [signupState, setSignupState] = useState<SignupState>({
    isSubmitting: false,
    isSuccess: false,
    generalError: null,
    successMessage: null,
  });
  const router = useRouter();
  const supabase = createClient();
  
  // Refs for focus management
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return "Password must contain at least one special character (@$!%*?&)";
    }
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper functions for error handling
  const clearErrors = () => {
    setErrors({});
    setSignupState(prev => ({ ...prev, generalError: null }));
  };

  const setGeneralError = (message: string) => {
    setSignupState(prev => ({ ...prev, generalError: message }));
  };

  const setSuccess = (message: string) => {
    setSignupState(prev => ({ 
      ...prev, 
      isSuccess: true, 
      successMessage: message,
      generalError: null 
    }));
  };

  const parseSupabaseError = (error: any): string => {
    const message = error.message || error.error_description || "An error occurred";
    
    // Handle specific Supabase error cases
    if (message.includes("already registered")) {
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
    if (message.includes("rate limit")) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    
    return message;
  };

  // Focus management functions
  const focusFirstError = () => {
    if (errors.name && nameRef.current) {
      nameRef.current.focus();
    } else if (errors.email && emailRef.current) {
      emailRef.current.focus();
    } else if (errors.password && passwordRef.current) {
      passwordRef.current.focus();
    } else if (signupState.generalError && errorRef.current) {
      errorRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key in form fields
    if (e.key === "Enter" && e.target !== submitRef.current) {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      
      if (target.id === "name") {
        emailRef.current?.focus();
      } else if (target.id === "email") {
        passwordRef.current?.focus();
      } else if (target.id === "password") {
        submitRef.current?.focus();
      }
    }
    
    // Handle Escape key to clear errors
    if (e.key === "Escape") {
      clearErrors();
    }
  };

  // Focus management effects
  useEffect(() => {
    // Focus first error when errors change
    if (Object.keys(errors).length > 0 || signupState.generalError) {
      setTimeout(focusFirstError, 100);
    }
  }, [errors, signupState.generalError]);

  useEffect(() => {
    // Focus first field on mount
    nameRef.current?.focus();
  }, []);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous errors and success states
    clearErrors();
    
    if (!validateForm()) {
      return;
    }
    
    setSignupState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) {
        const errorMessage = parseSupabaseError(error);
        setGeneralError(errorMessage);
      } else if (data.user) {
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          setSuccess("Account created successfully! Redirecting...");
          setTimeout(() => {
            router.push("/polls");
          }, 1500);
        } else {
          setSuccess("Account created! Please check your email to confirm your account before signing in.");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setSignupState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <main className="space-y-6" role="main" aria-labelledby="signup-title">
      <div className="text-center">
        <h1 id="signup-title" className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted-foreground">Start creating polls</p>
      </div>
      
      {/* General Error Message */}
      {signupState.generalError && (
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
            <p className="text-sm text-red-700">{signupState.generalError}</p>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {signupState.isSuccess && signupState.successMessage && (
        <div 
          className="bg-green-50 border border-green-200 rounded-lg p-4"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-green-500" aria-hidden="true">✅</div>
            <p className="text-sm text-green-700">{signupState.successMessage}</p>
          </div>
        </div>
      )}
      <div className="relative">
        {signupState.isSubmitting && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600 font-medium">Creating your account...</p>
            </div>
          </div>
        )}
        <form 
          className="space-y-4" 
          onSubmit={handleSignUp}
          onKeyDown={handleKeyDown}
          aria-label="Create new account"
          noValidate
        >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            ref={nameRef}
            id="name"
            name="name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: undefined }));
              }
              if (signupState.generalError) {
                clearErrors();
              }
            }}
            className={errors.name ? "border-red-500" : ""}
            aria-describedby={errors.name ? "name-error" : undefined}
            aria-invalid={!!errors.name}
            required
            autoComplete="name"
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500" role="alert" aria-live="polite">
              {errors.name}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: undefined }));
              }
              if (signupState.generalError) {
                clearErrors();
              }
            }}
            className={errors.email ? "border-red-500" : ""}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            required
            autoComplete="email"
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500" role="alert" aria-live="polite">
              {errors.email}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors(prev => ({ ...prev, password: undefined }));
              }
              if (signupState.generalError) {
                clearErrors();
              }
            }}
            className={errors.password ? "border-red-500" : ""}
            aria-describedby={errors.password ? "password-error" : password && !errors.password ? "password-success" : "password-help"}
            aria-invalid={!!errors.password}
            required
            autoComplete="new-password"
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-500" role="alert" aria-live="polite">
              {errors.password}
            </p>
          )}
          {password && !errors.password && (
            <div id="password-success" className="text-sm text-green-600" role="status" aria-live="polite">
              ✓ Password meets all requirements
            </div>
          )}
          {!password && (
            <div id="password-help" className="text-sm text-gray-500">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </div>
          )}
        </div>
        <Button 
          ref={submitRef}
          type="submit" 
          className="w-full" 
          disabled={signupState.isSubmitting}
          aria-describedby="submit-help"
        >
          {signupState.isSubmitting ? (
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              ></div>
              <span aria-live="polite">Creating account...</span>
            </div>
          ) : (
            "Sign up"
          )}
        </Button>
        <p id="submit-help" className="text-xs text-gray-500 text-center">
          Press Enter to submit the form
        </p>
        </form>
      </div>
      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link className="underline" href="/signin">
          Sign in
        </Link>
      </p>
    </main>
  );
}


