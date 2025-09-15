import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';
import QuestionForm from '../../../components/QuestionForm';
import Snackbar from '../../../components/Snackbar';
import * as XLSX from 'xlsx';

interface Exam {
  _id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  totalQuestions: number;
  questionsToDisplay: number;
  course: {
    _id: string;
    name: string;
    subject: {
      _id: string;
      name: string;
    };
  };
  assignedBatches?: Array<{
    _id: string;
    name: string;
    description: string;
    year: number;
  }>;
  createdAt: string;
}

interface Question {
  _id: string;
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  exam: string;
}

const ExamDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit exam state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editTotalMarks, setEditTotalMarks] = useState(100);
  const [editPassPercentage, setEditPassPercentage] = useState(40);
  const [editTotalQuestions, setEditTotalQuestions] = useState(10);
  const [editQuestionsToDisplay, setEditQuestionsToDisplay] = useState(5);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Batches state
  const [batches, setBatches] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Add/edit question state
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Delete exam state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
  });

  // Fetch batches
  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const token = localStorage.getItem('token');

      const response = await axios.get('/api/batches', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBatches(response.data.batches);
    } catch (err: any) {
      console.error('Failed to fetch batches:', err);
      setSnackbar({
        open: true,
        message: 'Failed to fetch batches',
        type: 'error',
      });
    } finally {
      setLoadingBatches(false);
    }
  };

  // Fetch exam and questions
  useEffect(() => {
    if (!id) return;

    const fetchExamAndQuestions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch exam details
        const examResponse = await axios.get(`/api/exams/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const examData = examResponse.data.exam;
        setExam(examData);
        setEditName(examData.name);
        setEditDescription(examData.description);
        setEditDuration(examData.duration);
        setEditTotalMarks(examData.totalMarks);
        setEditPassPercentage(examData.passPercentage);
        setEditTotalQuestions(examData.totalQuestions);
        setEditQuestionsToDisplay(examData.questionsToDisplay);

        // Set selected batches if they exist
        if (examData.assignedBatches && examData.assignedBatches.length > 0) {
          setSelectedBatchIds(examData.assignedBatches.map((batch: any) => batch._id));
        }

        // Fetch questions for this exam
        const questionsResponse = await axios.get(`/api/exams/${id}/questions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setQuestions(questionsResponse.data.questions);

        // Fetch batches
        await fetchBatches();

        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch exam data');
      } finally {
        setLoading(false);
      }
    };

    fetchExamAndQuestions();
  }, [id]);

  // Handle exam update
  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim() || !editDescription.trim()) {
      setUpdateError('All fields are required');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      const token = localStorage.getItem('token');

      const response = await axios.put(
        `/api/exams/${id}`,
        {
          name: editName,
          description: editDescription,
          duration: editDuration,
          totalMarks: editTotalMarks,
          passPercentage: editPassPercentage,
          totalQuestions: editTotalQuestions,
          questionsToDisplay: editQuestionsToDisplay,
          assignedBatches: selectedBatchIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setExam({
        ...response.data.exam,
        course: exam!.course, // Keep the course info
      });
      setIsEditing(false);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Exam updated successfully',
        type: 'success',
      });
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Failed to update exam');

      // Show error message
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to update exam',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle question submission (add or update)
  const handleQuestionSubmit = async (questionData: {
    id?: string;
    text: string;
    options: Array<{
      text: string;
      isCorrect: boolean;
    }>;
  }) => {
    try {
      const token = localStorage.getItem('token');
      let response;

      if (questionData.id) {
        // Update existing question
        response = await axios.put(
          `/api/exams/${id}/questions/${questionData.id}`,
          {
            text: questionData.text,
            options: questionData.options,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Update the questions list
        setQuestions(
          questions.map(q => (q._id === questionData.id ? { ...q, ...response.data.question } : q))
        );
      } else {
        // Add new question
        response = await axios.post(
          `/api/exams/${id}/questions`,
          {
            text: questionData.text,
            options: questionData.options,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Add new question to the list
        setQuestions([...questions, response.data.question]);
      }

      // Reset form state
      setShowQuestionForm(false);
      setEditingQuestion(null);

      // Show success message
      setSnackbar({
        open: true,
        message: questionData.id ? 'Question updated successfully' : 'Question added successfully',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to save question',
        type: 'error',
      });
    }
  };

  // State for question deletion confirmation
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [showQuestionDeleteConfirm, setShowQuestionDeleteConfirm] = useState(false);

  // Confirm delete question
  const confirmDeleteQuestion = (questionId: string) => {
    setDeletingQuestionId(questionId);
    setShowQuestionDeleteConfirm(true);
  };

  // Delete question
  const handleDeleteQuestion = async () => {
    if (!deletingQuestionId) return;

    try {
      setIsDeletingQuestion(true);
      const token = localStorage.getItem('token');

      await axios.delete(`/api/exams/${id}/questions/${deletingQuestionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove question from list
      setQuestions(questions.filter(q => q._id !== deletingQuestionId));
      setShowQuestionDeleteConfirm(false);
      setDeletingQuestionId(null);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Question deleted successfully',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to delete question',
        type: 'error',
      });
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  // Handle exam deletion
  const handleDeleteExam = async () => {
    try {
      setIsDeleting(true);

      const token = localStorage.getItem('token');

      await axios.delete(`/api/exams/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push('/admin/exams');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete exam');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title={exam ? `${exam.name} - Admin` : 'Exam Details'}>
        <div>
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error mb-4">{error}</div>
          ) : exam ? (
            <>
              {/* Exam Header with Actions */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button
                      onClick={() => router.push('/admin/exams')}
                      className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                      ← Back
                    </button>
                    <h1 className="text-3xl font-bold">{exam.name}</h1>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                      {isEditing ? 'Cancel' : 'Edit Exam'}
                    </Button>

                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(true)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Exam Course */}
                <div className="text-sm text-gray-500 mb-2">
                  Course: {exam.course.name} | Subject: {exam.course.subject.name}
                </div>

                {/* Exam Meta Info */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Duration:</span> {exam.duration} minutes
                  </div>
                  <div>
                    <span className="font-medium">Total Marks:</span> {exam.totalMarks}
                  </div>
                  <div>
                    <span className="font-medium">Pass Percentage:</span> {exam.passPercentage}%
                  </div>
                  <div>
                    <span className="font-medium">Total Questions:</span> {exam.totalQuestions}
                  </div>
                  <div>
                    <span className="font-medium">Questions to Display:</span>{' '}
                    {exam.questionsToDisplay}
                  </div>
                </div>

                {/* Exam Description */}
                {!isEditing && (
                  <>
                    <p className="text-gray-600 mb-4">{exam.description}</p>

                    {/* Display assigned batches */}
                    <div className="mt-4">
                      <h3 className="text-md font-medium mb-2">Assigned to Batches:</h3>
                      {exam.assignedBatches && exam.assignedBatches.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {exam.assignedBatches.map(batch => (
                            <span
                              key={batch._id}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {batch.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          This exam is not assigned to any batches yet.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Edit Exam Form */}
                {isEditing && (
                  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-bold mb-4">Edit Exam</h2>

                    {updateError && <div className="alert alert-error mb-4">{updateError}</div>}

                    <form onSubmit={handleUpdateExam}>
                      <div className="form-group">
                        <label htmlFor="edit-name">Exam Name</label>
                        <input
                          type="text"
                          id="edit-name"
                          className="form-control"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-description">Description</label>
                        <textarea
                          id="edit-description"
                          className="form-control"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          rows={3}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label htmlFor="edit-duration">Duration (minutes)</label>
                          <input
                            type="number"
                            id="edit-duration"
                            className="form-control"
                            value={editDuration}
                            onChange={e => {
                              const val = e.target.value;
                              setEditDuration(val ? parseInt(val) : 0);
                            }}
                            min={1}
                            max={240}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="edit-marks">Total Marks</label>
                          <input
                            type="number"
                            id="edit-marks"
                            className="form-control"
                            value={editTotalMarks}
                            onChange={e => {
                              const val = e.target.value;
                              setEditTotalMarks(val ? parseInt(val) : 0);
                            }}
                            min={1}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="edit-pass">Pass Percentage (%)</label>
                          <input
                            type="number"
                            id="edit-pass"
                            className="form-control"
                            value={editPassPercentage}
                            onChange={e => {
                              const val = e.target.value;
                              setEditPassPercentage(val ? parseInt(val) : 0);
                            }}
                            min={0}
                            max={100}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="form-group">
                          <label htmlFor="edit-total-questions">Total Questions</label>
                          <input
                            type="number"
                            id="edit-total-questions"
                            className="form-control"
                            value={editTotalQuestions}
                            onChange={e => {
                              const val = e.target.value;
                              setEditTotalQuestions(val ? parseInt(val) : 0);
                            }}
                            min={1}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="edit-questions-to-display">Questions to Display</label>
                          <input
                            type="number"
                            id="edit-questions-to-display"
                            className="form-control"
                            value={editQuestionsToDisplay}
                            onChange={e => {
                              const val = e.target.value;
                              setEditQuestionsToDisplay(val ? parseInt(val) : 0);
                            }}
                            min={1}
                            max={editTotalQuestions}
                            required
                          />
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
                          <div className="text-sm text-gray-500">No batches available</div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {batches.map(batch => (
                                <div key={batch._id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`batch-${batch._id}`}
                                    className="mr-2 h-4 w-4"
                                    checked={selectedBatchIds.includes(batch._id)}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setSelectedBatchIds([...selectedBatchIds, batch._id]);
                                      } else {
                                        setSelectedBatchIds(
                                          selectedBatchIds.filter(id => id !== batch._id)
                                        );
                                      }
                                    }}
                                  />
                                  <label htmlFor={`batch-${batch._id}`} className="text-sm">
                                    {batch.name}
                                  </label>
                                </div>
                              ))}
                            </div>

                            {selectedBatchIds.length === 0 && (
                              <div className="mt-2 text-sm text-red-600">
                                Warning: No batches selected. This exam will not be visible to any
                                students.
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button type="submit" variant="primary" disabled={isUpdating}>
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                      <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
                      <p className="mb-6 text-gray-600">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold">{exam.name}</span>? This will also delete
                        all questions and student results for this exam. This action cannot be
                        undone.
                      </p>
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleDeleteExam}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Exam'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions Section */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Questions</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Export questions to Excel
                        const worksheet = XLSX.utils.json_to_sheet(
                          questions.map(q => ({
                            text: q.text,
                            option1: q.options[0].text,
                            option2: q.options[1].text,
                            option3: q.options[2].text,
                            option4: q.options[3].text,
                            correctOption: q.options.findIndex(opt => opt.isCorrect) + 1,
                          }))
                        );

                        // Set column widths
                        worksheet['!cols'] = [
                          { wch: 40 }, // text
                          { wch: 25 }, // option1
                          { wch: 25 }, // option2
                          { wch: 25 }, // option3
                          { wch: 25 }, // option4
                          { wch: 15 }, // correctOption
                        ];

                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

                        // Generate file name with exam name
                        const fileName = `${exam?.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_questions.xlsx`;

                        // Save the file
                        XLSX.writeFile(workbook, fileName);
                      }}
                    >
                      Export to Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/exams/${id}/upload-questions`)}
                    >
                      Bulk Upload
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingQuestion(null);
                        setShowQuestionForm(!showQuestionForm);
                      }}
                    >
                      {showQuestionForm && !editingQuestion ? 'Cancel' : 'Add Question'}
                    </Button>
                  </div>
                </div>

                {/* Question Form (Add/Edit) - Inline form only for adding new question */}
                {showQuestionForm && !editingQuestion && (
                  <div className="mb-8">
                    <QuestionForm
                      onSubmit={handleQuestionSubmit}
                      onCancel={() => {
                        setShowQuestionForm(false);
                      }}
                    />
                  </div>
                )}

                {/* Question Edit Modal - For editing existing questions */}
                {editingQuestion && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
                      <div className="p-1 max-h-[90vh] overflow-y-auto">
                        <QuestionForm
                          initialQuestion={{
                            id: editingQuestion._id,
                            text: editingQuestion.text,
                            options: editingQuestion.options,
                          }}
                          onSubmit={questionData => {
                            handleQuestionSubmit(questionData);
                            setEditingQuestion(null);
                          }}
                          onCancel={() => {
                            setEditingQuestion(null);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions List */}
                {questions.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-500 mb-4">No questions added to this exam yet.</p>
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/exams/${id}/upload-questions`)}
                      >
                        Bulk Upload Questions
                      </Button>
                      <Button variant="primary" onClick={() => setShowQuestionForm(true)}>
                        Add Individual Question
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={question._id} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold mb-3">Question {index + 1}</h3>
                          <div className="flex space-x-2">
                            <button
                              className="text-primary-color hover:underline"
                              onClick={() => {
                                setEditingQuestion(question);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500 hover:underline"
                              onClick={() => confirmDeleteQuestion(question._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <p className="mb-4">{question.text}</p>

                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-md ${
                                option.isCorrect
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className="mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                <span>{option.text}</span>
                                {option.isCorrect && (
                                  <span className="ml-auto text-green-600 text-sm">Correct</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Delete Confirmation Modal */}
              {showQuestionDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <h3 className="text-xl font-bold mb-4">Confirm Question Deletion</h3>
                    <p className="mb-6 text-gray-600">
                      Are you sure you want to delete this question? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowQuestionDeleteConfirm(false);
                          setDeletingQuestionId(null);
                        }}
                        disabled={isDeletingQuestion}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleDeleteQuestion}
                        disabled={isDeletingQuestion}
                      >
                        {isDeletingQuestion ? 'Deleting...' : 'Delete Question'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Snackbar for notifications */}
              <Snackbar
                open={snackbar.open}
                message={snackbar.message}
                type={snackbar.type}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
              />
            </>
          ) : null}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default ExamDetailPage;
