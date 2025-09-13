import React, { useState } from 'react';
import { ArrowLeft, CreditCard, MapPin, User, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { formatCurrency } from '../../lib/utils';
import PaymentProvider from '../payments/PaymentProvider';
import AppProviders from '../providers/AppProviders';
import { useCart } from '../../contexts/CartContext';
import type { PaymentResult } from '../../lib/payments';

function CheckoutContent() {
  const { cart, isLoading, getTotalItems, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'success'>('details');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: ''
  });
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const totalItems = getTotalItems();
  const totalAmount = cart?.total ? cart.total / 100 : 0; // Convert from cents to dollars

  const handleBackToCart = () => {
    window.location.href = '/cart';
  };

  const handleContinueToPayment = () => {
    // Validate customer information
    const requiredFields = ['firstName', 'lastName', 'email', 'address1', 'city', 'state', 'zip'];
    const missingFields = requiredFields.filter(field => !customerInfo[field as keyof typeof customerInfo]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    setCurrentStep('success');
    
    // In a real app, you would:
    // 1. Create the order in your backend
    // 2. Clear the cart
    // 3. Send confirmation email
    // 4. Redirect to order confirmation page
    
    // For demo, just clear the cart after a delay
    setTimeout(() => {
      clearCart();
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  const handleInputChange = (field: keyof typeof customerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading && !cart) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-64 bg-gray-300 rounded-lg"></div>
              <div className="h-64 bg-gray-300 rounded-lg"></div>
            </div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || totalItems === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">No Items to Checkout</h1>
        <p className="text-gray-600 mb-8">Your cart is empty. Add some items first!</p>
        <Button onClick={() => window.location.href = '/menu'}>
          Browse Menu
        </Button>
      </div>
    );
  }

  // Success Step
  if (currentStep === 'success') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Your order has been confirmed</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-sm">{paymentResult?.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-semibold">{formatCurrency(cart.total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">{(paymentResult as any)?.provider}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              A confirmation email has been sent to {customerInfo.email}
            </p>
            <p className="text-sm text-gray-600">
              Your order will be ready for pickup in 30-45 minutes
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.href = '/menu'}>
                Continue Shopping
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={currentStep === 'payment' ? () => setCurrentStep('details') : handleBackToCart}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 'payment' ? 'Back to Details' : 'Back to Cart'}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentStep === 'payment' ? 'Payment' : 'Checkout'}
          </h1>
          <p className="text-gray-600">
            {currentStep === 'payment' ? 'Complete your payment' : 'Complete your order'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-primary' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'details' ? 'bg-primary text-white' : 'bg-green-600 text-white'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Details</span>
          </div>
          <div className="w-12 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${currentStep === 'payment' ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'payment' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form Content */}
        <div className="space-y-6">
          {currentStep === 'details' && (
            <>
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input 
                        id="firstName" 
                        placeholder="John" 
                        value={customerInfo.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        value={customerInfo.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="(555) 123-4567" 
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address1">Street Address *</Label>
                    <Input 
                      id="address1" 
                      placeholder="123 Main Street" 
                      value={customerInfo.address1}
                      onChange={(e) => handleInputChange('address1', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address2">Apartment, suite, etc. (optional)</Label>
                    <Input 
                      id="address2" 
                      placeholder="Apt 2B" 
                      value={customerInfo.address2}
                      onChange={(e) => handleInputChange('address2', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input 
                        id="city" 
                        placeholder="Troy" 
                        value={customerInfo.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input 
                        id="state" 
                        placeholder="NY" 
                        value={customerInfo.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input 
                        id="zip" 
                        placeholder="12180" 
                        value={customerInfo.zip}
                        onChange={(e) => handleInputChange('zip', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Continue to Payment Button */}
              <Card>
                <CardContent className="p-6">
                  <Button
                    onClick={handleContinueToPayment}
                    className="w-full"
                    size="lg"
                  >
                    Continue to Payment
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    * Required fields
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {currentStep === 'payment' && (
            <PaymentProvider
              amount={totalAmount}
              currency="USD"
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              showProviderSelection={true}
            />
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.thumbnail || item.product?.thumbnail || '/api/placeholder/48/48'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>

              <hr />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal || 0)}</span>
                </div>
                {cart.shipping_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{formatCurrency(cart.shipping_total)}</span>
                  </div>
                )}
                {cart.tax_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatCurrency(cart.tax_total)}</span>
                  </div>
                )}
                {cart.discount_total > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(cart.discount_total)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(cart.total || 0)}</span>
                </div>
              </div>

              {/* Order Status */}
              {currentStep === 'details' && (
                <p className="text-sm text-gray-600 text-center">
                  Complete your details to proceed to payment
                </p>
              )}
              {currentStep === 'payment' && (
                <p className="text-sm text-gray-600 text-center">
                  Choose your payment method to complete the order
                </p>
              )}

              {/* Order Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Orders typically ready in 30-45 minutes</p>
                <p>• Free delivery on orders over $50</p>
                <p>• We'll send you order updates via SMS</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutWrapper() {
  return (
    <AppProviders>
      <CheckoutContent />
    </AppProviders>
  );
}