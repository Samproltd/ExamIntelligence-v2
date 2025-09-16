import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowLeftIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline';
import Layout from '../../../components/Layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  features: string[];
  college: {
    _id: string;
    name: string;
    code: string;
  };
}

const SubscriptionPayment: React.FC = () => {
  const router = useRouter();
  const { planId } = router.query;
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (planId) {
      fetchPlanDetails();
      checkUserAuth();
    }
    
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [planId]);

  const checkUserAuth = async () => {
    try {
      const isRegistration = router.query.registration === 'true';
      
      if (isRegistration) {
        // For registration flow, get user data from pending registration
        const pendingRegistration = localStorage.getItem('pendingRegistration');
        if (pendingRegistration) {
          const registrationData = JSON.parse(pendingRegistration);
          setUser({
            name: registrationData.name,
            email: registrationData.email,
          });
        } else {
          router.push('/register');
          return;
        }
      } else {
        // Regular flow - check authentication
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/check', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    }
  };

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const isRegistration = router.query.registration === 'true';
      
      if (isRegistration) {
        // For registration flow, fetch plan without authentication
        const response = await fetch(`/api/student/subscription-plans/${planId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch plan details');
        }

        const data = await response.json();
        setPlan(data.data);
      } else {
        // Regular flow - fetch with authentication
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/student/subscription-plans/${planId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch plan details');
        }

        const data = await response.json();
        setPlan(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!plan || !user) return;

    try {
      setProcessing(true);
      setError(null);

      // Create Razorpay order
      const isRegistration = router.query.registration === 'true';
      const orderPayload = {
        planId: plan._id,
        amount: plan.price,
        currency: 'INR',
        isRegistration: isRegistration,
      };
      
      console.log('Sending payment order request:', orderPayload);
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      // Only add authorization header for regular flow
      if (!isRegistration) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      }
      
      const orderResponse = await fetch('/api/payments/subscription-order', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      
      console.log('Order response received:', orderData);
      console.log('Order data amount:', orderData.data?.amount);
      console.log('Plan price:', plan.price);

      // Initialize Razorpay
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      
      if (!razorpayKey) {
        throw new Error('Razorpay key not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID in your environment variables.');
      }

      const options = {
        key: razorpayKey,
        amount: plan.price * 100, // Convert to paise for frontend
        currency: 'INR',
        name: 'ExamIntelligence',
        description: `${plan.name} Subscription - ₹${plan.price}`,
        order_id: orderData.id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async function (response: any) {
          try {
            // Check if this is a registration flow
            const isRegistration = router.query.registration === 'true';
            const pendingRegistration = localStorage.getItem('pendingRegistration');
            
            if (isRegistration && pendingRegistration) {
              // This is a registration flow - register user after payment verification
              const registrationData = JSON.parse(pendingRegistration);
              
              // First verify payment
              const verifyResponse = await fetch('/api/payments/subscription-verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: plan._id,
                  registrationData: registrationData, // Include registration data
                }),
              });

              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                
                // Store token and clear pending registration
                localStorage.setItem('token', verifyData.token);
                localStorage.removeItem('pendingRegistration');
                
                // Redirect to student dashboard
                router.push('/student');
              } else {
                throw new Error('Payment verification failed');
              }
            } else {
              // Regular payment flow for existing users
              const verifyResponse = await fetch('/api/payments/subscription-verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: plan._id,
                }),
              });

              if (verifyResponse.ok) {
                // Payment successful - redirect to student dashboard
                router.push('/student');
              } else {
                throw new Error('Payment verification failed');
              }
            }
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      console.log('Razorpay options:', options);
      console.log('Plan price:', plan.price);
      console.log('Amount in paise:', plan.price * 100);
      console.log('Order data amount:', orderData.data.amount);

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error && !plan) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading plan</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => router.push('/student/subscription-plans')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Plans
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Payment - ExamIntelligence</title>
        <meta name="description" content="Complete your subscription payment securely" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Complete Your Payment
              </h1>
              <p className="text-gray-600">
                Secure payment powered by Razorpay
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Plan Summary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                {plan && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Duration: {plan.duration} months
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(plan.price)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Subtotal</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(plan.price)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Tax (GST)</span>
                        <span className="text-sm text-gray-600">Included</span>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPrice(plan.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Payment Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>

                {/* Security Notice */}
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <LockClosedIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Secure Payment</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your payment is processed securely by Razorpay. We never store your payment information.
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                {user && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Billing Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm font-medium text-gray-900">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">College:</span>
                        <span className="text-sm font-medium text-gray-900">{plan?.college.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <XCircleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-900">Payment Error</h4>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing || !plan}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {processing ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      <CreditCardIcon className="h-5 w-5 mr-2" />
                      Pay {plan ? formatPrice(plan.price) : ''}
                    </>
                  )}
                </button>

                {/* Back Button */}
                <button
                  onClick={() => router.push('/student/subscription-plans')}
                  className="w-full mt-3 inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Plans
                </button>
              </motion.div>
            </div>

            {/* Features Included */}
            {plan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Included</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default SubscriptionPayment;
