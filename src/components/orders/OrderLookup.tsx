import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { OrderLookupInput, OrderTrackingDetails } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { getStatusColor, getStatusLabel } from '../../lib/orderTracking';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { OrderTracker } from './OrderTracker';
import { Search, Mail, Phone, Package, Clock, MapPin } from 'lucide-react';

interface OrderLookupProps {
  className?: string;
  onOrderSelect?: (order: OrderTrackingDetails) => void;
  showOrderDetails?: boolean;
}

interface FormData {
  identifier: string;
  orderNumber?: string;
}

export function OrderLookup({ 
  className = '', 
  onOrderSelect,
  showOrderDetails = true
}: OrderLookupProps) {
  const [orders, setOrders] = useState<OrderTrackingDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderTrackingDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: data.identifier.trim(),
          orderNumber: data.orderNumber?.trim() || undefined
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to lookup orders');
      }

      setOrders(result.data.orders);
      setSelectedOrder(null);
      
      if (result.data.orders.length === 0) {
        setError('No orders found with the provided information.');
      }
    } catch (err) {
      console.error('Error looking up orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to lookup orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order: OrderTrackingDetails) => {
    setSelectedOrder(order);
    onOrderSelect?.(order);
  };

  const handleBackToSearch = () => {
    setSelectedOrder(null);
  };

  const clearSearch = () => {
    reset();
    setOrders([]);
    setSelectedOrder(null);
    setError(null);
    setHasSearched(false);
  };

  // If showing order details and an order is selected, show the order tracker
  if (showOrderDetails && selectedOrder) {
    return (
      <div className={className}>
        <div className="mb-4">
          <Button 
            onClick={handleBackToSearch}
            variant="outline"
            className="mb-4"
          >
            ← Back to Search Results
          </Button>
        </div>
        <OrderTracker orderId={selectedOrder.id} />
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Track Your Order
          </CardTitle>
          <p className="text-gray-600">
            Enter your email or phone number to find your orders. You can also include an order number for faster results.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="identifier">Email or Phone Number *</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="email@example.com or (555) 123-4567"
                  {...register('identifier', {
                    required: 'Email or phone number is required',
                    pattern: {
                      value: /^([^\s@]+@[^\s@]+\.[^\s@]+|[\+]?[\d\s\-\(\)]{10,})$/,
                      message: 'Please enter a valid email or phone number'
                    }
                  })}
                  className={errors.identifier ? 'border-red-300' : ''}
                />
                {errors.identifier && (
                  <p className="text-red-600 text-sm mt-1">{errors.identifier.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                <Input
                  id="orderNumber"
                  type="text"
                  placeholder="TBQ-001234"
                  {...register('orderNumber')}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 md:flex-none"
              >
                {loading ? 'Searching...' : 'Find My Orders'}
              </Button>
              
              {(hasSearched || orders.length > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <div className="text-lg font-semibold mb-2">No Orders Found</div>
              <p>{error}</p>
              <p className="text-sm text-gray-600 mt-2">
                Please double-check your email or phone number and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {orders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Your Orders ({orders.length})
            </h2>
          </div>

          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order {order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      <span className="text-lg font-semibold">
                        {formatCurrency(order.payment.total)}
                      </span>
                    </div>
                  </div>

                  {/* Status Message and Estimated Time */}
                  <div className="space-y-2">
                    {order.currentStatusMessage && (
                      <p className="text-gray-700">{order.currentStatusMessage}</p>
                    )}
                    
                    {order.estimatedDeliveryTime && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          Estimated {order.isDelivery ? 'delivery' : 'pickup'}: {formatDateTime(order.estimatedDeliveryTime)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                    {/* Order Type and Items */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span>
                          {order.isDelivery ? 'Delivery' : 'Pickup'}
                          {order.isCatering && ' • Catering Order'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        {order.items.length <= 3 && (
                          <span className="block mt-1">
                            {order.items.map(item => 
                              `${item.quantity}x ${item.title}`
                            ).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact and Address */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{order.customerEmail}</span>
                      </div>
                      
                      {order.customerPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{order.customerPhone}</span>
                        </div>
                      )}

                      {order.deliveryAddress && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span>
                            {order.deliveryAddress.address_1}, {order.deliveryAddress.city}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => handleOrderSelect(order)}
                      className="w-full sm:w-auto"
                    >
                      View Order Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State for No Search Yet */}
      {!hasSearched && !error && orders.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Track Your Troy BBQ Order
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Enter your email or phone number above to see all your recent orders and track their status in real-time.
              </p>
              <div className="flex justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Real-time updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>Order history</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Delivery tracking</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}