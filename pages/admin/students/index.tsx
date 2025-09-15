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
  batch?: {
    _id: string;
    name: string;
  };
  isBlocked?: boolean;
}

interface Batch {
  _id: string;
  name: string;
  description: string;
  year: number;
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

  // Batches for dropdown
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

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
          },
        });

        setStudents(response.data.students);
        setTotalPages(Math.ceil(response.data.total / studentsPerPage));
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
  }, [currentPage, searchTerm]);

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoadingBatches(true);
        const token = localStorage.getItem('token');

        const response = await axios.get('/api/batches', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            limit: 100, // Fetch a large number to get all batches
            sort: 'name', // Sort by name
          },
        });

        setBatches(response.data.batches);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch batches';
        console.error('Failed to fetch batches:', err);
        showError(errorMessage);
      } finally {
        setLoadingBatches(false);
      }
    };

    // Fetch batches when the modal is opened
    if (showAddStudentModal) {
      fetchBatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddStudentModal]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
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

      // console.log('Response to the admin :',JSON.stringify(response))
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
    console.log('status:', isBlocked);
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
        },
      });

      setStudents(response.data.students);
      setTotalPages(Math.ceil(response.data.total / studentsPerPage));
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

                {/* Search form */}
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    className="form-control rounded-r-none"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="primary" className="rounded-l-none">
                    Search
                  </Button>
                </form>
              </div>
            </div>

            {/* Students List */}
            {loading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
              </div>
            ) : error ? (
              <div className="alert alert-error">{error}</div>
            ) : students.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No students found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exams Taken
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {student.batch ? student.batch.name : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.examsTaken}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {student.averageScore ? `${student.averageScore.toFixed(1)}%` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
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
                              className={`px-2 py-1 text-sm rounded border ${
                                student.isBlocked
                                  ? 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'
                                  : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200'
                              }`}
                              aria-label={student.isBlocked ? 'Unblock student' : 'Block student'}
                              disabled={blockingStudentId === student._id}
                            >
                              {blockingStudentId === student._id ? (
                                <span className="flex items-center">
                                  <svg
                                    className={`animate-spin -ml-1 mr-2 h-4 w-4 ${student.isBlocked ? 'text-green-600' : 'text-yellow-600'}`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  {student.isBlocked ? 'Unblocking...' : 'Blocking...'}
                                </span>
                              ) : student.isBlocked ? (
                                'Unblock'
                              ) : (
                                'Block'
                              )}
                            </button>

                            <Link href={`/admin/students/${student._id}`}>
                              <span className="text-primary-color hover:underline">
                                View Details
                              </span>
                            </Link>
                            <button
                              onClick={() =>
                                handleDeleteStudent(
                                  student._id,
                                  student.firstName && student.lastName
                                    ? `${student.firstName} ${student.lastName}`
                                    : student.name
                                )
                              }
                              className="px-2 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200"
                              aria-label="Delete student"
                              disabled={deletingStudentId === student._id}
                            >
                              {deletingStudentId === student._id ? (
                                <span className="flex items-center">
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Deleting...
                                </span>
                              ) : (
                                'Delete'
                              )}
                            </button>
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
                          batches.map(batch => (
                            <option key={batch._id} value={batch._id}>
                              {batch.name} ({batch.year})
                            </option>
                          ))
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
