import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LinkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../../components/AdminLayout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useRouter } from 'next/router';

interface BatchAssignment {
  _id: string;
  batch: {
    _id: string;
    name: string;
    year: number;
    college: {
      _id: string;
      name: string;
    };
  };
  subscriptionPlan: {
    _id: string;
    name: string;
    price: number;
    duration: number;
  };
  college: {
    _id: string;
    name: string;
  };
  assignedBy: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  assignmentDate: string;
  notes?: string;
}

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [colleges, setColleges] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    batch: '',
    subscriptionPlan: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchColleges();
      fetchSubscriptionPlans();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.college) {
      fetchBatches(formData.college);
    }
  }, [formData.college]);

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

  const fetchBatches = async (collegeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/batches?college=${collegeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subscription-plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSubscriptionPlans(data.data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/batch-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({ college: '', batch: '', subscriptionPlan: '', notes: '' });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Batch Assignment</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
            <select
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value, batch: '' })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select College</option>
              {colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.college}
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} ({batch.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
            <select
              value={formData.subscriptionPlan}
              onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Subscription Plan</option>
              {subscriptionPlans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} (₹{plan.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any notes about this assignment..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BatchAssignmentsPage: React.FC = () => {
  const router = useRouter();
  const [assignments, setAssignments] = useState<BatchAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/batch-assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batch assignments');
      }

      const data = await response.json();
      setAssignments(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/batch-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment');
    }
  };

  const toggleStatus = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/batch-assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment');
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subscriptionPlan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.college.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Batch-Subscription Assignments">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Batch-Subscription Assignments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batch-Subscription Assignments</h1>
            <p className="text-gray-600">Manage batch assignments to subscription plans</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Assignment
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-md p-4"
          >
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by batch, plan, or college name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <LinkIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Assignments</dt>
                    <dd className="text-lg font-medium text-gray-900">{assignments.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Assignments</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => a.isActive).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Colleges Covered</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Set(assignments.map(a => a.college._id)).size}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">All Assignments</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage batch-subscription plan assignments</p>
          </div>
          <ul className="divide-y divide-gray-200">
            {filteredAssignments.map((assignment) => (
              <li key={assignment._id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {assignment.batch.name} → {assignment.subscriptionPlan.name}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.isActive 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        <span className="text-xs text-gray-500 flex items-center">
                          <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                          {assignment.college.name}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <CreditCardIcon className="h-3 w-3 mr-1" />
                          ₹{assignment.subscriptionPlan.price}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(assignment.assignmentDate).toLocaleDateString()}
                        </span>
                      </div>
                      {assignment.notes && (
                        <p className="text-xs text-gray-500 mt-1">{assignment.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleStatus(assignment._id, assignment.isActive)}
                      className={`text-sm px-3 py-1 rounded-md ${
                        assignment.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {assignment.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleDelete(assignment._id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first batch assignment.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Assignment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Assignment Modal */}
        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchAssignments}
        />
      </div>
    </AdminLayout>
  );
};

export default BatchAssignmentsPage;
