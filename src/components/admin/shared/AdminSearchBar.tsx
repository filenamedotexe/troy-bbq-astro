import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  type?: 'recent' | 'suggestion' | 'exact';
}

export interface QuickFilter {
  key: string;
  label: string;
  value: any;
  active?: boolean;
}

export interface SortOption {
  key: string;
  label: string;
  direction?: 'ASC' | 'DESC';
}

export interface AdminSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit?: (term: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  quickFilters?: QuickFilter[];
  onQuickFilterToggle?: (filterKey: string) => void;
  sortOptions?: SortOption[];
  currentSort?: string;
  sortDirection?: 'ASC' | 'DESC';
  onSortChange?: (sortKey: string, direction: 'ASC' | 'DESC') => void;
  showAdvancedFilters?: boolean;
  onAdvancedFiltersToggle?: () => void;
  loading?: boolean;
  className?: string;
}

const AdminSearchBar: React.FC<AdminSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  placeholder = "Search...",
  suggestions = [],
  onSuggestionSelect,
  quickFilters = [],
  onQuickFilterToggle,
  sortOptions = [],
  currentSort,
  sortDirection = 'ASC',
  onSortChange,
  showAdvancedFilters = false,
  onAdvancedFiltersToggle,
  loading = false,
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle search input changes with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length > 0) {
        setShowSuggestions(suggestions.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm, suggestions.length]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearchSubmit?.(searchTerm);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[focusedSuggestionIndex]);
        } else {
          onSearchSubmit?.(searchTerm);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onSuggestionSelect?.(suggestion);
    setShowSuggestions(false);
    setFocusedSuggestionIndex(-1);
  };

  // Handle search clear
  const handleClear = () => {
    onSearchChange('');
    setShowSuggestions(false);
    searchRef.current?.focus();
  };

  // Handle sort change
  const handleSortChange = (sortKey: string) => {
    if (!onSortChange) return;

    let newDirection: 'ASC' | 'DESC' = 'ASC';
    if (currentSort === sortKey && sortDirection === 'ASC') {
      newDirection = 'DESC';
    }
    onSortChange(sortKey, newDirection);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeQuickFilters = quickFilters.filter(filter => filter.active);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main search bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={searchRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 && searchTerm.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10 pr-24"
            disabled={loading}
          />

          {/* Search controls */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {(quickFilters.length > 0 || sortOptions.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-6 w-6 p-0",
                  showFilters || activeQuickFilters.length > 0
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-gray-100"
                )}
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors",
                  index === focusedSuggestionIndex && "bg-blue-50"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.title}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-sm text-gray-500 truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {suggestion.category && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.category}
                      </Badge>
                    )}
                    {suggestion.type === 'recent' && (
                      <Badge variant="outline" className="text-xs">
                        Recent
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active filters display */}
      {activeQuickFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Active filters:</span>
          {activeQuickFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {filter.label}
              <button
                onClick={() => onQuickFilterToggle?.(filter.key)}
                className="hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Quick filters and sort options */}
      {showFilters && (quickFilters.length > 0 || sortOptions.length > 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Quick filters */}
          {quickFilters.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Filters</h4>
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.key}
                    variant={filter.active ? "default" : "outline"}
                    size="sm"
                    onClick={() => onQuickFilterToggle?.(filter.key)}
                    className="text-xs"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Sort options */}
          {sortOptions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sort By</h4>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => (
                  <Button
                    key={option.key}
                    variant={currentSort === option.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSortChange(option.key)}
                    className="text-xs flex items-center gap-1"
                  >
                    {option.label}
                    {currentSort === option.key && (
                      sortDirection === 'ASC' ? (
                        <SortAsc className="h-3 w-3" />
                      ) : (
                        <SortDesc className="h-3 w-3" />
                      )
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced filters toggle */}
          {onAdvancedFiltersToggle && (
            <div className="pt-2 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={onAdvancedFiltersToggle}
                className="text-blue-600 hover:text-blue-800"
              >
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSearchBar;