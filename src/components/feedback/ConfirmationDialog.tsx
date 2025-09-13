/**
 * Confirmation Dialog Component for Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and modern UX patterns
 */

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2, X, Check, Info, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

// Dialog types and interfaces
export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
  preventBackdropClose?: boolean;
  autoFocus?: boolean;
  requireTextConfirmation?: boolean;
  confirmationText?: string;
  isLoading?: boolean;
  className?: string;
}

// Quick confirmation hook props
interface UseConfirmationProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationDialogProps['variant'];
  requireTextConfirmation?: boolean;
  confirmationText?: string;
}

// Dialog manager for handling multiple dialogs
class DialogManager {
  private static instance: DialogManager;
  private dialogs: Map<string, ConfirmationDialogProps> = new Map();
  private listeners: Set<(dialogs: ConfirmationDialogProps[]) => void> = new Set();
  
  static getInstance(): DialogManager {
    if (!DialogManager.instance) {
      DialogManager.instance = new DialogManager();
    }
    return DialogManager.instance;
  }
  
  subscribe(listener: (dialogs: ConfirmationDialogProps[]) => void): () => void {
    this.listeners.add(listener);
    listener(Array.from(this.dialogs.values()));
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  private notify(): void {
    const dialogs = Array.from(this.dialogs.values());
    this.listeners.forEach(listener => listener(dialogs));
  }
  
  show(id: string, props: ConfirmationDialogProps): void {
    this.dialogs.set(id, { ...props, isOpen: true });
    this.notify();
  }
  
  hide(id: string): void {
    if (this.dialogs.has(id)) {
      this.dialogs.delete(id);
      this.notify();
    }
  }
  
  hideAll(): void {
    this.dialogs.clear();
    this.notify();
  }
}

/**
 * Main Confirmation Dialog Component
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  preventBackdropClose = false,
  autoFocus = true,
  requireTextConfirmation = false,
  confirmationText = '',
  isLoading = false,
  className
}: ConfirmationDialogProps) {
  const [textInput, setTextInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLElement>(null);
  const lastFocusableRef = useRef<HTMLElement>(null);
  
  // Variant styling
  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      iconBg: 'bg-red-100',
      confirmButton: 'destructive' as const,
      headerColor: 'text-red-900'
    },
    warning: {
      icon: <AlertCircle className="w-6 h-6 text-yellow-500" />,
      iconBg: 'bg-yellow-100',
      confirmButton: 'default' as const,
      headerColor: 'text-yellow-900'
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-500" />,
      iconBg: 'bg-blue-100',
      confirmButton: 'default' as const,
      headerColor: 'text-blue-900'
    },
    success: {
      icon: <Check className="w-6 h-6 text-green-500" />,
      iconBg: 'bg-green-100',
      confirmButton: 'default' as const,
      headerColor: 'text-green-900'
    }
  };
  
  const styles = variantStyles[variant];
  const displayIcon = icon || styles.icon;
  
  // Handle text confirmation validation
  const isTextConfirmationValid = !requireTextConfirmation || 
    textInput.trim().toLowerCase() === confirmationText.toLowerCase();
  
  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Set initial focus
      if (autoFocus) {
        const focusTarget = variant === 'danger' ? cancelButtonRef.current : confirmButtonRef.current;
        focusTarget?.focus();
      }
      
      // Get focusable elements
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements?.length) {
        firstFocusableRef.current = focusableElements[0] as HTMLElement;
        lastFocusableRef.current = focusableElements[focusableElements.length - 1] as HTMLElement;
      }
      
      // Reset text input
      setTextInput('');
    }
  }, [isOpen, autoFocus, variant]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Escape key
      if (event.key === 'Escape' && !preventBackdropClose) {
        event.preventDefault();
        onClose();
      }
      
      // Tab key for focus trapping
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab (backward)
          if (document.activeElement === firstFocusableRef.current) {
            event.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          // Tab (forward)
          if (document.activeElement === lastFocusableRef.current) {
            event.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, preventBackdropClose]);
  
  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !preventBackdropClose) {
      onClose();
    }
  };
  
  // Handle confirmation
  const handleConfirm = async () => {
    if (!isTextConfirmationValid) return;
    
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
      // Don't close the dialog if confirmation fails
    } finally {
      setIsConfirming(false);
    }
  };
  
  // Handle text input change
  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(event.target.value);
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full',
          'transform transition-all duration-200 ease-out',
          'border border-gray-200 dark:border-gray-700',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={cn(
              'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full',
              styles.iconBg
            )}>
              {displayIcon}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 
                id="dialog-title"
                className={cn(
                  'text-lg font-semibold',
                  styles.headerColor,
                  'dark:text-white'
                )}
              >
                {title}
              </h3>
              
              <p 
                id="dialog-description"
                className="mt-2 text-sm text-gray-600 dark:text-gray-300"
              >
                {message}
              </p>
            </div>
          </div>
        </div>
        
        {/* Text confirmation input */}
        {requireTextConfirmation && (
          <div className="px-6 pb-4">
            <label 
              htmlFor="confirmation-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Type "{confirmationText}" to confirm:
            </label>
            <input
              id="confirmation-input"
              type="text"
              value={textInput}
              onChange={handleTextInputChange}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                !isTextConfirmationValid && textInput.length > 0 && 'border-red-500 dark:border-red-400'
              )}
              placeholder={confirmationText}
              autoComplete="off"
              aria-describedby="confirmation-help"
            />
            {!isTextConfirmationValid && textInput.length > 0 && (
              <p 
                id="confirmation-help"
                className="mt-1 text-xs text-red-600 dark:text-red-400"
              >
                Please type the exact text to confirm
              </p>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            ref={cancelButtonRef}
            variant="outline"
            onClick={onClose}
            disabled={isConfirming || isLoading}
            className="w-full sm:w-auto mt-3 sm:mt-0"
          >
            {cancelText}
          </Button>
          
          <Button
            ref={confirmButtonRef}
            variant={styles.confirmButton}
            onClick={handleConfirm}
            disabled={isConfirming || isLoading || !isTextConfirmationValid}
            className="w-full sm:w-auto"
          >
            {isConfirming || isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Confirming...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Confirmation Hook
 */
export function useConfirmation() {
  const [dialogProps, setDialogProps] = useState<ConfirmationDialogProps | null>(null);
  
  const confirm = (props: UseConfirmationProps): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogProps({
        ...props,
        isOpen: true,
        onClose: () => {
          setDialogProps(null);
          resolve(false);
        },
        onConfirm: () => {
          setDialogProps(null);
          resolve(true);
        }
      });
    });
  };
  
  const ConfirmationDialogComponent = () => {
    if (!dialogProps) return null;
    return <ConfirmationDialog {...dialogProps} />;
  };
  
  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent
  };
}

