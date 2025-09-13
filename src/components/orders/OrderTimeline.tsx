import React from 'react';
import type { OrderStatusEvent, OrderStatus } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { getStatusColor, getStatusLabel, STATUS_CONFIG } from '../../lib/orderTracking';
import { Card } from '../ui/Card';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Package, 
  Truck, 
  CheckCircle2, 
  X,
  Circle
} from 'lucide-react';

interface OrderTimelineProps {
  events: OrderStatusEvent[];
  currentStatus: OrderStatus;
  estimatedTime?: Date;
  className?: string;
}

// Status icon mapping
const StatusIcon = ({ status }: { status: OrderStatus }) => {
  const iconClass = "w-5 h-5";
  
  switch (status) {
    case 'pending':
      return <Clock className={iconClass} />;
    case 'confirmed':
      return <CheckCircle className={iconClass} />;
    case 'preparing':
      return <ChefHat className={iconClass} />;
    case 'ready':
      return <Package className={iconClass} />;
    case 'out_for_delivery':
      return <Truck className={iconClass} />;
    case 'delivered':
      return <CheckCircle2 className={iconClass} />;
    case 'cancelled':
      return <X className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
};

// Get the complete status progression
const getStatusProgression = (currentStatus: OrderStatus): { status: OrderStatus; completed: boolean }[] => {
  const allStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  const currentIndex = allStatuses.indexOf(currentStatus);
  
  if (currentStatus === 'cancelled') {
    return [{ status: 'cancelled', completed: true }];
  }
  
  return allStatuses.map((status, index) => ({
    status,
    completed: index <= currentIndex
  }));
};

export function OrderTimeline({ events, currentStatus, estimatedTime, className = '' }: OrderTimelineProps) {
  const statusProgression = getStatusProgression(currentStatus);
  
  // Group events by status for easier rendering
  const eventsByStatus = events.reduce((acc, event) => {
    if (!acc[event.status]) {
      acc[event.status] = [];
    }
    acc[event.status].push(event);
    return acc;
  }, {} as Record<OrderStatus, OrderStatusEvent[]>);

  // Sort events by timestamp (newest first)
  Object.keys(eventsByStatus).forEach(status => {
    eventsByStatus[status as OrderStatus].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-6">Order Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {statusProgression.map(({ status, completed }, index) => {
            const statusEvents = eventsByStatus[status] || [];
            const config = STATUS_CONFIG[status];
            const isCurrentStatus = status === currentStatus;
            const isFutureStatus = !completed && status !== currentStatus;
            
            return (
              <div key={status} className="relative">
                {/* Timeline Node */}
                <div className={`
                  absolute left-4 w-4 h-4 rounded-full border-2 z-10
                  ${completed 
                    ? 'bg-green-500 border-green-500' 
                    : isCurrentStatus 
                      ? 'bg-blue-500 border-blue-500 animate-pulse' 
                      : 'bg-gray-200 border-gray-300'
                  }
                `}></div>
                
                {/* Status Content */}
                <div className="ml-12">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`
                      p-2 rounded-full
                      ${completed 
                        ? 'bg-green-100 text-green-600' 
                        : isCurrentStatus 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-400'
                      }
                    `}>
                      <StatusIcon status={status} />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        completed 
                          ? 'text-gray-900' 
                          : isCurrentStatus 
                            ? 'text-blue-600' 
                            : 'text-gray-400'
                      }`}>
                        {getStatusLabel(status)}
                      </h4>
                      
                      {config && (
                        <p className={`text-sm ${
                          completed || isCurrentStatus 
                            ? 'text-gray-600' 
                            : 'text-gray-400'
                        }`}>
                          {config.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    {completed && (
                      <div className="text-xs text-green-600 font-medium">
                        ✓ Complete
                      </div>
                    )}
                    {isCurrentStatus && (
                      <div className="text-xs text-blue-600 font-medium">
                        Current
                      </div>
                    )}
                  </div>
                  
                  {/* Events for this status */}
                  {statusEvents.length > 0 && (
                    <div className="ml-12 space-y-2">
                      {statusEvents.map((event, eventIndex) => (
                        <div key={event.id || eventIndex} className="py-2 border-l-2 border-gray-100 pl-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              {event.message && (
                                <p className="text-sm text-gray-700 font-medium">
                                  {event.message}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                {formatDateTime(event.timestamp)}
                              </p>
                              {event.estimatedTime && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Estimated: {formatDateTime(event.estimatedTime)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Location info if available */}
                          {event.location && (
                            <div className="mt-2 text-xs text-gray-600">
                              {event.location.address && (
                                <p>📍 {event.location.address}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Estimated time for current status */}
                  {isCurrentStatus && estimatedTime && !statusEvents.length && (
                    <div className="ml-12 py-2">
                      <p className="text-sm text-blue-600">
                        Estimated completion: {formatDateTime(estimatedTime)}
                      </p>
                    </div>
                  )}
                  
                  {/* Future status placeholder */}
                  {isFutureStatus && (
                    <div className="ml-12 py-2">
                      <p className="text-sm text-gray-400">
                        Pending...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>
            {statusProgression.filter(s => s.completed).length} of {statusProgression.length} steps
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${(statusProgression.filter(s => s.completed).length / statusProgression.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>
    </Card>
  );
}