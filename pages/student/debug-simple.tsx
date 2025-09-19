import React, { useState } from 'react';

const StudentDebugPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/debug/student-exam-visibility', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setDebugInfo(data.debugInfo);
      } else {
        setError(data.message || 'Debug failed');
      }
    } catch (err) {
      setError('Failed to run debug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Exam Visibility Debug</h1>
          <p className="mt-2 text-gray-600">Debug why you can't see exams</p>
        </div>

        <div className="mb-6">
          <button 
            onClick={runDebug} 
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳ Running...' : '🔍 Run Debug Analysis'}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <span className="text-red-400 mr-3">❌</span>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📊 Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    {debugInfo.summary.studentHasBatch ? <span className="text-green-500 mr-2">✅</span> : <span className="text-red-500 mr-2">❌</span>}
                    <span className="text-sm">Student has batch assigned</span>
                  </div>
                  <div className="flex items-center">
                    {debugInfo.summary.batchHasAssignment ? <span className="text-green-500 mr-2">✅</span> : <span className="text-red-500 mr-2">❌</span>}
                    <span className="text-sm">Batch has subscription assignment</span>
                  </div>
                  <div className="flex items-center">
                    {debugInfo.summary.studentHasSubscription ? <span className="text-green-500 mr-2">✅</span> : <span className="text-red-500 mr-2">❌</span>}
                    <span className="text-sm">Student has subscription</span>
                  </div>
                  <div className="flex items-center">
                    {debugInfo.summary.subscriptionIsValid ? <span className="text-green-500 mr-2">✅</span> : <span className="text-red-500 mr-2">❌</span>}
                    <span className="text-sm">Subscription is valid</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Exams assigned to batch:</span> {debugInfo.summary.examsAssignedToBatch}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Final exams visible:</span> {debugInfo.summary.finalExamsVisible}
                  </div>
                </div>
              </div>

              {debugInfo.summary.issues.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">🚨 Issues Found:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {debugInfo.summary.issues.map((issue: string, index: number) => (
                      <li key={index} className="text-sm text-red-700">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Detailed Steps */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🔍 Detailed Analysis</h2>
              <div className="space-y-4">
                {debugInfo.steps.map((step: any, index: number) => (
                  <div key={index} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-3">ℹ️</span>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">
                          Step {step.step}: {step.description}
                        </h3>
                        <div className="mt-2 text-sm">
                          <pre className="whitespace-pre-wrap bg-white p-3 rounded border text-xs overflow-auto">
                            {JSON.stringify(step, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Fixes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🛠️ Quick Fixes</h2>
              <div className="space-y-3">
                {debugInfo.summary.issues.includes('Student is not assigned to any batch') && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm"><strong>Fix:</strong> Go to Admin → Students → Edit Student → Assign to Batch</p>
                  </div>
                )}
                {debugInfo.summary.issues.includes('Batch is not assigned to any subscription plan') && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm"><strong>Fix:</strong> Go to Admin → Batch Assignments → Create Assignment</p>
                  </div>
                )}
                {debugInfo.summary.issues.includes('Student has no subscription') && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm"><strong>Fix:</strong> Go to Student → Subscription → Subscribe to Plan</p>
                  </div>
                )}
                {debugInfo.summary.issues.includes('Student subscription has expired') && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm"><strong>Fix:</strong> Go to Student → Subscription → Renew Subscription</p>
                  </div>
                )}
                {debugInfo.summary.issues.includes('No exams are assigned to student\'s batch') && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm"><strong>Fix:</strong> Go to Admin → Exams → Edit Exam → Assign to Batches</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDebugPage;
