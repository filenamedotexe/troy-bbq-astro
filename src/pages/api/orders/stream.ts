import type { APIRoute } from 'astro';
import { orderEventEmitter } from '../../../lib/orderTracking';
import type { RealTimeOrderUpdate } from '../../../types';

/**
 * Server-Sent Events endpoint for real-time order updates
 * Provides live status updates to customers and admin interfaces
 */
export const GET: APIRoute = async ({ request, url }) => {
  const searchParams = new URL(request.url).searchParams;
  const orderId = searchParams.get('orderId');
  const adminMode = searchParams.get('admin') === 'true';

  // Create a readable stream for SSE
  const body = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection confirmation
      const sendEvent = (data: any, eventType: string = 'message') => {
        const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      };

      // Send connection confirmation
      sendEvent({ 
        type: 'connected', 
        timestamp: new Date().toISOString(),
        orderId,
        adminMode 
      }, 'connection');

      // Handle real-time order updates
      const handleUpdate = (update: RealTimeOrderUpdate) => {
        // Filter updates based on connection type
        if (orderId && update.orderId !== orderId) {
          return; // Only send updates for the specific order
        }

        sendEvent({
          type: update.type,
          orderId: update.orderId,
          data: update.data,
          timestamp: update.timestamp.toISOString()
        }, 'update');
      };

      // Subscribe to order updates
      if (orderId) {
        // Subscribe to specific order updates
        orderEventEmitter.subscribe(orderId, handleUpdate);
      } else if (adminMode) {
        // Subscribe to all order updates for admin interface
        orderEventEmitter.subscribeToAll(handleUpdate);
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        try {
          if (orderId) {
            orderEventEmitter.unsubscribe(orderId, handleUpdate);
          } else if (adminMode) {
            // Remove from global listeners - would need to implement this in the event emitter
          }
          controller.close();
        } catch (error) {
          console.error('Error cleaning up SSE connection:', error);
        }
      });

      // Send periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          sendEvent({ 
            type: 'heartbeat', 
            timestamp: new Date().toISOString() 
          }, 'heartbeat');
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000); // 30 seconds

      // Clean up heartbeat on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
      });
    },

    cancel() {
      // Additional cleanup if needed
      console.log('SSE stream cancelled');
    }
  });

  // Return response with proper SSE headers
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
};

// Handle preflight requests for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
      'Access-Control-Max-Age': '86400',
    },
  });
};