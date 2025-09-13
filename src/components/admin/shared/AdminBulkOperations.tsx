import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import {
  Trash2,
  Eye,
  EyeOff,
  Archive,
  Copy,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  confirmationRequired?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface AdminBulkOperationsProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onActionExecute: (actionKey: string) => Promise<void> | void;
  onClearSelection: () => void;
  loading?: boolean;
  className?: string;
}

const AdminBulkOperations: React.FC<AdminBulkOperationsProps> = ({
  selectedCount,
  totalCount,
  actions,
  onActionExecute,
  onClearSelection,
  loading = false,
  className
}) => {
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  // Handle action execution with confirmation
  const handleActionClick = (action: BulkAction) => {
    if (action.disabled) return;

    if (action.confirmationRequired) {
      setShowConfirmation(action.key);
    } else {
      executeAction(action.key);
    }
  };

  // Execute the action
  const executeAction = async (actionKey: string) => {
    setExecutingAction(actionKey);
    setShowConfirmation(null);

    try {
      await onActionExecute(actionKey);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setExecutingAction(null);
    }
  };

  // Cancel confirmation
  const cancelConfirmation = () => {
    setShowConfirmation(null);
  };

  // Get confirmation details
  const getConfirmationAction = () => {
    return actions.find(action => action.key === showConfirmation);
  };

  const confirmationAction = getConfirmationAction();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className={cn(
        "sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40",
        className
      )}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Selection info */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} of {totalCount} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions.map((action) => {
              const isExecuting = executingAction === action.key;
              const isDisabled = action.disabled || loading || isExecuting;

              return (
                <div key={action.key} className="relative">
                  <Button
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => handleActionClick(action)}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-2",
                      action.variant === 'destructive' && "hover:bg-red-600"
                    )}
                    title={action.disabledReason && isDisabled ? action.disabledReason : undefined}
                  >
                    {isExecuting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      action.icon
                    )}
                    {action.label}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && confirmationAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              {confirmationAction.variant === 'destructive' ? (
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              ) : (
                <div className="p-2 bg-blue-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmationAction.confirmationTitle || `Confirm ${confirmationAction.label}`}
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">
                {confirmationAction.confirmationMessage ||
                  `Are you sure you want to ${confirmationAction.label.toLowerCase()} ${selectedCount} item${selectedCount !== 1 ? 's' : ''}?`
                }
              </p>

              {confirmationAction.variant === 'destructive' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={cancelConfirmation}
                disabled={executingAction !== null}
              >
                Cancel
              </Button>
              <Button
                variant={confirmationAction.variant || 'default'}
                onClick={() => executeAction(confirmationAction.key)}
                disabled={executingAction !== null}
                className="flex items-center gap-2"
              >
                {executingAction === confirmationAction.key && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                )}
                {confirmationAction.label}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Common bulk actions for different entity types
export const getProductBulkActions = (): BulkAction[] => [
  {
    key: 'publish',
    label: 'Publish',
    icon: <Eye className="h-4 w-4" />,
    variant: 'default'
  },
  {
    key: 'unpublish',
    label: 'Unpublish',
    icon: <EyeOff className="h-4 w-4" />,
    variant: 'outline'
  },
  {
    key: 'duplicate',
    label: 'Duplicate',
    icon: <Copy className="h-4 w-4" />,
    variant: 'outline'
  },
  {
    key: 'archive',
    label: 'Archive',
    icon: <Archive className="h-4 w-4" />,
    variant: 'outline',
    confirmationRequired: true,
    confirmationTitle: 'Archive Products',
    confirmationMessage: 'Archived products will be hidden from customers but can be restored later.'
  },
  {
    key: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    variant: 'outline'
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive',
    confirmationRequired: true,
    confirmationTitle: 'Delete Products',
    confirmationMessage: 'Deleted products will be permanently removed from your catalog.'
  }
];

export const getCategoryBulkActions = (): BulkAction[] => [
  {
    key: 'activate',
    label: 'Activate',
    icon: <CheckCircle className="h-4 w-4" />,
    variant: 'default'
  },
  {
    key: 'deactivate',
    label: 'Deactivate',
    icon: <XCircle className="h-4 w-4" />,
    variant: 'outline'
  },
  {
    key: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    variant: 'outline'
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive',
    confirmationRequired: true,
    confirmationTitle: 'Delete Categories',
    confirmationMessage: 'Deleting categories will also remove them from all associated products.'
  }
];

export const getOrderBulkActions = (): BulkAction[] => [
  {
    key: 'mark_confirmed',
    label: 'Mark as Confirmed',
    icon: <CheckCircle className="h-4 w-4" />,
    variant: 'default'
  },
  {
    key: 'mark_preparing',
    label: 'Mark as Preparing',
    icon: <Upload className="h-4 w-4" />,
    variant: 'outline'
  },
  {
    key: 'export',
    label: 'Export Orders',
    icon: <Download className="h-4 w-4" />,
    variant: 'outline'
  },
  {
    key: 'cancel',
    label: 'Cancel Orders',
    icon: <XCircle className="h-4 w-4" />,
    variant: 'destructive',
    confirmationRequired: true,
    confirmationTitle: 'Cancel Orders',
    confirmationMessage: 'Cancelled orders cannot be processed. Customers will be notified.'
  }
];

export default AdminBulkOperations;