import React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Switch({
  checked = false,
  onChange,
  disabled = false,
  name,
  id,
  className,
  size = 'md',
  ...props
}: SwitchProps) {
  const sizeClasses = {
    sm: 'h-4 w-8',
    md: 'h-5 w-10',
    lg: 'h-6 w-12',
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3 translate-x-0.5',
    md: 'h-4 w-4 translate-x-0.5',
    lg: 'h-5 w-5 translate-x-0.5',
  };

  const checkedThumbClasses = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-6',
  };

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        sizeClasses[size],
        checked ? 'bg-blue-600' : 'bg-gray-200',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
          thumbSizeClasses[size],
          checked && checkedThumbClasses[size]
        )}
      />
      {name && (
        <input
          type="checkbox"
          name={name}
          id={id}
          checked={checked}
          onChange={() => {}} // Controlled by button click
          className="sr-only"
        />
      )}
    </button>
  );
}