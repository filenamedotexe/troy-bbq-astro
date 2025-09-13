import type { 
  OrderTrackingDetails, 
  OrderStatus, 
  OrderStatusEvent, 
  OrderStatusUpdate, 
  OrderLookupInput, 
  OrderLookupResponse, 
  AdminOrderFilters, 
  AdminOrderListResponse, 
  RealTimeOrderUpdate,
  OrderStatusTransition
} from '../types';

// Order status transition configuration
export const ORDER_STATUS_TRANSITIONS: OrderStatusTransition[] = [
  {
    from: 'pending',
    to: 'confirmed',
    allowedRoles: ['admin', 'staff', 'system'],
    requiresEstimatedTime: true
  },
  {
    from: 'confirmed',
    to: 'preparing',
    allowedRoles: ['admin', 'staff', 'system'],
    autoAdvance: {
      afterMinutes: 5,
      conditions: ['payment_confirmed']
    }
  },
  {
    from: 'preparing',
    to: 'ready',
    allowedRoles: ['admin', 'staff'],
    requiresEstimatedTime: true
  },
  {
    from: 'ready',
    to: 'out_for_delivery',
    allowedRoles: ['admin', 'staff'],
    requiresEstimatedTime: true
  },
  {
    from: 'out_for_delivery',
    to: 'delivered',
    allowedRoles: ['admin', 'staff'],
    autoAdvance: {
      afterMinutes: 60,
      conditions: ['delivery_confirmed']
    }
  },
  {
    from: 'pending',
    to: 'cancelled',
    allowedRoles: ['admin', 'staff']
  },
  {
    from: 'confirmed',
    to: 'cancelled',
    allowedRoles: ['admin', 'staff']
  }
];

// Status display configuration
export const STATUS_CONFIG = {
  pending: {
    label: 'Order Received',
    color: 'bg-gray-100 text-gray-700',
    icon: 'Clock',
    description: 'Your order has been received and is being processed'
  },
  confirmed: {
    label: 'Order Confirmed',
    color: 'bg-blue-100 text-blue-700',
    icon: 'CheckCircle',
    description: 'Your order has been confirmed and payment processed'
  },
  preparing: {
    label: 'Preparing',
    color: 'bg-yellow-100 text-yellow-700',
    icon: 'ChefHat',
    description: 'Our team is preparing your delicious BBQ'
  },
  ready: {
    label: 'Ready',
    color: 'bg-green-100 text-green-700',
    icon: 'Package',
    description: 'Your order is ready for pickup or delivery'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-purple-100 text-purple-700',
    icon: 'Truck',
    description: 'Your order is on its way to you'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-700',
    icon: 'CheckCircle2',
    description: 'Your order has been delivered. Enjoy!'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700',
    icon: 'X',
    description: 'This order has been cancelled'
  }
} as const;

// Event emitter for real-time updates
class OrderEventEmitter {
  private listeners: Map<string, ((update: RealTimeOrderUpdate) => void)[]> = new Map();

  subscribe(orderId: string, callback: (update: RealTimeOrderUpdate) => void) {
    if (!this.listeners.has(orderId)) {
      this.listeners.set(orderId, []);
    }
    this.listeners.get(orderId)!.push(callback);
  }

  subscribeToAll(callback: (update: RealTimeOrderUpdate) => void) {
    if (!this.listeners.has('*')) {
      this.listeners.set('*', []);
    }
    this.listeners.get('*')!.push(callback);
  }

  unsubscribe(orderId: string, callback: (update: RealTimeOrderUpdate) => void) {
    const orderListeners = this.listeners.get(orderId);
    if (orderListeners) {
      const index = orderListeners.indexOf(callback);
      if (index > -1) {
        orderListeners.splice(index, 1);
      }
    }
  }

  emit(update: RealTimeOrderUpdate) {
    // Emit to specific order listeners
    const orderListeners = this.listeners.get(update.orderId);
    if (orderListeners) {
      orderListeners.forEach(callback => callback(update));
    }

    // Emit to global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => callback(update));
    }
  }

  removeAllListeners(orderId?: string) {
    if (orderId) {
      this.listeners.delete(orderId);
    } else {
      this.listeners.clear();
    }
  }
}

export const orderEventEmitter = new OrderEventEmitter();

/**
 * Order Tracking Service
 * Handles order status management, real-time updates, and MedusaJS integration
 */
export class OrderTrackingService {
  private static instance: OrderTrackingService;

  static getInstance(): OrderTrackingService {
    if (!OrderTrackingService.instance) {
      OrderTrackingService.instance = new OrderTrackingService();
    }
    return OrderTrackingService.instance;
  }

