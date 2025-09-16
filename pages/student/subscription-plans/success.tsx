import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  CheckCircleIcon, 
  ArrowRightIcon,
  HomeIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import Layout from '../../../components/Layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const PaymentSuccess: React.FC = () => {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestSubscription();
  }, []);

  const fetchLatestSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const latestSubscription = data.data?.[0]; // Most recent subscription
        setSubscription(latestSubscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  return (
    <>
      <Head>
        <title>Payment Successful - ExamIntelligence</title>
        <meta name="description" content="Your subscription payment was successful" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Success Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Payment Successful!
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your subscription has been activated successfully. You now have full access to all premium features.
              </p>
            </motion.div>

            {/* Subscription Details */}
            {subscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Subscription Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Plan Name</label>
                      <p className="text-lg font-semibold text-gray-900">{subscription.plan.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(subscription.amount)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duration</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {subscription.plan.duration} months
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(subscription.startDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(subscription.endDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Included</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subscription.plan.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50 rounded-xl p-8 mb-8"
            >
              <h3 className="text-xl font-semibold text-blue-900 mb-4">What's Next?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">1</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-blue-900 font-medium">Check your email</p>
                    <p className="text-blue-700 text-sm">
                      We've sent you a confirmation email with your subscription details and receipt.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">2</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-blue-900 font-medium">Start taking exams</p>
                    <p className="text-blue-700 text-sm">
                      You can now access all available exams and premium features.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">3</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-blue-900 font-medium">Manage your subscription</p>
                    <p className="text-blue-700 text-sm">
                      View your subscription status and manage your account from your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => router.push('/student')}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Go to Dashboard
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
              
              <button
                onClick={() => router.push('/student/subscriptions')}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                View Subscription
              </button>
            </motion.div>

            {/* Support Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-12 text-center"
            >
              <p className="text-gray-600">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@examintelligence.com" className="text-blue-600 hover:text-blue-800">
                  support@examintelligence.com
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PaymentSuccess;
