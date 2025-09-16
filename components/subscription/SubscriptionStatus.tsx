import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/LoadingSpinner';

interface StudentSubscription {
  _id: string;
  student: string;
  plan: {
    _id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    features: string[];
  };
  college: {
    _id: string;
    name: string;
    code: string;
  };
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  paymentId: string;
  amount: number;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionStatusProps {
  userId?: string;
  className?: string;
  showDetails?: boolean;
  onUpgrade?: () => void;
  onRenew?: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  userId,
  className = '',
  showDetails = true,
  onUpgrade,
  onRenew,
}) => {
  const [subscription, setSubscription] = useState<StudentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      const activeSubscription = data.data?.find((sub: StudentSubscription) => 
        sub.status === 'active'
      );
      setSubscription(activeSubscription || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          label: 'Active',
          description: 'Your subscription is active and you have full access to all features.'
        };
      case 'expired':
        return {
          icon: XCircleIcon,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          label: 'Expired',
          description: 'Your subscription has expired. Please renew to continue using the service.'
        };
      case 'suspended':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          label: 'Suspended',
          description: 'Your subscription has been suspended. Please contact support.'
        };
      case 'cancelled':
        return {
          icon: XCircleIcon,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'Cancelled',
          description: 'Your subscription has been cancelled.'
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'No Subscription',
          description: 'You don\'t have an active subscription.'
        };
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

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-gray-600">Loading subscription status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="flex items-center">
          <XCircleIcon className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading subscription</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    const config = getStatusConfig('none');
    const Icon = config.icon;

    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900">{config.label}</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        
        {onUpgrade && (
          <div className="mt-4">
            <button
              onClick={onUpgrade}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Choose a Plan
            </button>
          </div>
        )}
      </div>
    );
  }

  const config = getStatusConfig(subscription.status);
  const Icon = config.icon;
  const daysRemaining = getDaysRemaining(subscription.endDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      {/* Status Header */}
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900">{config.label}</h3>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Plan Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Plan</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">{subscription.plan.name}</p>
                <p className="text-sm text-gray-600">{subscription.plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatPrice(subscription.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  for {subscription.plan.duration} months
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Start Date</p>
                <p className="text-sm text-gray-600">{formatDate(subscription.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">End Date</p>
                <p className="text-sm text-gray-600">{formatDate(subscription.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Days Remaining */}
          {subscription.status === 'active' && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expires today'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {daysRemaining > 0 
                      ? 'Your subscription will expire soon. Consider renewing to avoid interruption.'
                      : 'Your subscription expires today. Please renew to continue using the service.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Plan Features</h4>
            <ul className="space-y-1">
              {subscription.plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {subscription.status === 'active' && daysRemaining <= 30 && onRenew && (
          <button
            onClick={onRenew}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CreditCardIcon className="h-4 w-4 mr-2" />
            Renew Subscription
          </button>
        )}
        
        {subscription.status !== 'active' && onUpgrade && (
          <button
            onClick={onUpgrade}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CreditCardIcon className="h-4 w-4 mr-2" />
            Choose a Plan
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionStatus;
