import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';
import Snackbar from '../../../components/Snackbar';
import useToast from '../../../hooks/useToast';
import Link from 'next/link';

interface Student {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  createdAt: string;
  examsTaken: number;
  averageScore: number;
  dateOfBirth?: string;
  mobile?: string;
  rollNumber?: string;
  batch?: {
    _id: string;
    name: string;
    year: number;
    department?: string;
    semester?: number;
  };
  college?: {
    _id: string;
    name: string;
    code: string;
    address: string;
  };
  subscription?: {
    _id: string;
    plan: {
      _id: string;
      name: string;
      price: number;
      duration: number;
    };
    status: 'active' | 'expired' | 'pending' | 'cancelled';
    startDate: string;
    endDate: string;
  };
  subscriptionStatus?: 'active' | 'expired' | 'none' | 'pending';
  isBlocked?: boolean;
  isVerified?: boolean;
}

interface Batch {
  _id: string;
  name: string;
  description: string;
  year: number;
  isActive: boolean;
}

interface College {
  _id: string;
  name: string;
  code: string;
  address: string;
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
}

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const studentsPerPage = 20;
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [blockingStudentId, setBlockingStudentId] = useState<string | null>(null);

  // Filter states
  const [collegeFilter, setCollegeFilter] = useState('');
  const [subscriptionPlanFilter, setSubscriptionPlanFilter] = useState('');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // active, blocked, all

  // Add student modal state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentRollNumber, setNewStudentRollNumber] = useState('');
  const [newStudentBatch, setNewStudentBatch] = useState('');
  const [newStudentDateOfBirth, setNewStudentDateOfBirth] = useState('');
  const [newStudentMobile, setNewStudentMobile] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  // Data for dropdowns
  const [batches, setBatches] = useState<Batch[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingSubscriptionPlans, setLoadingSubscriptionPlans] = useState(false);

  // Toast notifications
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get('/api/students', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: currentPage,
            limit: studentsPerPage,
            search: searchTerm,
            college: collegeFilter,
            subscriptionPlan: subscriptionPlanFilter,
            subscriptionStatus: subscriptionStatusFilter,
            batch: batchFilter,
            status: statusFilter,
          },
        });

        setStudents(response.data.students || []);
        setTotalPages(Math.ceil((response.data.total || 0) / studentsPerPage));
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch students';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, collegeFilter, subscriptionPlanFilter, subscriptionStatusFilter, batchFilter, statusFilter]);

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch batches
        setLoadingBatches(true);
        const batchesResponse = await axios.get('/api/batches', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100, sort: 'name' },
        });
        setBatches(batchesResponse.data.batches || []);
        setLoadingBatches(false);

        // Fetch colleges
        setLoadingColleges(true);
        const collegesResponse = await axios.get('/api/colleges', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100, sort: 'name' },
        });
        setColleges(collegesResponse.data.colleges || []);
        setLoadingColleges(false);

        // Fetch subscription plans
        setLoadingSubscriptionPlans(true);
        const plansResponse = await axios.get('/api/subscription-plans', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100, sort: 'name' },
        });
        setSubscriptionPlans(plansResponse.data.subscriptionPlans || []);
        setLoadingSubscriptionPlans(false);

      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch filter data';
        showError(errorMessage);
        setLoadingBatches(false);
        setLoadingColleges(false);
        setLoadingSubscriptionPlans(false);
        // Set empty arrays as fallbacks
        setBatches([]);
        setColleges([]);
        setSubscriptionPlans([]);
      }
    };

    fetchFilterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchTerm('');
    setCollegeFilter('');
    setSubscriptionPlanFilter('');
    setSubscriptionStatusFilter('');
    setBatchFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Handle adding a new student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !newStudentFirstName.trim() ||
      !newStudentLastName.trim() ||
      !newStudentEmail.trim() ||
      !newStudentPassword.trim()
    ) {
      setAddStudentError('First name, last name, email and password are required');
      showError('All required fields must be filled');
      return;
    }

    try {
      setIsAddingStudent(true);
      setAddStudentError(null);

      const token = localStorage.getItem('token');

      // Combine first and last name for backward compatibility
      const fullName = `${newStudentFirstName} ${newStudentLastName}`.trim();

      // Register the new student
      const studentData: any = {
        name: fullName,
        firstName: newStudentFirstName,
        lastName: newStudentLastName,
        email: newStudentEmail,
        password: newStudentPassword,
        role: 'student',
      };

      // Add optional fields if provided
      if (newStudentRollNumber) {
        studentData.rollNumber = newStudentRollNumber;
      }

      if (newStudentBatch) {
        studentData.batch = newStudentBatch;
      }

      if (newStudentDateOfBirth) {
        studentData.dateOfBirth = newStudentDateOfBirth;
      }

      if (newStudentMobile) {
        studentData.mobile = newStudentMobile;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await axios.post('/api/auth/register', studentData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status == 201) {
        // Show success message
        showSuccess(`Student ${fullName} added successfully`);
      } else {
        showError(`Student ${fullName} added successfully but Mail not sent !`);
      }

      // Reset form and close modal
      setNewStudentFirstName('');
      setNewStudentLastName('');
      setNewStudentEmail('');
      setNewStudentPassword('');
      setNewStudentRollNumber('');
      setNewStudentBatch('');
      setNewStudentDateOfBirth('');
      setNewStudentMobile('');
      setShowAddStudentModal(false);

      // Refresh the students list
      fetchStudents();
    } catch (err: any) {
      setAddStudentError(err.response?.data?.message || 'Failed to add student');
      showError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  // Handle block/unblock student
  const handleBlockStudent = async (studentId: string, studentName: string, isBlocked: boolean) => {
    const action = isBlocked ? 'unblock' : 'block';
    // if (!confirm(`Are you sure you want to ${action} ${studentName}?`)) {
    //   return;
    // }

    try {
      setBlockingStudentId(studentId);
      const token = localStorage.getItem('token');

      await axios.patch(
        `/api/students/${studentId}`,
        { isBlocked: !isBlocked },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showSuccess(`Student ${studentName} ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
      fetchStudents();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to ${action} student`;
      showError(errorMessage);
    } finally {
      setBlockingStudentId(null);
    }
  };

  // Utility function to refresh the student list
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get('/api/students', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          limit: studentsPerPage,
          search: searchTerm,
          college: collegeFilter,
          subscriptionPlan: subscriptionPlanFilter,
          subscriptionStatus: subscriptionStatusFilter,
          batch: batchFilter,
          status: statusFilter,
        },
      });

      setStudents(response.data.students || []);
      setTotalPages(Math.ceil((response.data.total || 0) / studentsPerPage));
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch students';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle student deletion
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingStudentId(studentId);
      const token = localStorage.getItem('token');

      await axios.delete(`/api/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showSuccess(`Student ${studentName} deleted successfully`);

      // Refresh the students list
      fetchStudents();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete student';
      showError(errorMessage);
    } finally {
      setDeletingStudentId(null);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Student Management | Admin" description="Manage students">
        <div className="px-4 py-8">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Manage Students</h1>

              <div className="flex space-x-2">
                {/* Add Student Button */}
                <Button variant="primary" onClick={() => setShowAddStudentModal(true)}>
                  Add Student
                </Button>

                {/* Reset Filters Button */}
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Name or email"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* College Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <select
                    className="form-control"
                    value={collegeFilter}
                    onChange={e => setCollegeFilter(e.target.value)}
                  >
                    <option value="">All Colleges</option>
                    {loadingColleges ? (
                      <option disabled>Loading...</option>
                    ) : (
                      colleges?.map(college => (
                        <option key={college._id} value={college._id}>
                          {college.name}
                        </option>
                      )) || []
                    )}
                  </select>
                </div>

                {/* Batch Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <select
                    className="form-control"
                    value={batchFilter}
                    onChange={e => setBatchFilter(e.target.value)}
                  >
                    <option value="">All Batches</option>
                    {loadingBatches ? (
                      <option disabled>Loading...</option>
                    ) : (
                      batches?.map(batch => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name} ({batch.year})
                        </option>
                      )) || []
                    )}
                  </select>
                </div>

                {/* Subscription Plan Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                  <select
                    className="form-control"
                    value={subscriptionPlanFilter}
                    onChange={e => setSubscriptionPlanFilter(e.target.value)}
                  >
                    <option value="">All Plans</option>
                    {loadingSubscriptionPlans ? (
                      <option disabled>Loading...</option>
                    ) : (
                      subscriptionPlans?.map(plan => (
                        <option key={plan._id} value={plan._id}>
                          {plan.name}
                        </option>
                      )) || []
                    )}
                  </select>
                </div>

                {/* Subscription Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
                  <select
                    className="form-control"
                    value={subscriptionStatusFilter}
                    onChange={e => setSubscriptionStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending</option>
                    <option value="none">No Subscription</option>
                  </select>
                </div>

                {/* Account Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                  <select
                    className="form-control"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <Button type="button" variant="primary" onClick={handleSearch}>
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Students List */}
            {loading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
              </div>
            ) : error ? (
              <div className="alert alert-error">{error}</div>
            ) : !students || students.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No students found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        College & Batch
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students?.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        {/* Student Details */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName && student.lastName
                                ? `${student.firstName} ${student.lastName}`
                                : student.name}
                            </div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                            {student.mobile && (
                              <div className="text-xs text-gray-400">{student.mobile}</div>
                            )}
                            {student.rollNumber && (
                              <div className="text-xs text-gray-400">Roll: {student.rollNumber}</div>
                            )}
                            <div className="text-xs text-gray-400">
                              Joined: {new Date(student.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>

                        {/* College & Batch */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            {student.college ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {student.college.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {student.college.code}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-400">No College</div>
                            )}
                            {student.batch ? (
                              <>
                                <div className="text-sm text-gray-700 mt-1">
                                  {student.batch.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {student.batch.year}
                                  {student.batch.department && ` • ${student.batch.department}`}
                                  {student.batch.semester && ` • Sem ${student.batch.semester}`}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-400 mt-1">No Batch</div>
                            )}
                          </div>
                        </td>

                        {/* Subscription */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            {student.subscription ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {student.subscription.plan.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ₹{student.subscription.plan.price} • {student.subscription.plan.duration} months
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                                  student.subscription.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : student.subscription.status === 'expired'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {student.subscription.status}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(student.subscription.endDate).toLocaleDateString()}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-400">No Subscription</div>
                            )}
                          </div>
                        </td>

                        {/* Performance */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-900">
                              {student.examsTaken} exams taken
                            </div>
                            <div className="text-sm text-gray-700">
                              Avg: {student.averageScore ? `${student.averageScore.toFixed(1)}%` : 'N/A'}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col space-y-1">
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                              student.isBlocked 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {student.isBlocked ? 'Blocked' : 'Active'}
                            </div>
                            {student.isVerified !== undefined && (
                              <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                                student.isVerified 
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {student.isVerified ? 'Verified' : 'Unverified'}
                              </div>
                            )}
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col space-y-2">
                            <Link href={`/admin/students/${student._id}`}>
                              <span className="text-blue-600 hover:underline text-sm">
                                View Details
                              </span>
                            </Link>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleBlockStudent(
                                    student._id,
                                    student.firstName && student.lastName
                                      ? `${student.firstName} ${student.lastName}`
                                      : student.name,
                                    student.isBlocked
                                  )
                                }
                                className={`px-2 py-1 text-xs rounded ${
                                  student.isBlocked
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                                }`}
                                disabled={blockingStudentId === student._id}
                              >
                                {blockingStudentId === student._id ? (
                                  'Processing...'
                                ) : student.isBlocked ? (
                                  'Unblock'
                                ) : (
                                  'Block'
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteStudent(
                                    student._id,
                                    student.firstName && student.lastName
                                      ? `${student.firstName} ${student.lastName}`
                                      : student.name
                                  )
                                }
                                className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
                                disabled={deletingStudentId === student._id}
                              >
                                {deletingStudentId === student._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 flex justify-between items-center border-t">
                    <div>
                      <span className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add Student Modal */}
            {showAddStudentModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh]">
                  <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold">Add New Student</h3>
                    <button
                      onClick={() => {
                        setShowAddStudentModal(false);
                        setAddStudentError(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={handleAddStudent}
                    className="p-6 overflow-y-auto max-h-[calc(90vh-84px)]"
                  >
                    {addStudentError && (
                      <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                        {addStudentError}
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="student-first-name">First Name*</label>
                      <input
                        type="text"
                        id="student-first-name"
                        className="form-control"
                        value={newStudentFirstName}
                        onChange={e => setNewStudentFirstName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-last-name">Last Name*</label>
                      <input
                        type="text"
                        id="student-last-name"
                        className="form-control"
                        value={newStudentLastName}
                        onChange={e => setNewStudentLastName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-email">Email*</label>
                      <input
                        type="email"
                        id="student-email"
                        className="form-control"
                        value={newStudentEmail}
                        onChange={e => setNewStudentEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-password">Password*</label>
                      <input
                        type="password"
                        id="student-password"
                        className="form-control"
                        value={newStudentPassword}
                        onChange={e => setNewStudentPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 6 characters
                      </p>
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-mobile">Mobile Number</label>
                      <input
                        type="tel"
                        id="student-mobile"
                        className="form-control"
                        value={newStudentMobile}
                        onChange={e => setNewStudentMobile(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-dob">Date of Birth</label>
                      <input
                        type="date"
                        id="student-dob"
                        className="form-control"
                        value={newStudentDateOfBirth}
                        onChange={e => setNewStudentDateOfBirth(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-roll-number">Roll Number</label>
                      <input
                        type="text"
                        id="student-roll-number"
                        className="form-control"
                        value={newStudentRollNumber}
                        onChange={e => setNewStudentRollNumber(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-batch">Batch</label>
                      <select
                        id="student-batch"
                        className="form-control"
                        value={newStudentBatch}
                        onChange={e => setNewStudentBatch(e.target.value)}
                      >
                        <option value="">-- Select Batch (Optional) --</option>
                        {loadingBatches ? (
                          <option disabled>Loading batches...</option>
                        ) : (
                          batches?.map(batch => (
                            <option key={batch._id} value={batch._id}>
                              {batch.name} ({batch.year})
                            </option>
                          )) || []
                        )}
                      </select>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddStudentModal(false);
                          setAddStudentError(null);
                        }}
                        className="mr-2"
                        disabled={isAddingStudent}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" disabled={isAddingStudent}>
                        {isAddingStudent ? 'Adding...' : 'Add Student'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add Snackbar component for toast notifications */}
            <Snackbar
              open={toast.open}
              message={toast.message}
              type={toast.type}
              onClose={hideToast}
            />
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default StudentsPage;
