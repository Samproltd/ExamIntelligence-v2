import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  CheckCircleIcon, 
  CreditCardIcon, 
  ArrowRightIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import Layout from '../../../components/Layout';
import SubscriptionPlans from '../../../components/subscription/SubscriptionPlans';
import SubscriptionStatus from '../../../components/subscription/SubscriptionStatus';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  college: {
    _id: string;
    name: string;
    code: string;
  };
}

const StudentSubscriptionPlans: React.FC = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    checkUserAuth();
    checkSubscriptionStatus();
  }, []);

  const checkUserAuth = async () => {
    try {
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
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const activeSubscription = data.data?.find((sub: any) => sub.status === 'active');
        setHasActiveSubscription(!!activeSubscription);
      }
    } catch (error) {
      console.error('Subscription check error:', error);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handleProceedToPayment = () => {
    if (selectedPlan) {
      router.push(`/student/subscription-plans/payment?planId=${selectedPlan._id}`);
    }
  };

  const handleUpgradeSubscription = () => {
    // Logic to upgrade existing subscription
    console.log('Upgrade subscription');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Subscription Plans - ExamIntelligence</title>
        <meta name="description" content="Choose the perfect subscription plan for your exam preparation" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Choose Your Subscription Plan
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Unlock unlimited access to exams, advanced proctoring, and premium features. 
                Select the plan that best fits your learning needs.
              </p>
            </motion.div>

            {/* Current Subscription Status */}
            {hasActiveSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <SubscriptionStatus
                  userId={user.id}
                  onUpgrade={handleUpgradeSubscription}
                  className="max-w-4xl mx-auto"
                />
              </motion.div>
            )}

            {/* Subscription Plans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SubscriptionPlans
                collegeId={user.college}
                onPlanSelect={handlePlanSelect}
                showComparison={true}
                selectedPlanId={selectedPlan?._id}
              />
            </motion.div>

            {/* Selected Plan Summary */}
            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 max-w-4xl mx-auto"
              >
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Selected Plan</h3>
                      <p className="text-gray-600">Review your selection before proceeding to payment</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        ₹{selectedPlan.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        for {selectedPlan.duration} months
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Plan Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Plan Name:</span>
                          <span className="font-medium">{selectedPlan.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{selectedPlan.duration} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">College:</span>
                          <span className="font-medium">{selectedPlan.college.name}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Features Included</h4>
                      <ul className="space-y-2">
                        {selectedPlan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Payment Information</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          You'll be redirected to our secure payment gateway (Razorpay) to complete your subscription. 
                          All payments are processed securely and you'll receive an email confirmation upon successful payment.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Change Plan
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <CreditCardIcon className="h-5 w-5 mr-2" />
                          Proceed to Payment
                          <ArrowRightIcon className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Why Choose Our Subscription Plans?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Get access to premium features and unlimited exam attempts with our flexible subscription options.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Unlimited Access</h3>
                  <p className="text-gray-600">
                    Take unlimited exams with no restrictions on attempts or time limits.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CreditCardIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Payment</h3>
                  <p className="text-gray-600">
                    Choose from multiple payment options with secure and instant processing.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <InformationCircleIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
                  <p className="text-gray-600">
                    Get help whenever you need it with our dedicated support team.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default StudentSubscriptionPlans;