  /**
   * Validate if a status transition is allowed
   */
  validateStatusTransition(from: OrderStatus, to: OrderStatus, userRole: string): boolean {
    const transition = ORDER_STATUS_TRANSITIONS.find(t => t.from === from && t.to === to);
    if (!transition) return false;
    
    return transition.allowedRoles.includes(userRole as any);
  }

  /**
   * Get the next allowed statuses for a given current status
   */
  getNextAllowedStatuses(currentStatus: OrderStatus, userRole: string): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS
      .filter(t => t.from === currentStatus && t.allowedRoles.includes(userRole as any))
      .map(t => t.to);
  }

  /**
   * Update order status with proper validation and event emission
   */
  async updateOrderStatus(update: OrderStatusUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      // Here you would integrate with your actual database/MedusaJS backend
      // For now, we'll simulate the database update

      // Validate the status transition (assuming admin role for now)
      const currentOrder = await this.getOrderById(update.orderId);
      if (!currentOrder) {
        return { success: false, error: 'Order not found' };
      }

      if (!this.validateStatusTransition(currentOrder.status, update.status, 'admin')) {
        return { success: false, error: 'Invalid status transition' };
      }

      // Create status event
      const statusEvent: OrderStatusEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId: update.orderId,
        status: update.status,
        message: update.message,
        timestamp: new Date(),
        estimatedTime: update.estimatedTime,
        metadata: update.metadata
      };

      // Update order in database (simulated)
      await this.saveStatusEvent(statusEvent);
      await this.updateOrderInDatabase(update.orderId, {
        status: update.status,
        currentStatusMessage: update.message,
        estimatedDeliveryTime: update.estimatedTime,
        updatedAt: new Date()
      });

      // Emit real-time update
      const realTimeUpdate: RealTimeOrderUpdate = {
        type: 'status_change',
        orderId: update.orderId,
        data: {
          status: update.status,
          currentStatusMessage: update.message,
          estimatedDeliveryTime: update.estimatedTime,
          events: [statusEvent]
        },
        timestamp: new Date()
      };

      orderEventEmitter.emit(realTimeUpdate);

      // Send customer notification if requested
      if (update.notifyCustomer) {
        await this.sendCustomerNotification(update.orderId, statusEvent);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Failed to update order status' };
    }
  }

  /**
   * Lookup orders by customer email or phone
   */
  async lookupOrders(input: OrderLookupInput): Promise<OrderLookupResponse> {
    try {
      // In a real implementation, this would query your database
      // For now, we'll return mock data
      
      const mockOrders: OrderTrackingDetails[] = [
        {
          id: 'order_1',
          orderNumber: 'TBQ-001234',
          customerEmail: input.identifier.includes('@') ? input.identifier : 'customer@example.com',
          customerPhone: !input.identifier.includes('@') ? input.identifier : '+1234567890',
          status: 'preparing',
          currentStatusMessage: 'Your BBQ is being prepared by our pit masters',
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
          events: [
            {
              id: 'event_1',
              orderId: 'order_1',
              status: 'pending',
              message: 'Order received',
              timestamp: new Date(Date.now() - 20 * 60 * 1000),
              metadata: {}
            },
            {
              id: 'event_2',
              orderId: 'order_1',
              status: 'confirmed',
              message: 'Payment confirmed, order approved',
              timestamp: new Date(Date.now() - 15 * 60 * 1000),
              metadata: {}
            },
            {
              id: 'event_3',
              orderId: 'order_1',
              status: 'preparing',
              message: 'Your BBQ is being prepared by our pit masters',
              timestamp: new Date(Date.now() - 10 * 60 * 1000),
              estimatedTime: new Date(Date.now() + 45 * 60 * 1000),
              metadata: {}
            }
          ],
          items: [
            {
              id: 'item_1',
              title: 'Brisket Plate',
              quantity: 2,
              variant_title: 'Regular',
              thumbnail: '/images/brisket.jpg'
            },
            {
              id: 'item_2',
              title: 'Mac & Cheese',
              quantity: 2,
              variant_title: 'Large',
              thumbnail: '/images/mac-cheese.jpg'
            }
          ],
          deliveryAddress: {
            name: 'John Doe',
            address_1: '123 Main St',
            city: 'Austin',
            province: 'TX',
            postal_code: '78701',
            phone: '+1234567890'
          },
          payment: {
            total: 4580, // $45.80 in cents
            currency: 'USD',
            paymentStatus: 'paid'
          },
          createdAt: new Date(Date.now() - 20 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 60 * 1000),
          isDelivery: true,
          isCatering: false
        }
      ];

      // Filter by order number if provided
      let filteredOrders = mockOrders;
      if (input.orderNumber) {
        filteredOrders = mockOrders.filter(order => 
          order.orderNumber.toLowerCase().includes(input.orderNumber!.toLowerCase())
        );
      }

      return {
        orders: filteredOrders,
        totalOrders: filteredOrders.length
      };
    } catch (error) {
      console.error('Error looking up orders:', error);
      throw new Error('Failed to lookup orders');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderTrackingDetails | null> {
    try {
      // In a real implementation, this would query your database
      // For demonstration, we'll return a mock order
      
      if (orderId === 'order_1') {
        return {
          id: 'order_1',
          orderNumber: 'TBQ-001234',
          customerEmail: 'customer@example.com',
          customerPhone: '+1234567890',
          status: 'preparing',
          currentStatusMessage: 'Your BBQ is being prepared by our pit masters',
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
          events: [],
          items: [],
          payment: {
            total: 4580,
            currency: 'USD',
            paymentStatus: 'paid'
          },
          createdAt: new Date(Date.now() - 20 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 60 * 1000),
          isDelivery: true,
          isCatering: false
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  }

  /**
   * Get orders with admin filters
   */
  async getOrdersWithFilters(filters: AdminOrderFilters): Promise<AdminOrderListResponse> {
    try {
      // In a real implementation, this would query your database with filters
      // For demonstration, we'll return mock data
      
      const mockOrders: OrderTrackingDetails[] = [
        // Mock orders would be generated here based on filters
      ];

      const statusCounts: Record<OrderStatus, number> = {
        pending: 5,
        confirmed: 3,
        preparing: 8,
        ready: 2,
        out_for_delivery: 4,
        delivered: 25,
        cancelled: 1
      };

      return {
        orders: mockOrders,
        totalCount: mockOrders.length,
        statusCounts,
        filters
      };
    } catch (error) {
      console.error('Error getting orders with filters:', error);
      throw new Error('Failed to get orders');
    }
  }

  /**
   * Get estimated delivery time based on current load and order type
   */
  getEstimatedDeliveryTime(orderType: 'pickup' | 'delivery' | 'catering', currentLoad: number = 0): Date {
    const baseMinutes = {
      pickup: 20,
      delivery: 45,
      catering: 120
    };

    const loadMultiplier = Math.max(1, currentLoad * 0.1);
    const estimatedMinutes = Math.ceil(baseMinutes[orderType] * loadMultiplier);
    
    return new Date(Date.now() + estimatedMinutes * 60 * 1000);
  }

  /**
   * Calculate time until order is ready
   */
  getTimeUntilReady(estimatedTime?: Date): string {
    if (!estimatedTime) return 'Calculating...';
    
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
  }

  // Private helper methods
  private async saveStatusEvent(event: OrderStatusEvent): Promise<void> {
    // In a real implementation, save to database
    console.log('Saving status event:', event);
  }

  private async updateOrderInDatabase(orderId: string, updates: Partial<OrderTrackingDetails>): Promise<void> {
    // In a real implementation, update in database
    console.log('Updating order in database:', orderId, updates);
  }

  private async sendCustomerNotification(orderId: string, event: OrderStatusEvent): Promise<void> {
    // In a real implementation, send SMS/email notification
    console.log('Sending customer notification:', orderId, event);
  }
}

// Export singleton instance
export const orderTrackingService = OrderTrackingService.getInstance();

// Utility functions for order status management
export function getStatusProgress(status: OrderStatus): number {
  const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  const index = statusOrder.indexOf(status);
  return index >= 0 ? ((index + 1) / statusOrder.length) * 100 : 0;
}

export function isStatusActive(status: OrderStatus): boolean {
  return !['delivered', 'cancelled'].includes(status);
}

export function canTransitionTo(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS.some(t => t.from === fromStatus && t.to === toStatus);
}

export function getStatusColor(status: OrderStatus): string {
  return STATUS_CONFIG[status]?.color || 'bg-gray-100 text-gray-700';
}

export function getStatusLabel(status: OrderStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}

export function getStatusDescription(status: OrderStatus): string {
  return STATUS_CONFIG[status]?.description || '';
}

// Export standalone function that uses the service
export function getNextAllowedStatuses(currentStatus: OrderStatus, userRole: string): OrderStatus[] {
  return orderTrackingService.getNextAllowedStatuses(currentStatus, userRole);
}