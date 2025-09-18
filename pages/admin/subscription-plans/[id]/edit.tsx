import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  PencilIcon, 
  XMarkIcon,
  CheckIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../../../components/AdminLayout';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

interface College {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactEmail: string;
  isActive: boolean;
}

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

const EditSubscriptionPlan: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 6,
    price: 1000,
    features: [''],
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    if (id) {
      fetchPlanDetails();
      fetchColleges();
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
        const plan: SubscriptionPlan = data.data;
        
        setFormData({
          name: plan.name,
          description: plan.description,
          duration: plan.duration,
          price: plan.price,
          features: plan.features.length > 0 ? plan.features : [''],
          isActive: plan.isActive,
          isDefault: plan.isDefault,
        });
        
        setSelectedColleges(plan.colleges.map(c => c._id));
      } else {
        setError('Failed to fetch plan details');
      }
    } catch (error) {
      setError('Failed to fetch plan details');
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/colleges', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setColleges(data.data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'duration' || name === 'price') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };

  const handleCollegeToggle = (collegeId: string) => {
    setSelectedColleges(prev => 
      prev.includes(collegeId) 
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedColleges.length === 0) {
      setError('Please select at least one college');
      return;
    }

    if (formData.features.some(feature => !feature.trim())) {
      setError('Please fill in all features or remove empty ones');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subscription-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          colleges: selectedColleges,
          features: formData.features.filter(f => f.trim())
        })
      });

      if (response.ok) {
        router.push('/admin/subscription-plans');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update subscription plan');
      }
    } catch (err) {
      setError('Failed to update subscription plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Subscription Plan">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Subscription Plan">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Subscription Plan</h1>
                <p className="text-gray-600 mt-2">
                  Update subscription plan details and college assignments
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/subscription-plans')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
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

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <TagIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Premium Plan"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (months) *
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="6"
                        min="1"
                        max="999"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={formData.isDefault}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Default Plan</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what this plan includes..."
                    required
                  />
                </div>
              </div>

              {/* College Selection */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BuildingOfficeIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Select Colleges
                </h2>
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search colleges..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4">
                  {filteredColleges.map((college) => (
                    <div
                      key={college._id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedColleges.includes(college._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCollegeToggle(college._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{college.name}</h4>
                          <p className="text-sm text-gray-600">{college.code}</p>
                          <p className="text-xs text-gray-500">{college.address}</p>
                        </div>
                        <div className="ml-3">
                          {selectedColleges.includes(college._id) ? (
                            <CheckIcon className="h-5 w-5 text-blue-600" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedColleges.length > 0 && (
                  <p className="mt-2 text-sm text-blue-600">
                    {selectedColleges.length} college{selectedColleges.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan Features</h2>
                
                <div className="space-y-4">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Feature ${index + 1}`}
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addFeature}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Add Feature
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/subscription-plans')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-2">Updating...</span>
                  </div>
                ) : (
                  'Update Plan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditSubscriptionPlan;
