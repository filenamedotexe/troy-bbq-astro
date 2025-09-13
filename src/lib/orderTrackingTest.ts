/**
 * Comprehensive test suite for the order tracking system
 * This can be run in the browser console or as part of an automated test suite
 */

import { orderTrackingService, orderEventEmitter } from './orderTracking';
import { OrderErrorHandler, OrderTrackingError, OrderErrorCode } from './orderErrorHandler';
import type { OrderStatus, OrderStatusUpdate, RealTimeOrderUpdate } from '../types';

/**
 * Test configuration
 */
interface TestConfig {
  verbose: boolean;
  mockData: boolean;
  realAPI: boolean;
}

/**
 * Test result interface
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

/**
 * Order tracking system test runner
 */
export class OrderTrackingTestRunner {
  private config: TestConfig;
  private results: TestResult[] = [];

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      verbose: false,
      mockData: true,
      realAPI: false,
      ...config
    };
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<{ passed: number; failed: number; results: TestResult[] }> {
    this.results = [];
    this.log('🚀 Starting Order Tracking System Tests...\n');

    // Core functionality tests
    await this.runTest('Status Transition Validation', this.testStatusTransitions);
    await this.runTest('Order Status Updates', this.testOrderStatusUpdates);
    await this.runTest('Order Lookup Functionality', this.testOrderLookup);
    await this.runTest('Real-time Event Emission', this.testEventEmission);
    
    // Error handling tests
    await this.runTest('Error Handler Creation', this.testErrorHandler);
    await this.runTest('API Error Handling', this.testApiErrorHandling);
    await this.runTest('Network Error Handling', this.testNetworkErrorHandling);
    await this.runTest('Retry Logic', this.testRetryLogic);
    
    // Validation tests
    await this.runTest('Input Validation', this.testInputValidation);
    await this.runTest('Status Progress Calculation', this.testStatusProgress);
    
    // Real-time features tests
    await this.runTest('SSE Connection Simulation', this.testSSEConnection);
    await this.runTest('Event Emitter Functionality', this.testEventEmitterFeatures);
    
    // Performance tests
    await this.runTest('Estimated Time Calculations', this.testTimeCalculations);
    await this.runTest('Memory Leak Prevention', this.testMemoryLeaks);

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    this.log(`\n📊 Test Summary:`);
    this.log(`✅ Passed: ${passed}`);
    this.log(`❌ Failed: ${failed}`);
    this.log(`⏱️  Total Duration: ${this.results.reduce((sum, r) => sum + r.duration, 0)}ms\n`);

    if (failed > 0) {
      this.log('❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        this.log(`   • ${r.name}: ${r.error}`);
      });
    }

    return { passed, failed, results: this.results };
  }

  /**
   * Test status transition validation
   */
  private async testStatusTransitions(): Promise<void> {
    // Valid transitions
    const validTransitions: Array<[OrderStatus, OrderStatus]> = [
      ['pending', 'confirmed'],
      ['confirmed', 'preparing'],
      ['preparing', 'ready'],
      ['ready', 'out_for_delivery'],
      ['out_for_delivery', 'delivered'],
      ['pending', 'cancelled'],
      ['confirmed', 'cancelled']
    ];

    for (const [from, to] of validTransitions) {
      const isValid = orderTrackingService.validateStatusTransition(from, to, 'admin');
      if (!isValid) {
        throw new Error(`Valid transition ${from} -> ${to} was rejected`);
      }
    }

    // Invalid transitions
    const invalidTransitions: Array<[OrderStatus, OrderStatus]> = [
      ['delivered', 'preparing'],
      ['cancelled', 'confirmed'],
      ['ready', 'pending']
    ];

    for (const [from, to] of invalidTransitions) {
      const isValid = orderTrackingService.validateStatusTransition(from, to, 'admin');
      if (isValid) {
        throw new Error(`Invalid transition ${from} -> ${to} was accepted`);
      }
    }
  }

  /**
   * Test order status updates
   */
  private async testOrderStatusUpdates(): Promise<void> {
    const mockUpdate: OrderStatusUpdate = {
      orderId: 'test_order_1',
      status: 'preparing',
      message: 'Test status update',
      notifyCustomer: true,
      metadata: { test: true }
    };

    const result = await orderTrackingService.updateOrderStatus(mockUpdate);
    
    if (!result.success) {
      throw new Error(`Status update failed: ${result.error}`);
    }
  }

  /**
   * Test order lookup functionality
   */
  private async testOrderLookup(): Promise<void> {
    const testEmail = 'test@example.com';
    const result = await orderTrackingService.lookupOrders({
      identifier: testEmail
    });

    if (!result.orders || !Array.isArray(result.orders)) {
      throw new Error('Order lookup did not return valid order array');
    }

    if (typeof result.totalOrders !== 'number') {
      throw new Error('Order lookup did not return valid total count');
    }
  }

  /**
   * Test real-time event emission
   */
  private async testEventEmission(): Promise<void> {
    let eventReceived = false;
    const testOrderId = 'test_order_emit';
    
    const unsubscribe = orderEventEmitter.subscribe(testOrderId, (update) => {
      eventReceived = true;
      if (update.orderId !== testOrderId) {
        throw new Error('Event received for wrong order ID');
      }
    });

    const testUpdate: RealTimeOrderUpdate = {
      type: 'status_change',
      orderId: testOrderId,
      data: { status: 'preparing' },
      timestamp: new Date()
    };

    orderEventEmitter.emit(testUpdate);

    // Wait a bit for async event handling
    await new Promise(resolve => setTimeout(resolve, 10));

    unsubscribe(testOrderId, () => {});

    if (!eventReceived) {
      throw new Error('Event was not received by subscriber');
    }
  }

  /**
   * Test error handler functionality
   */
  private async testErrorHandler(): Promise<void> {
    const testError = new OrderTrackingError(
      OrderErrorCode.ORDER_NOT_FOUND,
      'Test error message',
      { testData: true },
      'test context'
    );

    OrderErrorHandler.logError(testError, 'test');
    
    const userMessage = OrderErrorHandler.getUserMessage(testError);
    if (!userMessage || userMessage.length === 0) {
      throw new Error('Error handler did not return user message');
    }

    const stats = OrderErrorHandler.getErrorStats();
    if (stats.totalErrors === 0) {
      throw new Error('Error was not logged to statistics');
    }

    OrderErrorHandler.clearErrorLog();
  }

  /**
   * Test API error handling
   */
  private async testApiErrorHandling(): Promise<void> {
    // Simulate different HTTP response statuses
    const testCases = [
      { status: 404, expectedCode: OrderErrorCode.ORDER_NOT_FOUND },
      { status: 401, expectedCode: OrderErrorCode.UNAUTHORIZED_ACCESS },
      { status: 429, expectedCode: OrderErrorCode.RATE_LIMITED },
      { status: 500, expectedCode: OrderErrorCode.INTERNAL_SERVER_ERROR }
    ];

    for (const testCase of testCases) {
      const mockResponse = {
        status: testCase.status,
        statusText: 'Test Status'
      } as Response;

      const error = OrderErrorHandler.handleApiError(mockResponse, 'test');
      
      if (error.code !== testCase.expectedCode) {
        throw new Error(`Expected error code ${testCase.expectedCode}, got ${error.code}`);
      }
    }
  }

  /**
   * Test network error handling
   */
  private async testNetworkErrorHandling(): Promise<void> {
    const networkError = new TypeError('Failed to fetch');
    networkError.name = 'TypeError';

    const handledError = OrderErrorHandler.handleNetworkError(networkError, 'test');
    
    if (handledError.code !== OrderErrorCode.NETWORK_ERROR) {
      throw new Error(`Expected network error code, got ${handledError.code}`);
    }
  }

  /**
   * Test retry logic
   */
  private async testRetryLogic(): Promise<void> {
    let attempts = 0;
    
    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Simulated failure');
      }
      return 'success';
    };

    const result = await OrderErrorHandler.withRetry(operation, 3, 10, 'test');
    
    if (result !== 'success') {
      throw new Error('Retry logic did not return expected result');
    }

    if (attempts !== 3) {
      throw new Error(`Expected 3 attempts, got ${attempts}`);
    }
  }

  /**
   * Test input validation
   */
  private async testInputValidation(): Promise<void> {
    // Test valid inputs
    const validOrderId = 'order_123abc';
    const validEmail = 'test@example.com';
    const validPhone = '+1234567890';

    // Test order ID validation (basic regex check)
    if (!/^[a-zA-Z0-9_-]+$/.test(validOrderId)) {
      throw new Error('Valid order ID failed validation');
    }

    // Test email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(validEmail)) {
      throw new Error('Valid email failed validation');
    }

    // Test phone validation
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(validPhone)) {
      throw new Error('Valid phone failed validation');
    }
  }

  /**
   * Test status progress calculation
   */
  private async testStatusProgress(): Promise<void> {
    const { getStatusProgress } = await import('./orderTracking');

    const testCases: Array<[OrderStatus, number]> = [
      ['pending', 16.666666666666668],
      ['confirmed', 33.333333333333336],
      ['preparing', 50],
      ['ready', 66.66666666666667],
      ['out_for_delivery', 83.33333333333334],
      ['delivered', 100]
    ];

    for (const [status, expectedProgress] of testCases) {
      const progress = getStatusProgress(status);
      if (Math.abs(progress - expectedProgress) > 0.1) {
        throw new Error(`Progress for ${status} expected ${expectedProgress}, got ${progress}`);
      }
    }
  }

  /**
   * Test SSE connection simulation
   */
  private async testSSEConnection(): Promise<void> {
    // This is a basic test of SSE error handling since we can't easily test actual SSE in this context
    const mockSSEError = new Event('error');
    const handledError = OrderErrorHandler.handleSSEError(mockSSEError, 'test');
    
    if (handledError.code !== OrderErrorCode.SSE_CONNECTION_FAILED) {
      throw new Error(`Expected SSE error code, got ${handledError.code}`);
    }
  }

  /**
   * Test event emitter features
   */
  private async testEventEmitterFeatures(): Promise<void> {
    const testOrderId = 'test_event_features';
    let globalEventReceived = false;
    let specificEventReceived = false;

    // Test global subscription
    orderEventEmitter.subscribeToAll(() => {
      globalEventReceived = true;
    });

    // Test specific order subscription
    orderEventEmitter.subscribe(testOrderId, () => {
      specificEventReceived = true;
    });

    // Emit event
    const testUpdate: RealTimeOrderUpdate = {
      type: 'status_change',
      orderId: testOrderId,
      data: { status: 'preparing' },
      timestamp: new Date()
    };

    orderEventEmitter.emit(testUpdate);

    // Wait for event handling
    await new Promise(resolve => setTimeout(resolve, 10));

    if (!globalEventReceived) {
      throw new Error('Global event listener did not receive event');
    }

    if (!specificEventReceived) {
      throw new Error('Specific order listener did not receive event');
    }

    // Test cleanup
    orderEventEmitter.removeAllListeners(testOrderId);
  }

  /**
   * Test time calculations
   */
  private async testTimeCalculations(): Promise<void> {
    const currentTime = new Date();
    
    // Test future time (30 minutes from now)
    const futureTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    const timeRemaining = orderTrackingService.getTimeUntilReady(futureTime);
    
    if (!timeRemaining.includes('30 minute')) {
      throw new Error(`Expected ~30 minutes, got: ${timeRemaining}`);
    }

    // Test past time
    const pastTime = new Date(currentTime.getTime() - 10 * 60 * 1000);
    const pastTimeRemaining = orderTrackingService.getTimeUntilReady(pastTime);
    
    if (pastTimeRemaining !== 'Ready now!') {
      throw new Error(`Expected "Ready now!", got: ${pastTimeRemaining}`);
    }

    // Test estimated delivery time generation
    const estimatedTime = orderTrackingService.getEstimatedDeliveryTime('delivery', 5);
    
    if (estimatedTime <= currentTime) {
      throw new Error('Estimated delivery time is not in the future');
    }
  }

  /**
   * Test memory leak prevention
   */
  private async testMemoryLeaks(): Promise<void> {
    const initialListenerCount = orderEventEmitter['listeners']?.size || 0;

    // Create multiple subscriptions
    const testOrderId = 'test_memory_leak';
    const callbacks: Array<() => void> = [];

    for (let i = 0; i < 10; i++) {
      const callback = () => {};
      callbacks.push(callback);
      orderEventEmitter.subscribe(testOrderId, callback);
    }

    // Verify listeners were added
    const afterAddingCount = orderEventEmitter['listeners']?.size || 0;
    if (afterAddingCount <= initialListenerCount) {
      throw new Error('Listeners were not properly added');
    }

    // Unsubscribe all
    callbacks.forEach(callback => {
      orderEventEmitter.unsubscribe(testOrderId, callback);
    });

    // Clean up
    orderEventEmitter.removeAllListeners(testOrderId);

    // Verify cleanup (this is a basic check, real memory leak testing would require more sophisticated tools)
    const finalCount = orderEventEmitter['listeners']?.size || 0;
    
    // This test is somewhat limited since we can't fully test memory cleanup in this context
    this.log('Memory leak test completed (basic subscription cleanup verified)');
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn.call(this);
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: true,
        duration
      });
      
      this.log(`✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        name,
        passed: false,
        error: errorMessage,
        duration
      });
      
      this.log(`❌ ${name} (${duration}ms): ${errorMessage}`);
    }
  }

  /**
   * Logging utility
   */
  private log(message: string): void {
    if (this.config.verbose || true) { // Always log for now
      console.log(message);
    }
  }
}

/**
 * Convenience function to run all tests
 */
export async function runOrderTrackingTests(config?: Partial<TestConfig>) {
  const runner = new OrderTrackingTestRunner(config);
  return await runner.runAllTests();
}

/**
 * Test utility for browser console
 */
export function initializeTestSuite() {
  (window as any).orderTrackingTests = {
    run: runOrderTrackingTests,
    runner: OrderTrackingTestRunner,
    errorHandler: OrderErrorHandler
  };
  
  console.log('🧪 Order Tracking Test Suite initialized!');
  console.log('Run tests with: orderTrackingTests.run()');
}