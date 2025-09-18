import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';

const BulkUploadPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDetails, setUploadDetails] = useState<{
    total: number;
    uploaded: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      setSuccess(null);
      setUploadDetails(null);
    }
  };

  // Download dummy Excel template
  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/questions/template', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'question-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download template');
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category.trim()) {
      setError('Category is required');
      return;
    }

    if (!selectedFile) {
      setError('Please select an Excel file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);
      setUploadDetails(null);

      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', category);

      const response = await axios.post('/api/questions/bulk-upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      // Handle response data
      const { uploaded, duplicates, errors, total } = response.data;
      
      setUploadDetails({
        total,
        uploaded,
        duplicates: duplicates || 0,
        errors: errors?.length || 0,
      });

      // Create success message
      let successMessage = `Upload completed! `;
      successMessage += `Total processed: ${total}, `;
      successMessage += `Successfully uploaded: ${uploaded}, `;
      
      if (duplicates > 0) {
        successMessage += `Duplicates skipped: ${duplicates}, `;
      }
      
      if (errors > 0) {
        successMessage += `Errors: ${errors}`;
      }

      setSuccess(successMessage);
      
      // Reset form only if upload was successful
      if (uploaded > 0) {
        setCategory('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ECONNABORTED') {
        setError('Upload timeout. Please try with a smaller file or check your internet connection.');
      } else if (err.message.includes('Network Error')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Failed to upload questions. Please try again.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Bulk Question Upload - Online Exam Portal">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bulk Question Upload</h1>
              <p className="text-gray-600 mt-2">Upload multiple questions using Excel template</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/admin/questions')}
            >
              Back to Questions
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Instructions</h3>
            <ul className="text-blue-800 space-y-2">
              <li>• Download the Excel template to see the required format</li>
              <li>• Fill in your questions with 4 options each</li>
              <li>• Mark the correct answer in the "Correct Option" column (1, 2, 3, or 4)</li>
              <li>• Save the file and upload it here</li>
              <li>• Maximum file size: 100MB</li>
              <li>• Duplicate questions (same text and category) will be automatically skipped</li>
              <li>• Questions with errors will be reported in the upload summary</li>
            </ul>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Upload Questions</h2>

            {error && <div className="alert alert-error mb-4">{error}</div>}
            {success && <div className="alert alert-success mb-4">{success}</div>}
            
            {/* Upload Progress */}
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Uploading...</span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Details */}
            {uploadDetails && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Upload Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{uploadDetails.total}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{uploadDetails.uploaded}</div>
                    <div className="text-gray-600">Uploaded</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-yellow-600">{uploadDetails.duplicates}</div>
                    <div className="text-gray-600">Duplicates</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{uploadDetails.errors}</div>
                    <div className="text-gray-600">Errors</div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleBulkUpload}>
              <div className="form-group mb-4">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  className="form-control"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Enter question category (e.g., Mathematics, Science, etc.)"
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label htmlFor="file">Excel File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  className="form-control"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Select an Excel file (.xlsx or .xls) with your questions
                </p>
              </div>

              {selectedFile && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
                
                <Button
                  type="submit"
                  variant="primary"
                  disabled={uploading || !selectedFile || !category.trim()}
                >
                  {uploading ? 'Uploading...' : 'Upload Questions'}
                </Button>
              </div>
            </form>
          </div>

          {/* Template Preview */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Template Format</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Question</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Option 1</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Option 2</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Option 3</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Option 4</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Correct Option</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">What is 2+2?</td>
                    <td className="border border-gray-300 px-4 py-2">3</td>
                    <td className="border border-gray-300 px-4 py-2">4</td>
                    <td className="border border-gray-300 px-4 py-2">5</td>
                    <td className="border border-gray-300 px-4 py-2">6</td>
                    <td className="border border-gray-300 px-4 py-2">2</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">What is the capital of India?</td>
                    <td className="border border-gray-300 px-4 py-2">Mumbai</td>
                    <td className="border border-gray-300 px-4 py-2">Delhi</td>
                    <td className="border border-gray-300 px-4 py-2">Kolkata</td>
                    <td className="border border-gray-300 px-4 py-2">Chennai</td>
                    <td className="border border-gray-300 px-4 py-2">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              <strong>Note:</strong> The "Correct Option" column should contain the number (1, 2, 3, or 4) 
              corresponding to the correct answer option.
            </p>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default BulkUploadPage;
