import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  PencilIcon, 
  TrashIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../../../components/AdminLayout';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

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
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ViewSubscriptionPlan: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlanDetails();
    }
  }, [id]);

  const fetchPlanDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subscription-plans/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlan(data.data);
      } else {
        setError('Failed to fetch plan details');
      }
    } catch (error) {
      setError('Failed to fetch plan details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subscription-plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        router.push('/admin/subscription-plans');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete subscription plan');
      }
    } catch (err) {
      setError('Failed to delete subscription plan');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout title="View Subscription Plan">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!plan) {
    return (
      <AdminLayout title="View Subscription Plan">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Plan not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The subscription plan you're looking for doesn't exist.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/admin/subscription-plans')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Plans
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`View ${plan.name} - Subscription Plan`}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin/subscription-plans')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
                  <p className="text-gray-600 mt-1">Subscription Plan Details</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push(`/admin/subscription-plans/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Plan
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-md p-4"
            >
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          <div className="space-y-8">
            {/* Plan Overview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {plan.isDefault && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Default Plan
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    plan.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPrice(plan.price)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-lg font-semibold text-gray-900">{plan.duration} months</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TagIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Features</p>
                    <p className="text-lg font-semibold text-gray-900">{plan.features.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colleges */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <BuildingOfficeIcon className="h-6 w-6 mr-2 text-blue-600" />
                Available Colleges
              </h3>
              
              {plan.colleges && plan.colleges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.colleges.map((college) => (
                    <div key={college._id} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">{college.name}</h4>
                      <p className="text-sm text-gray-600">{college.code}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No colleges assigned to this plan.</p>
              )}
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Plan Features</h3>
              
              {plan.features && plan.features.length > 0 ? (
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No features defined for this plan.</p>
              )}
            </div>

            {/* Plan Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Plan Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Created By</h4>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{plan.createdBy.name}</p>
                      <p className="text-sm text-gray-600">{plan.createdBy.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Created At</h4>
                  <p className="text-gray-900">{formatDate(plan.createdAt)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Last Updated</h4>
                  <p className="text-gray-900">{formatDate(plan.updatedAt)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Plan ID</h4>
                  <p className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {plan._id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Subscription Plan</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{plan.name}"? This action cannot be undone and may affect existing subscriptions.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ViewSubscriptionPlan;
