import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';

interface Question {
  _id: string;
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  category: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const SingleQuestionPage: React.FC = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionCategory, setQuestionCategory] = useState('');
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch questions and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get('/api/questions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setQuestions(response.data.questions);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(response.data.questions.map((q: Question) => q.category))];
        setCategories(uniqueCategories);
        
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset form
  const resetForm = () => {
    setQuestionText('');
    setQuestionCategory('');
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
    setEditingQuestion(null);
    setFormError(null);
  };

  // Handle edit question
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.text);
    setQuestionCategory(question.category);
    setOptions(question.options);
    setShowForm(true);
  };

  // Handle option change
  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  // Handle correct option change
  const handleCorrectOptionChange = (index: number) => {
    const newOptions = options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));
    setOptions(newOptions);
  };

  // Add option
  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: '', isCorrect: false }]);
    }
  };

  // Remove option
  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim() || !questionCategory.trim()) {
      setFormError('Question text and category are required');
      return;
    }

    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      setFormError('At least 2 options are required');
      return;
    }

    if (!validOptions.some(option => option.isCorrect)) {
      setFormError('At least one option must be marked as correct');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const token = localStorage.getItem('token');
      const payload = {
        text: questionText,
        category: questionCategory,
        options: validOptions,
      };

      let response;
      if (editingQuestion) {
        // Update existing question
        response = await axios.put(
          `/api/questions/${editingQuestion._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setQuestions(questions.map(q => 
          q._id === editingQuestion._id ? response.data.question : q
        ));
      } else {
        // Create new question
        response = await axios.post(
          '/api/questions',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setQuestions([...questions, response.data.question]);
        
        // Add category if it's new
        if (!categories.includes(questionCategory)) {
          setCategories([...categories, questionCategory]);
        }
      }

      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || `Failed to ${editingQuestion ? 'update' : 'create'} question`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle delete question
  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!questionToDelete) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');

      await axios.delete(`/api/questions/${questionToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQuestions(questions.filter(q => q._id !== questionToDelete._id));
      
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to delete question');
    } finally {
      setDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setQuestionToDelete(null);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Single Question Management - Online Exam Portal">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Single Question Management</h1>
              <p className="text-gray-600 mt-2">Create and manage individual questions</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => router.push('/admin/questions')}
              >
                Back to Questions
              </Button>
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
              >
                {showForm ? 'Cancel' : 'Add Question'}
              </Button>
            </div>
          </div>

          {/* Add/Edit Question Form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-bold mb-4">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>

              {formError && <div className="alert alert-error mb-4">{formError}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group mb-4">
                  <label htmlFor="category">Category</label>
                  <input
                    type="text"
                    id="category"
                    className="form-control"
                    value={questionCategory}
                    onChange={e => setQuestionCategory(e.target.value)}
                    placeholder="Enter question category (e.g., Mathematics, Science, etc.)"
                    required
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="question-text">Question</label>
                  <textarea
                    id="question-text"
                    className="form-control"
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    placeholder="Enter your question here..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group mb-4">
                  <label>Options</label>
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-3">
                      <input
                        type="radio"
                        name="correct-option"
                        checked={option.isCorrect}
                        onChange={() => handleCorrectOptionChange(index)}
                        className="form-radio"
                      />
                      <input
                        type="text"
                        className="form-control flex-1"
                        value={option.text}
                        onChange={e => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Add Option
                    </button>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={formSubmitting}>
                    {formSubmitting 
                      ? (editingQuestion ? 'Updating...' : 'Creating...') 
                      : (editingQuestion ? 'Update Question' : 'Create Question')
                    }
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Questions List */}
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : questions.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500 mb-4">No questions found.</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Add Your First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map(category => (
                <div key={category} className="bg-white rounded-lg shadow-md">
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                    <p className="text-sm text-gray-600">
                      {questions.filter(q => q.category === category).length} questions
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {questions
                        .filter(q => q.category === category)
                        .map(question => (
                          <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-md font-medium text-gray-900 flex-1">
                                {question.text}
                              </h4>
                              <div className="flex space-x-2 ml-4">
                                <button
                                  onClick={() => handleEditQuestion(question)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(question)}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {question.options.map((option, index) => (
                                <div
                                  key={index}
                                  className={`p-2 rounded text-sm ${
                                    option.isCorrect
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  <span className="font-medium">Option {index + 1}:</span> {option.text}
                                  {option.isCorrect && (
                                    <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 text-xs text-gray-500">
                              Created by: {question.createdBy.name} • {new Date(question.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && questionToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this question? This action cannot be undone.
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

export default SingleQuestionPage;
