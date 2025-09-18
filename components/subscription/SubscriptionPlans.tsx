import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PlanCard from './PlanCard';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  colleges: {
    _id: string;
    name: string;
    code: string;
  }[];
}

interface SubscriptionPlansProps {
  collegeId?: string;
  onPlanSelect?: (plan: SubscriptionPlan) => void;
  showComparison?: boolean;
  selectedPlanId?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  collegeId,
  onPlanSelect,
  showComparison = true,
  selectedPlanId,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);

  useEffect(() => {
    fetchPlans();
  }, [collegeId]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = collegeId 
        ? `/api/student/subscription-plans?college=${collegeId}`
        : '/api/student/subscription-plans';
      
      const headers: HeadersInit = {};
      
      // Only add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }

      const data = await response.json();
      setPlans(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (showComparison) {
      setSelectedPlans(prev => 
        prev.includes(plan._id) 
          ? prev.filter(id => id !== plan._id)
          : [...prev, plan._id]
      );
    }
    onPlanSelect?.(plan);
  };

  const selectedPlansData = plans.filter(plan => selectedPlans.includes(plan._id));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XMarkIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading plans</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchPlans}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No subscription plans available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Contact your college administrator to set up subscription plans.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PlanCard
              plan={plan}
              isSelected={selectedPlanId === plan._id || selectedPlans.includes(plan._id)}
              onSelect={() => handlePlanSelect(plan)}
              showComparison={showComparison}
            />
          </motion.div>
        ))}
      </div>

      {/* Plan Comparison */}
      {showComparison && selectedPlansData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  {selectedPlansData.map((plan) => (
                    <th key={plan._id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Price
                  </td>
                  {selectedPlansData.map((plan) => (
                    <td key={plan._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      ₹{plan.price}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Duration
                  </td>
                  {selectedPlansData.map((plan) => (
                    <td key={plan._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {plan.duration} months
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Features
                  </td>
                  {selectedPlansData.map((plan) => (
                    <td key={plan._id} className="px-6 py-4 text-sm text-gray-900">
                      <ul className="space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