/**
 * Predefined confirmation dialogs
 */
export const confirmationDialogs = {
  /**
   * Delete confirmation
   */
  delete: (itemName: string, requireTextConfirmation = false): Promise<boolean> => {
    const { confirm } = useConfirmation();
    return confirm({
      title: 'Delete ' + itemName,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      requireTextConfirmation,
      confirmationText: requireTextConfirmation ? itemName : undefined
    });
  },
  
  /**
   * Discard changes confirmation
   */
  discardChanges: (): Promise<boolean> => {
    const { confirm } = useConfirmation();
    return confirm({
      title: 'Discard Changes',
      message: 'Are you sure you want to discard your changes? All unsaved changes will be lost.',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      variant: 'warning'
    });
  },
  
  /**
   * Logout confirmation
   */
  logout: (): Promise<boolean> => {
    const { confirm } = useConfirmation();
    return confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'info'
    });
  },
  
  /**
   * Cancel order confirmation
   */
  cancelOrder: (orderNumber: string): Promise<boolean> => {
    const { confirm } = useConfirmation();
    return confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel order #${orderNumber}? This action cannot be undone and any payment will be refunded.`,
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order',
      variant: 'danger'
    });
  },
  
  /**
   * Clear cart confirmation
   */
  clearCart: (): Promise<boolean> => {
    const { confirm } = useConfirmation();
    return confirm({
      title: 'Clear Cart',
      message: 'Are you sure you want to remove all items from your cart?',
      confirmText: 'Clear Cart',
      cancelText: 'Keep Items',
      variant: 'warning'
    });
  }
};

/**
 * Global Dialog Provider Component
 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<ConfirmationDialogProps[]>([]);
  
  useEffect(() => {
    const manager = DialogManager.getInstance();
    const unsubscribe = manager.subscribe(setDialogs);
    return unsubscribe;
  }, []);
  
  return (
    <>
      {children}
      {dialogs.map((dialog, index) => (
        <ConfirmationDialog
          key={index}
          {...dialog}
        />
      ))}
    </>
  );
}