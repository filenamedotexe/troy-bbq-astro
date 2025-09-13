import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, CreditCard, Receipt, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import DepositPayment from './DepositPayment';
import BalancePayment from './BalancePayment';
import type { CateringQuote, PaymentResult } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface PaymentWorkflowProps {
  quote: CateringQuote;
  onStatusUpdate: (status: CateringQuote['status']) => void;
  onError: (error: string) => void;
}

type PaymentPhase = 'deposit' | 'balance' | 'completed';

interface PaymentProgress {
  deposit: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionId?: string;
    completedAt?: Date;
    error?: string;
  };
  balance: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionId?: string;
    completedAt?: Date;
    error?: string;
  };
}

export default function PaymentWorkflow({ 
  quote, 
  onStatusUpdate, 
  onError 
}: PaymentWorkflowProps) {
  const [currentPhase, setCurrentPhase] = useState<PaymentPhase>(() => {
    if (quote.status === 'completed') return 'completed';
    if (quote.status === 'deposit_paid' || quote.status === 'confirmed') return 'balance';
    return 'deposit';
  });

  const [progress, setProgress] = useState<PaymentProgress>(() => ({
    deposit: {
      status: quote.status === 'deposit_paid' || quote.status === 'confirmed' || quote.status === 'completed' 
        ? 'completed' : 'pending'
    },
    balance: {
      status: quote.status === 'completed' ? 'completed' : 'pending'
    }
  }));

  const [balancePaymentLink, setBalancePaymentLink] = useState<string | null>(null);

  useEffect(() => {
    // Generate balance payment link if deposit is paid
    if (quote.status === 'deposit_paid' && currentPhase === 'balance') {
      generateBalancePaymentLink();
    }
  }, [quote.status, currentPhase]);

  const generateBalancePaymentLink = () => {
    // In a real implementation, this would be generated server-side
    const link = `${window.location.origin}/catering/balance-payment?quote=${quote.id}&token=${btoa(quote.id + quote.customerEmail)}`;
    setBalancePaymentLink(link);
  };

  const handleDepositSuccess = (result: PaymentResult) => {
    setProgress(prev => ({
      ...prev,
      deposit: {
        status: 'completed',
        transactionId: result.transactionId,
        completedAt: new Date()
      }
    }));

    setCurrentPhase('balance');
    onStatusUpdate('deposit_paid');
    
    // Generate balance payment link
    generateBalancePaymentLink();
  };

  const handleDepositError = (error: string) => {
    setProgress(prev => ({
      ...prev,
      deposit: {
        status: 'failed',
        error
      }
    }));
    onError(`Deposit payment failed: ${error}`);
  };

  const handleBalanceSuccess = (result: PaymentResult) => {
    setProgress(prev => ({
      ...prev,
      balance: {
        status: 'completed',
        transactionId: result.transactionId,
        completedAt: new Date()
      }
    }));

    setCurrentPhase('completed');
    onStatusUpdate('completed');
  };

  const handleBalanceError = (error: string) => {
    setProgress(prev => ({
      ...prev,
      balance: {
        status: 'failed',
        error
      }
    }));
    onError(`Balance payment failed: ${error}`);
  };

  const copyBalanceLink = async () => {
    if (balancePaymentLink) {
      await navigator.clipboard.writeText(balancePaymentLink);
      // You might want to show a toast notification here
    }
  };

  const sendBalanceLink = async () => {
    try {
      const response = await fetch('/api/catering/payments/send-balance-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          email: quote.customerEmail,
          link: balancePaymentLink
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send balance payment link');
      }

      // You might want to show a success toast here
    } catch (error) {
      onError('Failed to send balance payment link');
    }
  };

  const getPhaseIcon = (phase: 'deposit' | 'balance') => {
    const status = progress[phase].status;
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPhaseStatus = (phase: 'deposit' | 'balance') => {
    const status = progress[phase].status;
    
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Deposit Phase */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              currentPhase === 'deposit' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                {getPhaseIcon('deposit')}
                <div>
                  <h3 className={`font-medium ${getPhaseStatus('deposit')}`}>
                    Deposit Payment
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(quote.pricing.depositCents)} deposit required
                  </p>
                  {progress.deposit.completedAt && (
                    <p className="text-xs text-gray-500">
                      Completed {progress.deposit.completedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium capitalize ${getPhaseStatus('deposit')}`}>
                  {progress.deposit.status}
                </div>
                {progress.deposit.transactionId && (
                  <div className="text-xs text-gray-500">
                    {progress.deposit.transactionId}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow */}
            {progress.deposit.status === 'completed' && (
              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            )}

            {/* Balance Phase */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              currentPhase === 'balance' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
            } ${progress.deposit.status !== 'completed' ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                {getPhaseIcon('balance')}
                <div>
                  <h3 className={`font-medium ${getPhaseStatus('balance')}`}>
                    Balance Payment
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(quote.pricing.balanceCents)} remaining balance
                  </p>
                  {progress.balance.completedAt && (
                    <p className="text-xs text-gray-500">
                      Completed {progress.balance.completedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium capitalize ${getPhaseStatus('balance')}`}>
                  {progress.balance.status}
                </div>
                {progress.balance.transactionId && (
                  <div className="text-xs text-gray-500">
                    {progress.balance.transactionId}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Phase Payment Form */}
      {currentPhase === 'deposit' && (
        <DepositPayment
          quote={quote}
          onPaymentSuccess={handleDepositSuccess}
          onPaymentError={handleDepositError}
        />
      )}

      {currentPhase === 'balance' && (
        <>
          {/* Balance Payment Link Management */}
          {balancePaymentLink && (
            <Card>
              <CardHeader>
                <CardTitle>Balance Payment Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Share this secure link to collect the remaining balance payment:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={balancePaymentLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyBalanceLink}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendBalanceLink}
                  >
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <BalancePayment
            quote={quote}
            onPaymentSuccess={handleBalanceSuccess}
            onPaymentError={handleBalanceError}
          />
        </>
      )}

      {currentPhase === 'completed' && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Payment Complete!
            </h3>
            <p className="text-gray-600 mb-4">
              Your catering order has been fully paid and confirmed.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="font-medium">
                    {formatCurrency(quote.pricing.totalCents)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Deposit:</span>
                  <span>{formatCurrency(quote.pricing.depositCents)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Balance:</span>
                  <span>{formatCurrency(quote.pricing.balanceCents)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(progress.deposit.error || progress.balance.error) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                {progress.deposit.error && (
                  <p className="font-medium">Deposit Payment Error: {progress.deposit.error}</p>
                )}
                {progress.balance.error && (
                  <p className="font-medium">Balance Payment Error: {progress.balance.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}