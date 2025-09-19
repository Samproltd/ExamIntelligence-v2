import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';

interface Exam {
  _id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  totalQuestions: number;
  questionsToDisplay: number;
  maxAttempts: number;
  isActive: boolean;
  examType: 'practice' | 'assessment' | 'final';
  proctoringLevel: 'basic' | 'advanced' | 'ai_enhanced';
  course: {
    _id: string;
    name: string;
    subject: {
      _id: string;
      name: string;
      college: {
        _id: string;
        name: string;
        code: string;
      };
    };
  };
  college: {
    _id: string;
    name: string;
    code: string;
  };
  assignedBatches?: Array<{
    _id: string;
    name: string;
    description: string;
    year: number;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Course {
  _id: string;
  name: string;
  subject: {
    _id: string;
    name: string;
    college: {
      _id: string;
      name: string;
      code: string;
    };
  };
  college: {
    _id: string;
    name: string;
    code: string;
  };
}

const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examName, setExamName] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState(30); // Default 30 minutes
  const [examTotalMarks, setExamTotalMarks] = useState(100); // Default 100 marks
  const [examPassPercentage, setExamPassPercentage] = useState(40); // Default 40%
  const [examTotalQuestions, setExamTotalQuestions] = useState(10); // Default 10 questions
  const [examQuestionsToDisplay, setExamQuestionsToDisplay] = useState(5); // Default 5 questions
  const [examMaxAttempts, setExamMaxAttempts] = useState(1); // Default 1 attempt
  const [examType, setExamType] = useState<'practice' | 'assessment' | 'final'>('assessment');
  const [proctoringLevel, setProctoringLevel] = useState<'basic' | 'advanced' | 'ai_enhanced'>('basic');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch batches for a specific course
  const fetchBatches = async (courseId: string) => {
    if (!courseId) {
      setBatches([]);
      return;
    }

    try {
      setLoadingBatches(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/batches?course=${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBatches(response.data.batches || []);
    } catch (err: any) {
      console.error('Failed to fetch batches:', err);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  // Fetch exams and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch exams
        const examsResponse = await axios.get('/api/exams', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch courses for dropdown
        const coursesResponse = await axios.get('/api/courses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setExams(examsResponse.data.exams);
        setCourses(coursesResponse.data.courses);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch batches when course changes
  useEffect(() => {
    if (selectedCourse) {
      fetchBatches(selectedCourse);
    } else {
      setBatches([]);
    }
  }, [selectedCourse]);

  // Reset form
  const resetForm = () => {
    setExamName('');
    setExamDescription('');
    setExamDuration(30);
    setExamTotalMarks(100);
    setExamPassPercentage(40);
    setExamTotalQuestions(10);
    setExamQuestionsToDisplay(5);
    setExamMaxAttempts(1);
    setExamType('assessment');
    setProctoringLevel('basic');
    setSelectedCourse('');
    setSelectedBatches([]);
    setEditingExam(null);
    setFormError(null);
  };

  // Handle edit exam
  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamName(exam.name);
    setExamDescription(exam.description);
    setExamDuration(exam.duration);
    setExamTotalMarks(exam.totalMarks);
    setExamPassPercentage(exam.passPercentage);
    setExamTotalQuestions(exam.totalQuestions);
    setExamQuestionsToDisplay(exam.questionsToDisplay);
    setExamMaxAttempts(exam.maxAttempts || 1);
    setExamType(exam.examType || 'assessment');
    setProctoringLevel(exam.proctoringLevel || 'basic');
    setSelectedCourse(exam.course._id);
    setSelectedBatches(
      exam.assignedBatches
        ?.filter(batch => batch && batch._id)
        ?.map(batch => batch._id) || []
    );
    setShowForm(true);
  };

  // Handle exam creation/update
  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examName.trim() || !examDescription.trim() || !selectedCourse) {
      setFormError('All fields are required');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const token = localStorage.getItem('token');
      const payload = {
        name: examName,
        description: examDescription,
        duration: examDuration,
        totalMarks: examTotalMarks,
        passPercentage: examPassPercentage,
        totalQuestions: examTotalQuestions,
        questionsToDisplay: examQuestionsToDisplay,
        maxAttempts: examMaxAttempts,
        examType: examType,
        proctoringLevel: proctoringLevel,
        course: selectedCourse,
        assignedBatches: selectedBatches,
      };

      let response;
      if (editingExam) {
        // Update existing exam
        response = await axios.put(
          `/api/exams/${editingExam._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Update exam in the list
        const selectedCourseObj = courses.find(c => c._id === selectedCourse);
        const updatedExam = {
          ...response.data.exam,
          course: {
            _id: selectedCourse,
            name: selectedCourseObj?.name || '',
            subject: {
              _id: selectedCourseObj?.subject._id || '',
              name: selectedCourseObj?.subject.name || '',
            },
          },
        };

        setExams(exams.map(exam => 
          exam._id === editingExam._id ? updatedExam : exam
        ));
      } else {
        // Create new exam
        response = await axios.post(
          '/api/exams',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Add new exam to the list with course info
        const selectedCourseObj = courses.find(c => c._id === selectedCourse);
        const newExam = {
          ...response.data.exam,
          course: {
            _id: selectedCourse,
            name: selectedCourseObj?.name || '',
            subject: {
              _id: selectedCourseObj?.subject._id || '',
              name: selectedCourseObj?.subject.name || '',
            },
          },
        };

        setExams([...exams, newExam]);
      }

      // Reset form and close
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || `Failed to ${editingExam ? 'update' : 'create'} exam`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle delete exam
  const handleDeleteExam = (exam: Exam) => {
    setExamToDelete(exam);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!examToDelete) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');

      await axios.delete(`/api/exams/${examToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove exam from the list
      setExams(exams.filter(exam => exam._id !== examToDelete._id));
      
      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setExamToDelete(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to delete exam');
    } finally {
      setDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setExamToDelete(null);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Manage Exams - Online Exam Portal">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Exams</h1>
            <Button
              variant="primary"
              onClick={() => {
                if (showForm) {
                  resetForm();
                  setShowForm(false);
                } else {
                  setShowForm(true);
                }
              }}
              disabled={courses.length === 0}
            >
              {showForm ? 'Cancel' : 'Add Exam'}
            </Button>
          </div>

          {/* Add/Edit Exam Form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-bold mb-4">
                {editingExam ? 'Edit Exam' : 'Add New Exam'}
              </h2>

              {formError && <div className="alert alert-error mb-4">{formError}</div>}

              <form onSubmit={handleSubmitExam}>
                <div className="form-group">
                  <label htmlFor="exam-name">Exam Name</label>
                  <input
                    type="text"
                    id="exam-name"
                    className="form-control"
                    value={examName}
                    onChange={e => setExamName(e.target.value)}
                    placeholder="Enter exam name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="exam-description">Description</label>
                  <textarea
                    id="exam-description"
                    className="form-control"
                    value={examDescription}
                    onChange={e => setExamDescription(e.target.value)}
                    placeholder="Enter exam description"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="course-select">Course</label>
                  <select
                    id="course-select"
                    className="form-control"
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses
                      .filter(course => course && course._id && course.name)
                      .map(course => (
                        <option key={course._id} value={course._id}>
                          {course.name} - {course.subject?.name || 'N/A'} ({course.college?.name || 'N/A'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label htmlFor="exam-duration">Duration (minutes)</label>
                    <input
                      type="number"
                      id="exam-duration"
                      className="form-control"
                      value={examDuration}
                      onChange={e => setExamDuration(parseInt(e.target.value))}
                      min={1}
                      max={240}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="exam-marks">Total Marks</label>
                    <input
                      type="number"
                      id="exam-marks"
                      className="form-control"
                      value={examTotalMarks}
                      onChange={e => setExamTotalMarks(parseInt(e.target.value))}
                      min={1}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="exam-pass">Pass Percentage (%)</label>
                    <input
                      type="number"
                      id="exam-pass"
                      className="form-control"
                      value={examPassPercentage}
                      onChange={e => setExamPassPercentage(parseInt(e.target.value))}
                      min={0}
                      max={100}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="form-group">
                    <label htmlFor="exam-total-questions">Total Questions</label>
                    <input
                      type="number"
                      id="exam-total-questions"
                      className="form-control"
                      value={examTotalQuestions}
                      onChange={e => setExamTotalQuestions(parseInt(e.target.value))}
                      min={1}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="exam-questions-to-display">Questions to Display</label>
                    <input
                      type="number"
                      id="exam-questions-to-display"
                      className="form-control"
                      value={examQuestionsToDisplay}
                      onChange={e => setExamQuestionsToDisplay(parseInt(e.target.value))}
                      min={1}
                      max={examTotalQuestions}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="form-group">
                    <label htmlFor="exam-max-attempts">Max Attempts</label>
                    <input
                      type="number"
                      id="exam-max-attempts"
                      className="form-control"
                      value={examMaxAttempts}
                      onChange={e => setExamMaxAttempts(parseInt(e.target.value))}
                      min={1}
                      max={10}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="exam-type">Exam Type</label>
                    <select
                      id="exam-type"
                      className="form-control"
                      value={examType}
                      onChange={e => setExamType(e.target.value as 'practice' | 'assessment' | 'final')}
                      required
                    >
                      <option value="practice">Practice</option>
                      <option value="assessment">Assessment</option>
                      <option value="final">Final</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="proctoring-level">Proctoring Level</label>
                    <select
                      id="proctoring-level"
                      className="form-control"
                      value={proctoringLevel}
                      onChange={e => setProctoringLevel(e.target.value as 'basic' | 'advanced' | 'ai_enhanced')}
                      required
                    >
                      <option value="basic">Basic</option>
                      <option value="advanced">Advanced</option>
                      <option value="ai_enhanced">AI Enhanced</option>
                    </select>
                  </div>
                </div>

                {/* Batch Assignment Section */}
                <div className="form-group mt-4">
                  <label className="block mb-2 font-medium">Assign to Batches</label>
                  <div className="mb-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <strong>Important:</strong> Exams are only visible to students in the
                    assigned batches. If no batches are selected, no students will be able to
                    see or take this exam.
                  </div>

                  {loadingBatches ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary-color rounded-full"></div>
                      Loading batches...
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      {selectedCourse ? 'No batches available for this course' : 'Select a course first to see available batches'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                      {batches
                        .filter(batch => batch && batch._id && batch.name)
                        .map(batch => (
                          <label key={batch._id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedBatches.includes(batch._id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedBatches([...selectedBatches, batch._id]);
                                } else {
                                  setSelectedBatches(selectedBatches.filter(id => id !== batch._id));
                                }
                              }}
                              className="rounded border-gray-300 text-primary-color focus:ring-primary-color"
                            />
                            <span className="text-sm">
                              {batch.name} ({batch.year || 'N/A'})
                            </span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-4">
                  <Button type="submit" variant="primary" disabled={formSubmitting}>
                    {formSubmitting 
                      ? (editingExam ? 'Updating...' : 'Creating...') 
                      : (editingExam ? 'Update Exam' : 'Create Exam')
                    }
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* No Courses Warning */}
          {courses.length === 0 && !loading && (
            <div className="alert alert-error mb-6">
              You need to create at least one course before you can add exams.
            </div>
          )}

          {/* Exams List */}
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : exams.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500 mb-4">No exams found.</p>
              {courses.length > 0 && (
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  Add Your First Exam
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams
                .filter(exam => exam && exam._id)
                .map(exam => (
                <div key={exam._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{exam.name || 'Untitled Exam'}</h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {exam.college?.name || 'N/A'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{exam.description || 'No description'}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Duration:</span>
                      <span className="ml-1 text-gray-600">{exam.duration} min</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Total Marks:</span>
                      <span className="ml-1 text-gray-600">{exam.totalMarks}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Pass %:</span>
                      <span className="ml-1 text-gray-600">{exam.passPercentage}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Questions:</span>
                      <span className="ml-1 text-gray-600">{exam.questionsToDisplay}/{exam.totalQuestions}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1 mb-4">
                    <p><strong>Course:</strong> {exam.course?.name || 'N/A'}</p>
                    <p><strong>Subject:</strong> {exam.course?.subject?.name || 'N/A'}</p>
                    <p><strong>College:</strong> {exam.college?.name || 'N/A'} ({exam.college?.code || 'N/A'})</p>
                    <p><strong>Type:</strong> {exam.examType || 'assessment'} | <strong>Attempts:</strong> {exam.maxAttempts || 1}</p>
                    <p><strong>Assigned Batches:</strong> {exam.assignedBatches?.length || 0}</p>
                    {exam.assignedBatches && exam.assignedBatches.length > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-blue-600">
                          {exam.assignedBatches
                            .filter(batch => batch && batch.name)
                            .map(batch => batch.name)
                            .join(', ') || 'No valid batches'}
                        </span>
                      </div>
                    )}
                    <p><strong>Created by:</strong> {exam.createdBy?.name || 'N/A'}</p>
                    <p><strong>Created:</strong> {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditExam(exam)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => window.location.href = `/admin/exams/${exam._id}/questions`}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Questions
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && examToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete the exam "{examToDelete.name}"? 
                  This action cannot be undone and will also delete all associated questions and results.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default ExamsPage;
