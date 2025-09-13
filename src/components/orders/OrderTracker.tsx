import React, { useState, useEffect, useCallback } from 'react';
import type { OrderTrackingDetails, RealTimeOrderUpdate } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { getStatusColor, getStatusLabel, getStatusDescription } from '../../lib/orderTracking';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { OrderTimeline } from './OrderTimeline';
import { Clock, MapPin, Phone, Mail, Package, Truck } from 'lucide-react';

interface OrderTrackerProps {
  orderId: string;
  className?: string;
  showCustomerInfo?: boolean;
}

interface SSEConnectionState {
  connected: boolean;
  error: string | null;
  lastHeartbeat: Date | null;
}

export function OrderTracker({ orderId, className = '', showCustomerInfo = false }: OrderTrackerProps) {
  const [order, setOrder] = useState<OrderTrackingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConnection, setSSEConnection] = useState<SSEConnectionState>({
    connected: false,
    error: null,
    lastHeartbeat: null
  });

  // Fetch initial order data
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/status`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch order');
      }

      const result = await response.json();
      setOrder(result.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        const sseUrl = `/api/orders/stream?orderId=${orderId}`;
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          console.log('SSE connection opened');
          setSSEConnection(prev => ({ ...prev, connected: true, error: null }));
        };

        eventSource.addEventListener('connection', (event) => {
          console.log('SSE connection confirmed:', event.data);
          setSSEConnection(prev => ({ ...prev, connected: true, error: null }));
        });

        eventSource.addEventListener('update', (event) => {
          try {
            const update: RealTimeOrderUpdate = JSON.parse(event.data);
            console.log('Received order update:', update);
            
            if (update.orderId === orderId && update.data) {
              setOrder(prevOrder => {
                if (!prevOrder) return prevOrder;
                
                return {
                  ...prevOrder,
                  ...update.data,
                  // Merge events if they exist
                  events: update.data.events ? 
                    [...prevOrder.events, ...update.data.events] : 
                    prevOrder.events
                };
              });
            }
          } catch (parseError) {
            console.error('Error parsing SSE update:', parseError);
          }
        });

        eventSource.addEventListener('heartbeat', (event) => {
          const heartbeatData = JSON.parse(event.data);
          setSSEConnection(prev => ({ 
            ...prev, 
            lastHeartbeat: new Date(heartbeatData.timestamp) 
          }));
        });

        eventSource.onerror = (event) => {
          console.error('SSE connection error:', event);
          setSSEConnection(prev => ({ 
            ...prev, 
            connected: false, 
            error: 'Connection lost' 
          }));

          // Attempt to reconnect after 5 seconds
          if (eventSource?.readyState === EventSource.CLOSED) {
            reconnectTimeout = setTimeout(() => {
              console.log('Attempting to reconnect SSE...');
              connectSSE();
            }, 5000);
          }
        };

      } catch (error) {
        console.error('Error creating SSE connection:', error);
        setSSEConnection(prev => ({ 
          ...prev, 
          connected: false, 
          error: 'Failed to connect' 
        }));
      }
    };

    // Initial fetch and SSE connection
    fetchOrder();
    connectSSE();

    // Cleanup function
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [orderId, fetchOrder]);

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        sseConnection.connected ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className={sseConnection.connected ? 'text-green-600' : 'text-red-600'}>
        {sseConnection.connected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  );

  // Calculate estimated time remaining
  const getTimeRemaining = (estimatedTime?: Date) => {
    if (!estimatedTime) return null;
    
    const now = new Date();
    const diff = estimatedTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ready now!';
    
    const minutes = Math.ceil(diff / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading order</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrder}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-600">
          Order not found
        </div>
      </Card>
    );
  }

  const timeRemaining = getTimeRemaining(order.estimatedDeliveryTime);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Order Header */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Order {order.orderNumber}
            </h2>
            <Badge className={`${getStatusColor(order.status)} px-3 py-1`}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <ConnectionStatus />
        </div>

        {/* Status Description */}
        <p className="text-gray-600 mb-4">
          {order.currentStatusMessage || getStatusDescription(order.status)}
        </p>

        {/* Estimated Time */}
        {order.estimatedDeliveryTime && (
          <div className="flex items-center gap-2 text-lg font-semibold text-blue-600 mb-4">
            <Clock className="w-5 h-5" />
            <span>
              {timeRemaining} 
              <span className="text-sm font-normal text-gray-500 ml-2">
                (by {formatDateTime(order.estimatedDeliveryTime)})
              </span>
            </span>
          </div>
        )}

        {/* Order Type and Delivery Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            {order.isDelivery ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            <span>{order.isDelivery ? 'Delivery' : 'Pickup'}</span>
          </div>
          {order.isCatering && (
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 text-center">🍽️</span>
              <span>Catering Order</span>
            </div>
          )}
        </div>
      </Card>

      {/* Order Timeline */}
      <OrderTimeline 
        events={order.events} 
        currentStatus={order.status}
        estimatedTime={order.estimatedDeliveryTime}
      />

      {/* Order Items */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={item.id || index} className="flex items-center gap-4 py-2 border-b last:border-b-0">
              {item.thumbnail && (
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium">{item.title}</h4>
                {item.variant_title && (
                  <p className="text-sm text-gray-600">{item.variant_title}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.payment.total)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Payment Status</span>
            <Badge className={`px-2 py-1 ${
              order.payment.paymentStatus === 'paid' 
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {order.payment.paymentStatus}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Customer Information (if enabled) */}
      {showCustomerInfo && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{order.customerEmail}</span>
            </div>
            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Delivery Address */}
      {order.deliveryAddress && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-1" />
            <div>
              <p className="font-medium">{order.deliveryAddress.name}</p>
              <p>{order.deliveryAddress.address_1}</p>
              {order.deliveryAddress.address_2 && (
                <p>{order.deliveryAddress.address_2}</p>
              )}
              <p>
                {order.deliveryAddress.city}, {order.deliveryAddress.province} {order.deliveryAddress.postal_code}
              </p>
              {order.deliveryAddress.phone && (
                <p className="text-gray-600">{order.deliveryAddress.phone}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Catering Details */}
      {order.isCatering && order.cateringDetails && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Catering Details</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Event Date:</span>
              <span className="ml-2 font-medium">
                {formatDateTime(order.cateringDetails.eventDate)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Guest Count:</span>
              <span className="ml-2 font-medium">{order.cateringDetails.guestCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Event Type:</span>
              <span className="ml-2 font-medium capitalize">
                {order.cateringDetails.eventType}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}