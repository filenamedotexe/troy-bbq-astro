/**
 * Input Component for Troy BBQ
 * Perfect compliance with React 18+, TypeScript strict mode, and WCAG 2.2
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 transition-colors",
  {
    variants: {
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-9 px-3 py-2 text-xs",
        lg: "h-11 px-4 py-3",
      },
      variant: {
        default: "border-input",
        error: "border-destructive ring-destructive/20 focus-visible:ring-destructive",
        success: "border-green-500 ring-green-500/20 focus-visible:ring-green-500",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Success message to display
   */
  success?: string;
  /**
   * Icon to display at the start of the input
   */
  startIcon?: React.ReactNode;
  /**
   * Icon to display at the end of the input
   */
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = "text",
    size,
    variant,
    error,
    success,
    startIcon,
    endIcon,
    disabled,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    ...props
  }, ref) => {
    // Generate unique ID for accessibility
    const inputId = React.useId();
    const errorId = `${inputId}-error`;
    const successId = `${inputId}-success`;

    // Determine variant based on state
    const resolvedVariant = error ? "error" : success ? "success" : variant;

    // Compute aria-describedby
    const describedBy = [
      ariaDescribedBy,
      error ? errorId : undefined,
      success ? successId : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    const inputElement = (
      <input
        type={type}
        className={cn(inputVariants({ size, variant: resolvedVariant, className }))}
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
        aria-describedby={describedBy || undefined}
        {...props}
      />
    );

    if (startIcon || endIcon) {
      return (
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-muted-foreground" aria-hidden="true">
                {startIcon}
              </div>
            </div>
          )}
          {React.cloneElement(inputElement, {
            className: cn(
              inputElement.props.className,
              startIcon && "pl-10",
              endIcon && "pr-10"
            ),
          })}
          {endIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-muted-foreground" aria-hidden="true">
                {endIcon}
              </div>
            </div>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = "Input";

/**
 * InputGroup component for complex input layouts with proper labeling
 */
export interface InputGroupProps {
  label?: string;
  error?: string;
  success?: string;
  required?: boolean;
  children: React.ReactElement;
  className?: string;
}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ label, error, success, required, children, className }, ref) => {
    const inputId = React.useId();
    const errorId = `${inputId}-error`;
    const successId = `${inputId}-success`;

    return (
      <div ref={ref} className={cn("space-y-1", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        {React.cloneElement(children, {
          id: inputId,
          error,
          success,
          "aria-describedby": [
            children.props["aria-describedby"],
            error ? errorId : undefined,
            success ? successId : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined,
        })}
        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        {success && !error && (
          <p
            id={successId}
            className="text-sm text-green-600"
            role="status"
            aria-live="polite"
          >
            {success}
          </p>
        )}
      </div>
    );
  }
);

InputGroup.displayName = "InputGroup";

export { Input, inputVariants };