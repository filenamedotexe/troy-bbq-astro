import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Folder,
  FolderOpen,
  Package
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

interface CategoryTreeProps {
  categories: Category[];
  onCreateCategory?: (parentId?: string) => void;
  onEditCategory?: (categoryId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onMoveCategory?: (categoryId: string, newParentId?: string, newSortOrder?: number) => void;
  loading?: boolean;
  className?: string;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  onCreateCategory?: (parentId?: string) => void;
  onEditCategory?: (categoryId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onMoveCategory?: (categoryId: string, newParentId?: string, newSortOrder?: number) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onMoveCategory
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description || '');

  const hasChildren = category.children && category.children.length > 0;
  const paddingLeft = level * 24;

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartEdit = () => {
    setEditName(category.name);
    setEditDescription(category.description || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(category.name);
    setEditDescription(category.description || '');
  };

  const handleSaveEdit = async () => {
    if (onEditCategory && (editName !== category.name || editDescription !== category.description)) {
      // TODO: Implement actual edit logic
      console.log('Editing category:', category.id, { name: editName, description: editDescription });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDeleteCategory && confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      onDeleteCategory(category.id);
    }
  };

  const handleAddChild = () => {
    if (onCreateCategory) {
      onCreateCategory(category.id);
    }
  };

  return (
    <div className="select-none">
      {/* Category Row */}
      <div
        className={cn(
          "group flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200",
          !category.is_active && "opacity-60"
        )}
        style={{ paddingLeft: `${paddingLeft + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggleExpanded}
          className={cn(
            "flex items-center justify-center w-5 h-5 mr-2 hover:bg-gray-200 rounded",
            !hasChildren && "invisible"
          )}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          )}
        </button>

        {/* Drag Handle */}
        <div className="opacity-0 group-hover:opacity-100 mr-2 cursor-grab">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* Category Icon */}
        <div className="mr-3">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-5 w-5 text-blue-500" />
            ) : (
              <Folder className="h-5 w-5 text-blue-500" />
            )
          ) : (
            <Package className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Category Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Category name"
                className="text-sm"
              />
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Category description (optional)"
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {category.name}
                </h3>
                {!category.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
                {(category.product_count || 0) > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {category.product_count} products
                  </Badge>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {category.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddChild}
              className="h-8 w-8 p-0"
              title="Add subcategory"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStartEdit}
              className="h-8 w-8 p-0"
              title="Edit category"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete category"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              onCreateCategory={onCreateCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onMoveCategory={onMoveCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onMoveCategory,
  loading = false,
  className
}) => {
  // Build hierarchical tree structure
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build the tree structure
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!;

      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children!.push(categoryNode);
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    // Sort categories by sort_order
    const sortCategories = (cats: Category[]): Category[] => {
      return cats.sort((a, b) => a.sort_order - b.sort_order).map(cat => ({
        ...cat,
        children: cat.children ? sortCategories(cat.children) : []
      }));
    };

    return sortCategories(rootCategories);
  };

  const treeData = buildCategoryTree(categories);

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 p-3">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48 mt-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No categories yet
        </h3>
        <p className="text-gray-600 mb-4">
          Get started by creating your first product category.
        </p>
        {onCreateCategory && (
          <Button onClick={() => onCreateCategory()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {treeData.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          onCreateCategory={onCreateCategory}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onMoveCategory={onMoveCategory}
        />
      ))}
    </div>
  );
};

export default CategoryTree;