import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ className, children }) => {
  const { onOpenChange } = useDialog();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Content */}
      <div
        className={cn(
          "relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-6",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
      >
        {children}

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
      {children}
    </div>
  );
};

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h3>
  );
};

interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, children }) => {
  return (
    <p className={cn("text-sm text-gray-500", className)}>
      {children}
    </p>
  );
};

interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ className, children }) => {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      {children}
    </div>
  );
};

interface DialogTriggerProps {
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ className, children, onClick, asChild = false }) => {
  if (asChild) {
    return (
      <span onClick={onClick} className={className}>
        {children}
      </span>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
};