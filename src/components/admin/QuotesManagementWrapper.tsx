import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import QuoteCard from './QuoteCard';
import QuoteStatusUpdate from './QuoteStatusUpdate';
import type { CateringQuote, QuoteStatus } from '../../types';
import { debounce } from '../../lib/utils';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    limit: number;
    offset: number;
    count: number;
  };
}

const STATUS_OPTIONS: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Quotes' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function QuotesManagementWrapper() {
  const [quotes, setQuotes] = useState<CateringQuote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<CateringQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Filter and search states
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState<CateringQuote | null>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  // Pagination with safety checks
  const ITEMS_PER_PAGE = 10;
  const safeFilteredQuotes = filteredQuotes || [];
  const totalPages = Math.max(1, Math.ceil(safeFilteredQuotes.length / ITEMS_PER_PAGE));
  const safeCurentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuotes = safeFilteredQuotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Apply filters whenever quotes, selectedStatus, or searchTerm changes
  useEffect(() => {
    applyFilters();
  }, [quotes, selectedStatus, searchTerm]);

  // Reset to first page when filters change with error boundary
  useEffect(() => {
    try {
      setCurrentPage(1);
    } catch (error) {
      console.error('Error resetting page:', error);
      setCurrentPage(1); // Fallback
    }
  }, [selectedStatus, searchTerm]);

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      // Remove hard-coded limit and implement proper pagination
      const response = await fetch('/api/catering/quotes');
      const result: ApiResponse<CateringQuote[]> = await response.json();
      
      if (result.success && result.data) {
        setQuotes(result.data);
      } else {
        console.error('Failed to fetch quotes:', result.error);
        setMessage({ type: 'error', text: 'Failed to load quotes' });
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setMessage({ type: 'error', text: 'Failed to load quotes' });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshQuotes = async () => {
    setIsRefreshing(true);
    await fetchQuotes();
    setIsRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...quotes];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(quote => quote.status === selectedStatus);
    }

    // Filter by search term (email or quote ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.customerEmail.toLowerCase().includes(term) ||
        quote.id.toLowerCase().includes(term)
      );
    }

    setFilteredQuotes(filtered);
  };

  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);
  
  const debouncedSearch = useCallback((term: string) => {
    // Cancel previous debounced call to prevent race conditions
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current.cancel?.();
    }
    
    debouncedSearchRef.current = debounce((searchTerm: string) => {
      setSearchTerm(searchTerm);
    }, 300);
    
    debouncedSearchRef.current(term);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleQuoteUpdate = async (quoteId: string) => {
    // Refresh the specific quote or all quotes
    await refreshQuotes();
    setShowStatusUpdate(false);
    setSelectedQuote(null);
    setMessage({ type: 'success', text: 'Quote updated successfully!' });
    
    // Clear success message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleStatusUpdateClick = (quote: CateringQuote) => {
    setSelectedQuote(quote);
    setShowStatusUpdate(true);
  };

  const handleExport = () => {
    const csvData = filteredQuotes.map(quote => ({
      'Quote ID': quote.id,
      'Customer Email': quote.customerEmail,
      'Event Date': quote.eventDetails.date,
      'Guest Count': quote.eventDetails.guestCount,
      'Event Type': quote.eventDetails.type,
      'Status': quote.status,
      'Total Amount': `$${(quote.pricing.totalCents / 100).toFixed(2)}`,
      'Created At': new Date(quote.createdAt).toISOString().split('T')[0]
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `catering-quotes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quote Management</h1>
            <p className="text-gray-600 mt-2">
              Manage and track catering quotes and their status
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={refreshQuotes}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredQuotes.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
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

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as QuoteStatus | 'all')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <Label htmlFor="search">Search by Email or Quote ID</Label>
              <Input
                id="search"
                type="text"
                placeholder="Enter email or quote ID..."
                onChange={handleSearchChange}
              />
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {paginatedQuotes.length} of {safeFilteredQuotes.length} quotes
                {quotes.length !== safeFilteredQuotes.length && ` (${quotes.length} total)`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      {safeFilteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No quotes found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedStatus !== 'all' 
                ? 'No quotes match your current filters.'
                : 'No catering quotes have been created yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedQuotes.map(quote => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onStatusUpdate={handleStatusUpdateClick}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && safeFilteredQuotes.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {safeCurentPage} of {totalPages} {safeFilteredQuotes.length === 0 ? '(No results)' : ''}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                } catch (error) {
                  console.error('Error navigating to previous page:', error);
                  setCurrentPage(1);
                }
              }}
              disabled={safeCurentPage === 1 || safeFilteredQuotes.length === 0}
            >
              Previous
            </Button>
            {totalPages > 1 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, safeCurentPage - 2)) + i;
              if (page > totalPages) return null;
              return (
                <Button
                  key={page}
                  variant={safeCurentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    try {
                      setCurrentPage(page);
                    } catch (error) {
                      console.error('Error navigating to page:', error);
                      setCurrentPage(1);
                    }
                  }}
                >
                  {page}
                </Button>
              );
            }).filter(Boolean)}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                } catch (error) {
                  console.error('Error navigating to next page:', error);
                  setCurrentPage(totalPages);
                }
              }}
              disabled={safeCurentPage === totalPages || safeFilteredQuotes.length === 0}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && selectedQuote && (
        <QuoteStatusUpdate
          quote={selectedQuote}
          onUpdate={handleQuoteUpdate}
          onClose={() => {
            setShowStatusUpdate(false);
            setSelectedQuote(null);
          }}
        />
      )}
    </div>
  );
}