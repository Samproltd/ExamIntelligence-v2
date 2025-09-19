import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardDocumentListIcon,
  UsersIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../../components/AdminLayout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useRouter } from 'next/router';

interface Exam {
  _id: string;
  name: string;
  description: string;
  course?: {
    _id: string;
    name: string;
    subject?: {
      _id: string;
      name: string;
      college?: {
        _id: string;
        name: string;
        code: string;
      };
    };
  };
  college?: {
    _id: string;
    name: string;
    code: string;
  };
  duration: number;
  totalMarks: number;
  assignedBatches?: string[];
  createdAt: string;
}

interface Batch {
  _id: string;
  name: string;
  description: string;
  year: number;
  subject?: {
    _id: string;
    name: string;
  };
  college?: {
    _id: string;
    name: string;
    code: string;
  };
  department?: string;
  semester?: number;
  isActive: boolean;
}

interface ExamBatchAssignment {
  _id: string;
  exam: Exam;
  batch: Batch;
  assignedBy: {
    _id: string;
    name: string;
  };
  assignmentDate: string;
  isActive: boolean;
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignModal: React.FC<AssignModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchExams();
      fetchBatches();
    }
  }, [isOpen]);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Fetched exams data:', data);
      setExams(data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Fetched batches data:', data);
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleBatchToggle = (batchId: string) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam || selectedBatches.length === 0) {
      alert('Please select an exam and at least one batch');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/assign-exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          examId: selectedExam,
          batchIds: selectedBatches
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setSelectedExam('');
        setSelectedBatches([]);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to assign exam to batches');
      }
    } catch (error) {
      console.error('Error assigning exam:', error);
      alert('Failed to assign exam to batches');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (batch.college?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (batch.subject?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Assign Exam to Batches</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose an exam</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.name} - {exam.course?.name || 'No Course'} ({exam.college?.name || 'No College'})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Batches</label>
            
            {/* Search */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search batches by name, college, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Batch List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4">
              {filteredBatches.map((batch) => (
                <div
                  key={batch._id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedBatches.includes(batch._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleBatchToggle(batch._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{batch.name}</h4>
                      <p className="text-sm text-gray-600">
                        {batch.subject?.name || 'No Subject'} • {batch.college?.name || 'No College'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Year: {batch.year} {batch.department && `• ${batch.department}`}
                      </p>
                    </div>
                    <div className="ml-3">
                      {selectedBatches.includes(batch._id) ? (
                        <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedBatches.length > 0 && (
              <p className="mt-2 text-sm text-blue-600">
                {selectedBatches.length} batch{selectedBatches.length > 1 ? 'es' : ''} selected
              </p>
            )}
          </div>

          {/* Submit Buttons */}
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
              {loading ? 'Assigning...' : 'Assign Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignExamsPage: React.FC = () => {
  const router = useRouter();
  const [assignments, setAssignments] = useState<ExamBatchAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/exam-batch-assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      setAssignments(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (examId: string, batchId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/assign-exams', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ examId, batchId })
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (assignment.batch.college?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedAssignments = filteredAssignments.reduce((acc, assignment) => {
    const examId = assignment.exam._id;
    if (!acc[examId]) {
      acc[examId] = {
        exam: assignment.exam,
        batches: []
      };
    }
    acc[examId].batches.push(assignment);
    return acc;
  }, {} as Record<string, { exam: Exam; batches: ExamBatchAssignment[] }>);

  if (loading) {
    return (
      <AdminLayout title="Assign Exams to Batches">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Assign Exams to Batches">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Exam-Batch Assignments</h1>
          <p className="text-purple-100">
            Assign exams to batches so students can access them through their subscription plans
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search exams or batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Assign Exam
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
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
                  <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Assigned Exams</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {Object.keys(groupedAssignments).length}
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
                  <UsersIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Unique Batches</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Set(assignments.map(a => a.batch._id)).size}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {Object.values(groupedAssignments).map(({ exam, batches }) => (
            <motion.div
              key={exam._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{exam.name}</h3>
                    <p className="text-sm text-gray-600">
                      {exam.course?.name || 'No Course'} • {exam.college?.name || 'No College'} • {exam.duration} minutes
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {batches.length} batch{batches.length > 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {batches.map((assignment) => (
                    <div
                      key={`${exam._id}-${assignment.batch._id}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{assignment.batch.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.batch.subject?.name || 'No Subject'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {assignment.batch.college?.name || 'No College'} • Year {assignment.batch.year}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Assigned: {new Date(assignment.assignmentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(exam._id, assignment.batch._id)}
                          className="text-red-400 hover:text-red-600 ml-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {Object.keys(groupedAssignments).length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by assigning your first exam to batches.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Assign First Exam
                </button>
              </div>
            )}
          </div>
        )}

        {/* Assign Modal */}
        <AssignModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchAssignments}
        />
      </div>
    </AdminLayout>
  );
};

export default AssignExamsPage;
