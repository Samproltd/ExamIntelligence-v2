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

interface Category {
  name: string;
  questionCount: number;
  latestQuestion: string;
}

const CategorizedQuestionsPage: React.FC = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadCategory, setBulkUploadCategory] = useState('');
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [bulkUploadSubmitting, setBulkUploadSubmitting] = useState(false);

  // Category management state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [categoryFormSubmitting, setCategoryFormSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Category delete confirmation state
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Bulk operations state
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch questions and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const [questionsResponse, categoriesResponse] = await Promise.all([
          axios.get('/api/questions', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/questions/categories', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setQuestions(questionsResponse.data.questions);
        setCategories(categoriesResponse.data.categories);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch data');
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

  // Reset category form
  const resetCategoryForm = () => {
    setNewCategoryName('');
    setEditingCategory(null);
    setCategoryFormError(null);
  };

  // Handle edit question
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.text);
    setQuestionCategory(question.category);
    setOptions(question.options);
    setShowForm(true);
  };

  // Handle add question to specific category
  const handleAddQuestionToCategory = (categoryName: string) => {
    setQuestionCategory(categoryName);
    setEditingQuestion(null);
    setQuestionText('');
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
    setFormError(null);
    setShowForm(true);
  };

  // Handle bulk upload to specific category
  const handleBulkUploadToCategory = (categoryName: string) => {
    setBulkUploadCategory(categoryName);
    setBulkUploadFile(null);
    setBulkUploadError(null);
    setShowBulkUpload(true);
  };

  // Handle edit category
  const handleEditCategory = (categoryName: string) => {
    setEditingCategory(categoryName);
    setNewCategoryName(categoryName);
    setShowCategoryForm(true);
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
            headers: { Authorization: `Bearer ${token}` },
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
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setQuestions([...questions, response.data.question]);
        
        // Add category if it's new
        if (!categories.find(c => c.name === questionCategory)) {
          setCategories([...categories, { 
            name: questionCategory, 
            questionCount: 1, 
            latestQuestion: new Date().toISOString() 
          }]);
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

  // Handle category form submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      setCategoryFormError('Category name is required');
      return;
    }

    try {
      setCategoryFormSubmitting(true);
      setCategoryFormError(null);

      const token = localStorage.getItem('token');

      if (editingCategory) {
        // Update category name
        const response = await axios.put(
          '/api/questions/categories',
          {
            oldCategory: editingCategory,
            newCategory: newCategoryName.trim(),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Update local state
        setCategories(categories.map(c => 
          c.name === editingCategory ? { ...c, name: newCategoryName.trim() } : c
        ));
        setQuestions(questions.map(q => 
          q.category === editingCategory ? { ...q, category: newCategoryName.trim() } : q
        ));
      }

      resetCategoryForm();
      setShowCategoryForm(false);
    } catch (err: any) {
      setCategoryFormError(err.response?.data?.message || 'Failed to update category');
    } finally {
      setCategoryFormSubmitting(false);
    }
  };

  // Handle delete question
  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteConfirm(true);
  };

  // Handle delete category
  const handleDeleteCategory = (categoryName: string) => {
    setCategoryToDelete(categoryName);
    setShowCategoryDeleteConfirm(true);
  };

  // Confirm delete question
  const confirmDelete = async () => {
    if (!questionToDelete) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');

      await axios.delete(`/api/questions/${questionToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuestions(questions.filter(q => q._id !== questionToDelete._id));
      
      // Update category count
      const updatedCategories = categories.map(c => {
        if (c.name === questionToDelete.category) {
          return { ...c, questionCount: c.questionCount - 1 };
        }
        return c;
      }).filter(c => c.questionCount > 0);
      
      setCategories(updatedCategories);
      
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to delete question');
    } finally {
      setDeleting(false);
    }
  };

  // Confirm delete category
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setDeletingCategory(true);
      const token = localStorage.getItem('token');

      await axios.delete(`/api/questions/categories?category=${encodeURIComponent(categoryToDelete)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuestions(questions.filter(q => q.category !== categoryToDelete));
      setCategories(categories.filter(c => c.name !== categoryToDelete));
      
      setShowCategoryDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      setCategoryFormError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeletingCategory(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setQuestionToDelete(null);
  };

  // Cancel category delete
  const cancelCategoryDelete = () => {
    setShowCategoryDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  // Handle question selection for bulk operations
  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;

    try {
      const token = localStorage.getItem('token');

      await axios.delete('/api/questions/bulk-operations', {
        headers: { Authorization: `Bearer ${token}` },
        data: { questionIds: selectedQuestions },
      });

      setQuestions(questions.filter(q => !selectedQuestions.includes(q._id)));
      setSelectedQuestions([]);
      setShowBulkActions(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to delete questions');
    }
  };

  // Handle bulk upload file
  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkUploadFile) {
      setBulkUploadError('Please select a file to upload');
      return;
    }

    if (!bulkUploadCategory.trim()) {
      setBulkUploadError('Category is required');
      return;
    }

    try {
      setBulkUploadSubmitting(true);
      setBulkUploadError(null);

      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', bulkUploadFile);
      formData.append('category', bulkUploadCategory.trim());

      const response = await axios.post('/api/questions/bulk-upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh questions and categories
      const [questionsResponse, categoriesResponse] = await Promise.all([
        axios.get('/api/questions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/questions/categories', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setQuestions(questionsResponse.data.questions);
      setCategories(categoriesResponse.data.categories);

      setShowBulkUpload(false);
      setBulkUploadFile(null);
      setBulkUploadCategory('');
    } catch (err: any) {
      setBulkUploadError(err.response?.data?.message || 'Failed to upload questions');
    } finally {
      setBulkUploadSubmitting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkUploadFile(file);
      setBulkUploadError(null);
    }
  };

  // Get filtered questions
  const getFilteredQuestions = () => {
    if (selectedCategory) {
      return questions.filter(q => q.category === selectedCategory);
    }
    return questions;
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Categorized Question Management - Online Exam Portal">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categorized Question Management</h1>
              <p className="text-gray-600 mt-2">Manage questions organized by categories</p>
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
                {questionCategory && !editingQuestion && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    to category: <strong>{questionCategory}</strong>
                  </span>
                )}
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
                  {!editingQuestion && questionCategory !== '' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Category is pre-selected for this category. You can change it if needed.
                    </p>
                  )}
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

          {/* Category Management */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Categories</h2>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (showCategoryForm) {
                      resetCategoryForm();
                      setShowCategoryForm(false);
                    } else {
                      setShowCategoryForm(true);
                    }
                  }}
                >
                  {showCategoryForm ? 'Cancel' : 'Manage Categories'}
                </Button>
              </div>
            </div>

            {/* Category Form */}
            {showCategoryForm && (
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold mb-4">
                  {editingCategory ? 'Rename Category' : 'Category Management'}
                </h3>

                {categoryFormError && <div className="alert alert-error mb-4">{categoryFormError}</div>}

                <form onSubmit={handleCategorySubmit}>
                  <div className="form-group mb-4">
                    <label htmlFor="new-category-name">Category Name</label>
                    <input
                      type="text"
                      id="new-category-name"
                      className="form-control"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder="Enter new category name"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={categoryFormSubmitting}>
                      {categoryFormSubmitting ? 'Updating...' : 'Update Category'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories List */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-color"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(category => (
                    <div key={category.name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditCategory(category.name)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            title="Rename Category"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.name)}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            title="Delete Category"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {category.questionCount} questions
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                          className="w-full"
                        >
                          {selectedCategory === category.name ? 'Hide Questions' : 'View Questions'}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAddQuestionToCategory(category.name)}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            title="Add Single Question"
                          >
                            + Add Question
                          </button>
                          <button
                            onClick={() => handleBulkUploadToCategory(category.name)}
                            className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                            title="Bulk Upload Questions"
                          >
                            📁 Bulk Upload
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Questions List */}
          {selectedCategory && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Questions in "{selectedCategory}"
                  </h2>
                  {selectedQuestions.length > 0 && (
                    <div className="flex space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedQuestions.length} selected
                      </span>
                      <Button
                        variant="secondary"
                        onClick={handleBulkDelete}
                        className="text-sm bg-red-600 hover:bg-red-700 text-white border-red-600"
                      >
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {getFilteredQuestions().length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No questions found in this category.</p>
                    <Button variant="primary" onClick={() => setShowForm(true)}>
                      Add Question to {selectedCategory}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredQuestions().map(question => (
                      <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question._id)}
                            onChange={() => handleQuestionSelect(question._id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Upload Modal */}
          {showBulkUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Bulk Upload Questions</h3>
                <p className="text-gray-600 mb-4">
                  Upload questions to category: <strong>{bulkUploadCategory}</strong>
                </p>

                {bulkUploadError && <div className="alert alert-error mb-4">{bulkUploadError}</div>}

                <form onSubmit={handleBulkUploadSubmit}>
                  <div className="form-group mb-4">
                    <label htmlFor="bulk-file">Excel File</label>
                    <input
                      type="file"
                      id="bulk-file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="form-control"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload an Excel file with questions. Download template for format.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkUpload(false);
                        setBulkUploadFile(null);
                        setBulkUploadCategory('');
                        setBulkUploadError(null);
                      }}
                      disabled={bulkUploadSubmitting}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bulkUploadSubmitting || !bulkUploadFile}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {bulkUploadSubmitting ? 'Uploading...' : 'Upload Questions'}
                    </button>
                  </div>
                </form>
              </div>
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

          {/* Category Delete Confirmation Dialog */}
          {showCategoryDeleteConfirm && categoryToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Confirm Category Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete the category "{categoryToDelete}" and all its questions? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelCategoryDelete}
                    disabled={deletingCategory}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteCategory}
                    disabled={deletingCategory}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deletingCategory ? 'Deleting...' : 'Delete Category'}
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

export default CategorizedQuestionsPage;
