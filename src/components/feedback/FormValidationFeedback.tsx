/**
 * Form Validation Feedback Components for Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and modern form UX patterns
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

// Form field interfaces
interface FormFieldProps {
  id: string;
  label: string;
  error?: string | string[];
  warning?: string;
  success?: string;
  info?: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

interface ValidationMessageProps {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string | string[];
  fieldId: string;
  className?: string;
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | string[];
  warning?: string;
  success?: string;
  info?: string;
  description?: string;
  showPasswordToggle?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validator?: (value: string) => string | null;
  className?: string;
  containerClassName?: string;
}

interface FieldSetProps {
  legend: string;
  error?: string | string[];
  description?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Validation Message Component
 */
export function ValidationMessage({ 
  type, 
  message, 
  fieldId, 
  className 
}: ValidationMessageProps) {
  const messages = Array.isArray(message) ? message : [message];
  
  const iconMap = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info
  };
  
  const colorMap = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400'
  };
  
  const bgMap = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };
  
  const Icon = iconMap[type];
  
  return (
    <div
      id={`${fieldId}-${type}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start space-x-2 p-3 border rounded-md text-sm',
        bgMap[type],
        colorMap[type],
        className
      )}
    >
      <Icon 
        className="w-4 h-4 flex-shrink-0 mt-0.5" 
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        {messages.length === 1 ? (
          <p>{messages[0]}</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Form Field Container Component
 */
export function FormField({
  id,
  label,
  error,
  warning,
  success,
  info,
  required = false,
  optional = false,
  description,
  className,
  children
}: FormFieldProps) {
  const hasError = Boolean(error);
  const hasWarning = Boolean(warning);
  const hasSuccess = Boolean(success);
  const hasInfo = Boolean(info);
  
  // Generate describedby IDs
  const describedByIds = [
    description && `${id}-description`,
    error && `${id}-error`,
    warning && `${id}-warning`,
    success && `${id}-success`,
    info && `${id}-info`
  ].filter(Boolean).join(' ');
  
  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            hasError && 'text-red-700 dark:text-red-300'
          )}
        >
          {label}
          {required && (
            <span 
              className="text-red-500 ml-1" 
              aria-label="required"
            >
              *
            </span>
          )}
          {optional && (
            <span className="text-gray-500 ml-1 font-normal">
              (optional)
            </span>
          )}
        </Label>
      </div>
      
      {/* Description */}
      {description && (
        <p 
          id={`${id}-description`}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {description}
        </p>
      )}
      
      {/* Form Control */}
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-invalid': hasError,
          'aria-describedby': describedByIds || undefined,
          'aria-required': required
        })}
      </div>
      
      {/* Validation Messages */}
      <div className="space-y-2">
        {error && (
          <ValidationMessage
            type="error"
            message={error}
            fieldId={id}
          />
        )}
        
        {warning && !hasError && (
          <ValidationMessage
            type="warning"
            message={warning}
            fieldId={id}
          />
        )}
        
        {success && !hasError && !hasWarning && (
          <ValidationMessage
            type="success"
            message={success}
            fieldId={id}
          />
        )}
        
        {info && !hasError && !hasWarning && !hasSuccess && (
          <ValidationMessage
            type="info"
            message={info}
            fieldId={id}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Validated Input Component
 */
export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({
    label,
    error,
    warning,
    success,
    info,
    description,
    showPasswordToggle = false,
    validateOnBlur = true,
    validateOnChange = false,
    validator,
    className,
    containerClassName,
    type = 'text',
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [validationError, setValidationError] = React.useState<string | null>(null);
    const [touched, setTouched] = React.useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);
    
    const actualType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type;
    
    const displayedError = error || (touched ? validationError : null);
    
    // Validation function
    const validate = (value: string) => {
      if (validator) {
        const validationResult = validator(value);
        setValidationError(validationResult);
        return validationResult;
      }
      return null;
    };
    
    // Handle blur
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      
      if (validateOnBlur) {
        validate(event.target.value);
      }
      
      if (props.onBlur) {
        props.onBlur(event);
      }
    };
    
    // Handle change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (validateOnChange) {
        validate(event.target.value);
      }
      
      if (props.onChange) {
        props.onChange(event);
      }
    };
    
    // Password toggle
    const togglePasswordVisibility = () => {
      setShowPassword(prev => !prev);
    };
    
    const inputElement = (
      <div className="relative">
        <Input
          ref={inputRef}
          type={actualType}
          className={cn(
            displayedError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            success && !displayedError && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            showPasswordToggle && 'pr-10',
            className
          )}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        {/* Password toggle button */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    );
    
    if (!label) {
      return inputElement;
    }
    
    return (
      <FormField
        id={props.id || ''}
        label={label}
        error={displayedError || undefined}
        warning={warning}
        success={success}
        info={info}
        description={description}
        required={props.required}
        className={containerClassName}
      >
        {inputElement}
      </FormField>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

/**
 * Form FieldSet Component for grouped form controls
 */
export function FieldSet({
  legend,
  error,
  description,
  required = false,
  className,
  children
}: FieldSetProps) {
  const fieldsetId = React.useId();
  const hasError = Boolean(error);
  
  return (
    <fieldset 
      className={cn(
        'border border-gray-200 dark:border-gray-700 rounded-lg p-4',
        hasError && 'border-red-500 dark:border-red-400',
        className
      )}
      aria-describedby={description ? `${fieldsetId}-description` : undefined}
    >
      <legend className={cn(
        'text-sm font-medium px-2 -ml-2',
        hasError ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'
      )}>
        {legend}
        {required && (
          <span 
            className="text-red-500 ml-1" 
            aria-label="required"
          >
            *
          </span>
        )}
      </legend>
      
      {description && (
        <p 
          id={`${fieldsetId}-description`}
          className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4"
        >
          {description}
        </p>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
      
      {error && (
        <div className="mt-4">
          <ValidationMessage
            type="error"
            message={error}
            fieldId={fieldsetId}
          />
        </div>
      )}
    </fieldset>
  );
}

/**
 * Form Summary Component for displaying overall form status
 */
export function FormSummary({
  errors = [],
  warnings = [],
  title = 'Form Issues',
  className
}: {
  errors?: string[];
  warnings?: string[];
  title?: string;
  className?: string;
}) {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const summaryRef = useRef<HTMLDivElement>(null);
  
  // Focus on summary when errors change
  useEffect(() => {
    if (hasErrors && summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [hasErrors]);
  
  if (!hasErrors && !hasWarnings) {
    return null;
  }
  
  return (
    <div
      ref={summaryRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className={cn(
        'p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
        hasErrors 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {hasErrors ? (
            <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" aria-hidden="true" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className={cn(
            'text-sm font-medium',
            hasErrors ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
          )}>
            {title}
          </h3>
          
          <div className="mt-2 text-sm">
            {hasErrors && (
              <div className="mb-3">
                <p className="text-red-700 dark:text-red-300 font-medium mb-1">
                  Please fix the following errors:
                </p>
                <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {hasWarnings && (
              <div>
                <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-1">
                  Please review the following warnings:
                </p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Validation helpers and utilities
 */
export const validators = {
  required: (value: string) => 
    value.trim() ? null : 'This field is required',
  
  email: (value: string) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },
  
  minLength: (min: number) => (value: string) =>
    value.length >= min ? null : `Must be at least ${min} characters long`,
  
  maxLength: (max: number) => (value: string) =>
    value.length <= max ? null : `Must be no more than ${max} characters long`,
  
  phone: (value: string) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/\D/g, '')) ? null : 'Please enter a valid phone number';
  },
  
  url: (value: string) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },
  
  pattern: (regex: RegExp, message: string) => (value: string) =>
    !value || regex.test(value) ? null : message,
  
  compose: (...validators: Array<(value: string) => string | null>) => (value: string) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  }
};