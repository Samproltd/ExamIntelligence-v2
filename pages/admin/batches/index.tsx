import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import Button from '../../../components/Button';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface Batch {
  _id: string;
  name: string;
  description: string;
  year: number;
  subject: {
    _id: string;
    name: string;
  };
  college: {
    _id: string;
    name: string;
    code: string;
  };
  department?: string;
  semester?: number;
  isActive: boolean;
  studentsCount?: number;
  createdAt: string;
  maxAttempts?: number;
  maxSecurityIncidents?: number;
  enableAutoSuspend?: boolean;
  additionalSecurityIncidentsAfterRemoval?: number;
  additionalAttemptsAfterPayment?: number;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Subject {
  _id: string;
  name: string;
  college: {
    _id: string;
    name: string;
    code: string;
  };
}

const BatchesPage = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batchAssignments, setBatchAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for adding new batch
  const [newBatch, setNewBatch] = useState({
    name: '',
    description: '',
    year: new Date().getFullYear(),
    subject: '', // Select subject instead of college directly
    department: '',
    semester: '',
    isActive: true,
    maxAttempts: 3,
    maxSecurityIncidents: 5,
    enableAutoSuspend: true,
    additionalSecurityIncidentsAfterRemoval: 3,
    additionalAttemptsAfterPayment: 2,
  });

  const { token } = useSelector((state: RootState) => state.auth);

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/api/subjects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Fetch batch assignments
  const fetchBatchAssignments = async () => {
    try {
      const response = await axios.get('/api/admin/batch-assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatchAssignments(response.data.data || []);
    } catch (err) {
      console.error('Error fetching batch assignments:', err);
    }
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
      });

      const response = await axios.get(`/api/batches?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { batches, total, pages } = response.data;
      setBatches(batches);
      setTotalPages(pages || Math.ceil(total / 10));
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new batch
  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await axios.post('/api/batches', newBatch, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Reset form and close modal
      setNewBatch({
        name: '',
        description: '',
        year: new Date().getFullYear(),
        subject: '',
        department: '',
        semester: '',
        isActive: true,
        maxAttempts: 3,
        maxSecurityIncidents: 5,
        enableAutoSuspend: true,
        additionalSecurityIncidentsAfterRemoval: 3,
        additionalAttemptsAfterPayment: 2,
      });
      setShowAddModal(false);

      // Refetch batches
      fetchBatches();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add batch');
      console.error('Error adding batch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle batch active status
  const toggleBatchStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(
        `/api/batches/${id}`,
        { isActive: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setBatches(
        batches.map(batch => (batch._id === id ? { ...batch, isActive: !currentStatus } : batch))
      );
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update batch status');
      console.error('Error updating batch status:', error);
    }
  };

  // Delete batch
  const deleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/batches/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setBatches(batches.filter(batch => batch._id !== id));
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete batch');
      console.error('Error deleting batch:', error);
      alert(error.response?.data?.message || 'Failed to delete batch');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to check if batch has subscription assignment
  const getBatchSubscriptionStatus = (batchId: string) => {
    const assignment = batchAssignments.find(assignment => assignment.batch._id === batchId);
    return assignment ? {
      hasAssignment: true,
      planName: assignment.subscriptionPlan.name,
      isActive: assignment.isActive
    } : {
      hasAssignment: false,
      planName: null,
      isActive: false
    };
  };

  // Effect to fetch batches when component mounts or dependencies change
  useEffect(() => {
    if (token) {
      fetchBatches();
      fetchSubjects();
      fetchBatchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, token]);

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Batch Management | Admin" description="Manage student batches">
        <div className="px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Batch Management</h1>
            <Button onClick={() => setShowAddModal(true)}>Add New Batch</Button>
          </div>

          {/* Warning for batches without subscription assignments */}
          {batches.some(batch => !getBatchSubscriptionStatus(batch._id).hasAssignment) && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Subscription Assignment Required
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>
                      Some batches are not assigned to subscription plans. Students in these batches cannot see or access exams.
                      <Link href="/admin/batch-assignments" className="ml-1 font-medium underline hover:text-orange-600">
                        Assign subscription plans now →
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and filters */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search batches..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-4 py-2 border rounded-md w-full"
              />
              <Button onClick={fetchBatches}>Search</Button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Batches list */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No batches found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-center">Year</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Subscription</th>
                    <th className="px-4 py-3 text-center">Created</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {batches.map(batch => (
                    <tr key={batch._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/batches/${batch._id}`}>
                          <span className="text-blue-600 hover:underline font-medium">
                            {batch.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">{batch.description}</td>
                      <td className="px-4 py-3 text-center">{batch.year}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            batch.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {batch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const subscriptionStatus = getBatchSubscriptionStatus(batch._id);
                          if (subscriptionStatus.hasAssignment) {
                            return (
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs ${
                                  subscriptionStatus.isActive
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                title={`Assigned to: ${subscriptionStatus.planName}`}
                              >
                                {subscriptionStatus.planName}
                              </span>
                            );
                          } else {
                            return (
                              <span
                                className="inline-block px-2 py-1 rounded text-xs bg-red-100 text-red-800"
                                title="No subscription plan assigned - Students cannot see exams"
                              >
                                Not Assigned
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">{formatDate(batch.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => toggleBatchStatus(batch._id, batch.isActive)}
                            className={`px-2 py-1 rounded text-xs ${
                              batch.isActive
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                            title={batch.isActive ? 'Set as Inactive' : 'Set as Active'}
                          >
                            {batch.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <Link href={`/admin/batches/${batch._id}`}>
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200">
                              View
                            </span>
                          </Link>
                          {!getBatchSubscriptionStatus(batch._id).hasAssignment && (
                            <Link href="/admin/batch-assignments">
                              <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 hover:bg-orange-200" title="Assign Subscription Plan">
                                Assign Plan
                              </span>
                            </Link>
                          )}
                          <button
                            onClick={() => deleteBatch(batch._id)}
                            className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 hover:bg-red-200"
                            title="Delete Batch"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="px-4 py-2 bg-gray-100 rounded">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Add Batch Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white pb-4 border-b mb-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Add New Batch</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleAddBatch} className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.name}
                      onChange={e => setNewBatch({ ...newBatch, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.description}
                      onChange={e => setNewBatch({ ...newBatch, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Year</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.year}
                      onChange={e => setNewBatch({ ...newBatch, year: parseInt(e.target.value) })}
                      min="2000"
                      max="2100"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Subject</label>
                    <select
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.subject}
                      onChange={e => setNewBatch({ ...newBatch, subject: e.target.value })}
                      required
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name} ({subject.college?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Department (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.department}
                      onChange={e => setNewBatch({ ...newBatch, department: e.target.value })}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Semester (Optional)</label>
                    <select
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.semester}
                      onChange={e => setNewBatch({ ...newBatch, semester: e.target.value })}
                    >
                      <option value="">Select semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Max Exam Attempts Allowed
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.maxAttempts}
                      onChange={e =>
                        setNewBatch({ ...newBatch, maxAttempts: parseInt(e.target.value) })
                      }
                      min="1"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Max Security Incidents Before Suspension
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.maxSecurityIncidents}
                      onChange={e =>
                        setNewBatch({ ...newBatch, maxSecurityIncidents: parseInt(e.target.value) })
                      }
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of security violations allowed before exam suspension
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={newBatch.enableAutoSuspend}
                        onChange={e =>
                          setNewBatch({ ...newBatch, enableAutoSuspend: e.target.checked })
                        }
                      />
                      <span className="text-gray-700">Enable Automatic Exam Suspension</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-5">
                      When enabled, students will be automatically suspended after reaching the
                      maximum security incidents
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Additional Security Incidents After Suspension Removal
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.additionalSecurityIncidentsAfterRemoval}
                      onChange={e =>
                        setNewBatch({
                          ...newBatch,
                          additionalSecurityIncidentsAfterRemoval: parseInt(e.target.value),
                        })
                      }
                      min="0"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of additional security incidents allowed after a student pays to remove
                      a suspension
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Additional Attempts After Payment
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={newBatch.additionalAttemptsAfterPayment}
                      onChange={e =>
                        setNewBatch({
                          ...newBatch,
                          additionalAttemptsAfterPayment: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of additional exam attempts granted when a student pays for more
                      attempts
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={newBatch.isActive}
                        onChange={e => setNewBatch({ ...newBatch, isActive: e.target.checked })}
                      />
                      <span className="text-gray-700">Active</span>
                    </label>
                  </div>
                  <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Add Batch
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default BatchesPage;
