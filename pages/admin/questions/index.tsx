import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';

const QuestionsPage: React.FC = () => {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);

  const handleAddQuestionSet = () => {
    setShowOptions(true);
  };

  const handleBackToDashboard = () => {
    router.push('/admin');
  };

  const handleSingleQuestion = () => {
    router.push('/admin/questions/single');
  };

  const handleBulkUpload = () => {
    router.push('/admin/questions/bulk');
  };

  const handleCategorizedView = () => {
    router.push('/admin/questions/categorized');
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Question Management - Online Exam Portal">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Question Management</h1>
              <p className="text-gray-600 mt-2">Manage your question bank and categories</p>
            </div>
            <Button
              variant="secondary"
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Main Content */}
          {!showOptions ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Add Question Set</h2>
                <p className="text-gray-600">Choose how you want to add questions to your question bank</p>
              </div>

              <Button
                variant="primary"
                onClick={handleAddQuestionSet}
                className="w-full max-w-md"
              >
                Add Question Set
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Question Addition Method</h2>
                <p className="text-gray-600">Select how you want to add questions</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Single Question Option */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={handleSingleQuestion}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Single Question</h3>
                    <p className="text-gray-600 text-sm">Create individual questions with custom categories and options</p>
                  </div>
                </div>

                {/* Categorized View Option */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={handleCategorizedView}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Categorized View</h3>
                    <p className="text-gray-600 text-sm">View, edit, and manage questions organized by categories</p>
                  </div>
                </div>

                {/* Bulk Upload Option */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={handleBulkUpload}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-purple-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Upload</h3>
                    <p className="text-gray-600 text-sm">Upload multiple questions at once using Excel template</p>
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <div className="text-center mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setShowOptions(false)}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default QuestionsPage;
