'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { recordPaymentAction } from '@/app/actions/billingActions';
import { AlertCircle, CheckCircle, DollarSign, Loader } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  created_at: string;
  items?: any[];
}

export function InvoiceDisplay({ invoice }: { invoice: Invoice }) {
  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Invoice {invoice.invoice_number}</CardTitle>
            <p className="text-sm text-gray-600">
              {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
            {invoice.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-2">Services</h3>
            <div className="space-y-2">
              {invoice.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.description}</span>
                  <span className="font-medium">
                    KES {item.total_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-semibold">
              KES {invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Paid Amount:</span>
            <span className="text-green-600 font-semibold">
              KES {invoice.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg">
            <span>Balance:</span>
            <span className={invoice.balance > 0 ? 'text-red-600' : 'text-green-600'} style={{ fontWeight: 'bold' }}>
              KES {invoice.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentForm({ invoiceId, balance }: { invoiceId: string; balance: number }) {
  const [loading, setLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const amount = parseFloat(amountPaid);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (amount > balance) {
      setError(`Amount cannot exceed balance of KES ${balance.toLocaleString()}`);
      setLoading(false);
      return;
    }

    const result = await recordPaymentAction(invoiceId, amount, paymentMethod, referenceNumber);

    if (result.success) {
      setSuccess(true);
      setAmountPaid('');
      setReferenceNumber('');
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(result.error || 'Failed to record payment');
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Record Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Payment recorded successfully!
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount to Pay</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 font-semibold text-gray-600">KES</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="pl-12"
                step="0.01"
                max={balance}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Outstanding Balance: KES {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <Label htmlFor="method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reference">Reference Number (Optional)</Label>
            <Input
              id="reference"
              placeholder="e.g., Cheque #, M-Pesa Code"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading || !amountPaid} className="w-full">
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function BillingSummary({ invoices }: { invoices: Invoice[] }) {
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0);

  const getMetricCard = (title: string, amount: number, color: string) => (
    <div className={`p-4 rounded-lg ${color}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-2xl font-bold">KES {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      {getMetricCard('Total Amount', totalAmount, 'bg-blue-100 text-blue-900')}
      {getMetricCard('Total Paid', totalPaid, 'bg-green-100 text-green-900')}
      {getMetricCard('Outstanding', totalBalance, 'bg-red-100 text-red-900')}
    </div>
  );
}
