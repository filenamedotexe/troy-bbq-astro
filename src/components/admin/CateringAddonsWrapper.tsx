import React, { useState, useEffect } from 'react';
import AddOnForm from './AddOnForm';
import AddOnsList from './AddOnsList';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import type { CateringAddon } from '../../types';
import type { CreateCateringAddonInput, UpdateCateringAddonInput } from '../../lib/schemas';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  filters?: {
    activeOnly: boolean;
    category: string | null;
  };
}

export default function CateringAddonsWrapper() {
  const [addons, setAddons] = useState<CateringAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState<CateringAddon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [isBulkOperationInProgress, setIsBulkOperationInProgress] = useState(false);
  const [fetchController, setFetchController] = useState<AbortController | null>(null);

  useEffect(() => {
    // Prevent duplicate fetch calls by checking if operation is in progress
    if (!isBulkOperationInProgress) {
      fetchAddons();
    }
  }, [activeFilter, categoryFilter, isBulkOperationInProgress]);

  const fetchAddons = async () => {
    try {
      // Cancel previous request if still pending
      if (fetchController) {
        fetchController.abort();
      }
      
      const controller = new AbortController();
      setFetchController(controller);
      setIsLoading(true);
      
      const params = new URLSearchParams();
      params.set('active', activeFilter.toString());
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }

      const response = await fetch(`/api/catering/addons?${params}`, {
        signal: controller.signal
      });
      const result: ApiResponse<CateringAddon[]> = await response.json();
      
      if (result.success && result.data) {
        setAddons(result.data);
      } else {
        console.error('Failed to fetch add-ons:', result.error);
        setMessage({ type: 'error', text: 'Failed to load add-ons' });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching add-ons:', error);
        setMessage({ type: 'error', text: 'Failed to load add-ons' });
      }
    } finally {
      setIsLoading(false);
      setFetchController(null);
    }
  };

  const handleCreateAddon = async (data: CreateCateringAddonInput) => {
    try {
      setIsSaving(true);
      setMessage(null);

      const response = await fetch('/api/catering/addons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<{ id: string }> = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Add-on created successfully!' });
        setShowForm(false);
        
        // Prevent duplicate fetch calls by setting operation flag
        setIsBulkOperationInProgress(true);
        await fetchAddons(); // Refresh the list
        setIsBulkOperationInProgress(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create add-on' });
      }
    } catch (error) {
      console.error('Error creating add-on:', error);
      setMessage({ type: 'error', text: 'Failed to create add-on' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAddon = async (id: string, data: UpdateCateringAddonInput) => {
    try {
      setIsSaving(true);
      setMessage(null);

      const response = await fetch(`/api/catering/addons?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<void> = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Add-on updated successfully!' });
        setEditingAddon(null);
        setShowForm(false);
        
        // Prevent duplicate fetch calls by setting operation flag
        setIsBulkOperationInProgress(true);
        await fetchAddons(); // Refresh the list
        setIsBulkOperationInProgress(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update add-on' });
      }
    } catch (error) {
      console.error('Error updating add-on:', error);
      setMessage({ type: 'error', text: 'Failed to update add-on' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this add-on? This action cannot be undone.')) {
      return;
    }

    try {
      setMessage(null);

      const response = await fetch(`/api/catering/addons?id=${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<void> = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Add-on deleted successfully!' });
        
        // Prevent duplicate fetch calls by setting operation flag
        setIsBulkOperationInProgress(true);
        await fetchAddons(); // Refresh the list
        setIsBulkOperationInProgress(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete add-on' });
      }
    } catch (error) {
      console.error('Error deleting add-on:', error);
      setMessage({ type: 'error', text: 'Failed to delete add-on' });
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete', addonIds: string[]) => {
    if (addonIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one add-on' });
      return;
    }

    if (isBulkOperationInProgress) {
      setMessage({ type: 'error', text: 'Another operation is in progress. Please wait.' });
      return;
    }

    const actionText = action === 'delete' ? 'delete' : `${action} these`;
    if (!confirm(`Are you sure you want to ${actionText} ${addonIds.length} add-on(s)?`)) {
      return;
    }

    try {
      setIsBulkOperationInProgress(true);
      setMessage(null);
      let successCount = 0;
      let errors: string[] = [];
      
      // Use Promise.allSettled for better transaction control
      const operations = addonIds.map(async (id) => {
        try {
          if (action === 'delete') {
            const response = await fetch(`/api/catering/addons?id=${id}`, {
              method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
              successCount++;
              return { success: true, id };
            } else {
              errors.push(`Failed to delete add-on ${id}: ${result.error}`);
              return { success: false, id, error: result.error };
            }
          } else {
            const isActive = action === 'activate';
            const response = await fetch(`/api/catering/addons?id=${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ isActive }),
            });
            const result = await response.json();
            if (result.success) {
              successCount++;
              return { success: true, id };
            } else {
              errors.push(`Failed to ${action} add-on ${id}: ${result.error}`);
              return { success: false, id, error: result.error };
            }
          }
        } catch (error) {
          errors.push(`Error with add-on ${id}: ${error}`);
          return { success: false, id, error };
        }
      });
      
      // Wait for all operations to complete
      const results = await Promise.allSettled(operations);
      
      // Count successful operations
      const successfulOps = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      if (successfulOps > 0) {
        setMessage({ 
          type: 'success', 
          text: `Successfully processed ${successfulOps} add-on(s)${errors.length > 0 ? ` (${errors.length} errors)` : ''}` 
        });
        setSelectedAddons(new Set()); // Clear selection
        await fetchAddons(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: 'Failed to process any add-ons' });
      }

      if (errors.length > 0) {
        console.error('Bulk action errors:', errors);
      }

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error in bulk action:', error);
      setMessage({ type: 'error', text: 'Failed to process bulk action' });
    } finally {
      setIsBulkOperationInProgress(false);
    }
  };

  const handleEditAddon = (addon: CateringAddon) => {
    setEditingAddon(addon);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingAddon(null);
    setShowForm(false);
  };

  const filteredAddons = addons.filter(addon => {
    const matchesSearch = !searchQuery || 
      addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addon.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addon.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const categories = Array.from(new Set(addons.map(addon => addon.category).filter(Boolean)));

  const exportAddons = () => {
    const exportData = filteredAddons.map(addon => ({
      name: addon.name,
      description: addon.description || '',
      priceInDollars: (addon.priceCents / 100).toFixed(2),
      category: addon.category || '',
      isActive: addon.isActive
    }));

    const csv = [
      ['Name', 'Description', 'Price ($)', 'Category', 'Active'],
      ...exportData.map(addon => [
        addon.name,
        addon.description,
        addon.priceInDollars,
        addon.category,
        addon.isActive.toString()
      ])
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catering-addons-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Status Message */}
      {message && (
        <div className={`max-w-6xl mx-auto mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catering Add-Ons Management</h1>
            <p className="text-gray-600 mt-2">
              Manage additional services and items for catering orders
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportAddons} variant="outline">
              Export CSV
            </Button>
            <Button onClick={() => setShowForm(true)} disabled={showForm || isBulkOperationInProgress}>
              {showForm ? 'Form Open' : isBulkOperationInProgress ? 'Operation in Progress...' : 'Add New Add-On'}
            </Button>
          </div>
        </div>

        {/* Add-On Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingAddon ? 'Edit Add-On' : 'Create New Add-On'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddOnForm
                initialAddon={editingAddon}
                onSubmit={editingAddon 
                  ? (data) => handleUpdateAddon(editingAddon.id, data)
                  : handleCreateAddon
                }
                onCancel={handleCancelForm}
                isLoading={isSaving}
              />
            </CardContent>
          </Card>
        )}

        {/* Add-Ons List */}
        <Card>
          <CardHeader>
            <CardTitle>Add-Ons List ({filteredAddons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AddOnsList
              addons={filteredAddons}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={(newFilter) => {
                // Prevent filter changes during bulk operations
                if (!isBulkOperationInProgress) {
                  setCategoryFilter(newFilter);
                } else {
                  setMessage({ type: 'error', text: 'Cannot change filters during bulk operation' });
                }
              }}
              activeFilter={activeFilter}
              onActiveFilterChange={(newFilter) => {
                // Prevent filter changes during bulk operations
                if (!isBulkOperationInProgress) {
                  setActiveFilter(newFilter);
                } else {
                  setMessage({ type: 'error', text: 'Cannot change filters during bulk operation' });
                }
              }}
              categories={categories}
              selectedAddons={selectedAddons}
              onSelectionChange={setSelectedAddons}
              onEdit={handleEditAddon}
              onDelete={handleDeleteAddon}
              onBulkAction={handleBulkAction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}