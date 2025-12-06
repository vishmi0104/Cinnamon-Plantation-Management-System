import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import http from "../../api/http";

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      navigate('/user/orders');
      return;
    }
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, methodsRes] = await Promise.all([
        http.get(`/orders/${orderId}`),
        http.get('/payments/methods')
      ]);

      setOrder(orderRes.data);
      setPaymentMethods(methodsRes.data);

      // Auto-select default payment method
      const defaultMethod = methodsRes.data.find(method => method.isDefault);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod._id);
      }
    } catch (err) {
      setError('Failed to load payment information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await http.post('/payments/process', {
        orderId: order._id,
        paymentMethodId: selectedMethod
      });

      // Show success message and redirect
      alert(`Payment initiated successfully! Transaction ID: ${response.data.transactionId}`);
      navigate('/user/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const maskCardNumber = (cardNumber) => {
    const last4 = cardNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  const getCardTypeIcon = (type) => {
    switch (type) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg">{error}</div>
          <button
            onClick={() => navigate('/user/orders')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-6 shadow-2xl">
            <span className="text-3xl">💳</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">Your order has been approved! Please complete the payment to finalize your purchase.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold text-gray-900">{order?.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(order?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
              <div className="space-y-3">
                {order?.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × ${item.price}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t mt-6 pt-6">
              <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                <span>Total Amount:</span>
                <span>${order?.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods</h3>
                <p className="text-gray-600 mb-4">Please add a payment method to continue</p>
                <button
                  onClick={() => navigate('/user/payments')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Add Payment Method
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method._id}
                    onClick={() => setSelectedMethod(method._id)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedMethod === method._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getCardTypeIcon(method.cardType)}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{method.cardHolderName}</p>
                          <p className="text-sm text-gray-600">{maskCardNumber(method.cardNumber)}</p>
                          <p className="text-xs text-gray-500">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                        <input
                          type="radio"
                          checked={selectedMethod === method._id}
                          onChange={() => setSelectedMethod(method._id)}
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => navigate('/user/payments')}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                >
                  + Add New Payment Method
                </button>

                <button
                  onClick={handlePayment}
                  disabled={!selectedMethod || processing}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                    !selectedMethod || processing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay $${order?.totalAmount?.toFixed(2)}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-xl">🔒</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Secure Payment</h3>
              <p className="text-blue-800 text-sm">
                Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}