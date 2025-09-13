import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type { 
  OrderTrackingDetails, 
  OrderStatus, 
  AdminOrderFilters, 
  RealTimeOrderUpdate 
} from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { 
  getStatusColor, 
  getStatusLabel, 
  getNextAllowedStatuses, 
  orderTrackingService 
} from '../../lib/orderTracking';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { OrderTracker } from './OrderTracker';
import {
  Search,
  Filter,
  Clock,
  Package,
  Truck,
  CheckCircle,
  X,
  Plus,
  Eye,
  Edit,
  RotateCcw
} from 'lucide-react';

interface AdminOrderManagementProps {
  className?: string;
}

interface FilterFormData {
  customerSearch: string;
  status: string;
  orderType: string;
  deliveryType: string;
  startDate: string;
  endDate: string;
}

interface StatusUpdateFormData {
  status: OrderStatus;
  message: string;
  estimatedTime: string;
  notifyCustomer: boolean;
}

interface OrderStatusCounts {
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
}

export function AdminOrderManagement({ className = '' }: AdminOrderManagementProps) {
  const [orders, setOrders] = useState<OrderTrackingDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderTrackingDetails | null>(null);
  const [statusCounts, setStatusCounts] = useState<OrderStatusCounts>({
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState<string | null>(null);
  const [realTimeConnected, setRealTimeConnected] = useState(false);

  const filterForm = useForm<FilterFormData>({
    defaultValues: {
      customerSearch: '',
      status: 'all',
      orderType: 'all',
      deliveryType: 'all',
      startDate: '',
      endDate: ''
    }
  });

  const statusUpdateForm = useForm<StatusUpdateFormData>({
    defaultValues: {
      notifyCustomer: true
    }
  });

  // Fetch orders with current filters
  const fetchOrders = useCallback(async (filters: Partial<AdminOrderFilters> = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (filters.customerSearch) params.append('customerSearch', filters.customerSearch);
      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      if (filters.orderType && filters.orderType !== 'all') {
        params.append('orderType', filters.orderType);
      }
      if (filters.deliveryType && filters.deliveryType !== 'all') {
        params.append('deliveryType', filters.deliveryType);
      }
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }
      params.append('limit', '50');

      const response = await fetch(`/api/orders/admin?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders');
      }

      const result = await response.json();
      setOrders(result.data.orders);
      setStatusCounts(result.data.statusCounts);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/orders/stream?admin=true');

        eventSource.onopen = () => {
          setRealTimeConnected(true);
        };

        eventSource.addEventListener('update', (event) => {
          try {
            const update: RealTimeOrderUpdate = JSON.parse(event.data);
            
            // Update orders list
            setOrders(prevOrders => {
              const orderIndex = prevOrders.findIndex(o => o.id === update.orderId);
              
              if (orderIndex >= 0 && update.data) {
                const updatedOrders = [...prevOrders];
                updatedOrders[orderIndex] = { ...updatedOrders[orderIndex], ...update.data };
                return updatedOrders;
              }
              
              // If new order, refetch to get complete data
              if (update.type === 'new_order') {
                fetchOrders();
              }
              
              return prevOrders;
            });

            // Update selected order if it matches
            setSelectedOrder(prevSelected => {
              if (prevSelected && prevSelected.id === update.orderId && update.data) {
                return { ...prevSelected, ...update.data };
              }
              return prevSelected;
            });
          } catch (parseError) {
            console.error('Error parsing SSE update:', parseError);
          }
        });

        eventSource.onerror = () => {
          setRealTimeConnected(false);
          // Try to reconnect after 5 seconds
          setTimeout(connectSSE, 5000);
        };
      } catch (error) {
        console.error('Error creating SSE connection:', error);
        setRealTimeConnected(false);
      }
    };

    fetchOrders();
    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchOrders]);

  // Apply filters
  const onFilterSubmit = (data: FilterFormData) => {
    const filters: Partial<AdminOrderFilters> = {};
    
    if (data.customerSearch.trim()) {
      filters.customerSearch = data.customerSearch.trim();
    }
    
    if (data.status !== 'all') {
      filters.status = [data.status as OrderStatus];
    }
    
    if (data.orderType !== 'all') {
      filters.orderType = data.orderType as 'regular' | 'catering';
    }
    
    if (data.deliveryType !== 'all') {
      filters.deliveryType = data.deliveryType as 'pickup' | 'delivery';
    }
    
    if (data.startDate && data.endDate) {
      filters.dateRange = {
        start: new Date(data.startDate),
        end: new Date(data.endDate)
      };
    }

    fetchOrders(filters);
    setShowFilters(false);
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, data: StatusUpdateFormData) => {
    try {
      setUpdating(orderId);
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: data.status,
          message: data.message || undefined,
          estimatedTime: data.estimatedTime ? new Date(data.estimatedTime) : undefined,
          notifyCustomer: data.notifyCustomer
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status');
      }

      setShowStatusUpdate(null);
      statusUpdateForm.reset();
      
      // The real-time update will handle updating the UI
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  // Status filter tabs
  const statusTabs = [
    { key: 'all', label: 'All Orders', count: Object.values(statusCounts).reduce((a, b) => a + b, 0) },
    { key: 'pending', label: 'Pending', count: statusCounts.pending },
    { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
    { key: 'preparing', label: 'Preparing', count: statusCounts.preparing },
    { key: 'ready', label: 'Ready', count: statusCounts.ready },
    { key: 'out_for_delivery', label: 'Out for Delivery', count: statusCounts.out_for_delivery },
  ];

  // If viewing a specific order
  if (selectedOrder) {
    return (
      <div className={className}>
        <div className="mb-4">
          <Button 
            onClick={() => setSelectedOrder(null)}
            variant="outline"
          >
            ← Back to Orders List
          </Button>
        </div>
        <OrderTracker orderId={selectedOrder.id} showCustomerInfo={true} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              realTimeConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={realTimeConnected ? 'text-green-600' : 'text-red-600'}>
              {realTimeConnected ? 'Live Updates' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          
          <Button
            onClick={() => fetchOrders()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            RotateCcw
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  filterForm.setValue('status', tab.key);
                  onFilterSubmit(filterForm.getValues());
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterForm.watch('status') === tab.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-white px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerSearch">Customer Search</Label>
                  <Input
                    id="customerSearch"
                    placeholder="Email, phone, or name..."
                    {...filterForm.register('customerSearch')}
                  />
                </div>

                <div>
                  <Label htmlFor="orderType">Order Type</Label>
                  <select
                    id="orderType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...filterForm.register('orderType')}
                  >
                    <option value="all">All Types</option>
                    <option value="regular">Regular</option>
                    <option value="catering">Catering</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="deliveryType">Delivery Type</Label>
                  <select
                    id="deliveryType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...filterForm.register('deliveryType')}
                  >
                    <option value="all">All Types</option>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...filterForm.register('startDate')}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...filterForm.register('endDate')}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Apply Filters</Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    filterForm.reset();
                    fetchOrders();
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="mb-4">{error}</p>
              <Button onClick={() => fetchOrders()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">
                No orders match the current filters. Try adjusting your search criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Order Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold">
                          {order.orderNumber}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        {order.isCatering && (
                          <Badge variant="secondary">Catering</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{order.customerEmail}</p>
                        <p>Placed: {formatDateTime(order.createdAt)}</p>
                        {order.estimatedDeliveryTime && (
                          <p className="text-blue-600">
                            Estimated: {formatDateTime(order.estimatedDeliveryTime)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {formatCurrency(order.payment.total)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => setShowStatusUpdate(order.id)}
                          disabled={updating === order.id}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          {updating === order.id ? 'Updating...' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Status Update Form */}
                  {showStatusUpdate === order.id && (
                    <div className="border-t pt-4">
                      <form 
                        onSubmit={statusUpdateForm.handleSubmit((data) => 
                          updateOrderStatus(order.id, data)
                        )}
                        className="space-y-4"
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="status">New Status</Label>
                            <select
                              id="status"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              {...statusUpdateForm.register('status', { required: true })}
                            >
                              {getNextAllowedStatuses(order.status, 'admin').map(status => (
                                <option key={status} value={status}>
                                  {getStatusLabel(status)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="estimatedTime">Estimated Time (Optional)</Label>
                            <Input
                              id="estimatedTime"
                              type="datetime-local"
                              {...statusUpdateForm.register('estimatedTime')}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="message">Message (Optional)</Label>
                          <Input
                            id="message"
                            placeholder="Additional message for customer..."
                            {...statusUpdateForm.register('message')}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="notifyCustomer"
                            {...statusUpdateForm.register('notifyCustomer')}
                          />
                          <Label htmlFor="notifyCustomer">Notify customer</Label>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            size="sm"
                            disabled={updating === order.id}
                          >
                            Update Status
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowStatusUpdate(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}