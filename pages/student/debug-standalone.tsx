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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            🔍 Student Exam Visibility Debug
          </h1>
          <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
            Debug why you can't see exams
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            onClick={runDebug} 
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {loading ? '⏳ Running Debug...' : '🔍 Run Debug Analysis'}
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex' }}>
              <span style={{ color: '#f87171', marginRight: '0.75rem' }}>❌</span>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#991b1b', margin: 0 }}>
                  Error
                </h3>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#b91c1c' }}>
                  <p style={{ margin: 0 }}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {debugInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Summary */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', margin: 0 }}>
                📊 Summary
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {debugInfo.summary.studentHasBatch ? 
                      <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✅</span> : 
                      <span style={{ color: '#ef4444', marginRight: '0.5rem' }}>❌</span>
                    }
                    <span style={{ fontSize: '0.875rem' }}>Student has batch assigned</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {debugInfo.summary.batchHasAssignment ? 
                      <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✅</span> : 
                      <span style={{ color: '#ef4444', marginRight: '0.5rem' }}>❌</span>
                    }
                    <span style={{ fontSize: '0.875rem' }}>Batch has subscription assignment</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {debugInfo.summary.studentHasSubscription ? 
                      <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✅</span> : 
                      <span style={{ color: '#ef4444', marginRight: '0.5rem' }}>❌</span>
                    }
                    <span style={{ fontSize: '0.875rem' }}>Student has subscription</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {debugInfo.summary.subscriptionIsValid ? 
                      <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✅</span> : 
                      <span style={{ color: '#ef4444', marginRight: '0.5rem' }}>❌</span>
                    }
                    <span style={{ fontSize: '0.875rem' }}>Subscription is valid</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: '500' }}>Exams assigned to batch:</span> {debugInfo.summary.examsAssignedToBatch}
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: '500' }}>Final exams visible:</span> {debugInfo.summary.finalExamsVisible}
                  </div>
                </div>
              </div>

              {debugInfo.summary.issues.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#991b1b', marginBottom: '0.5rem' }}>
                    🚨 Issues Found:
                  </h3>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: 0 }}>
                    {debugInfo.summary.issues.map((issue: string, index: number) => (
                      <li key={index} style={{ fontSize: '0.875rem', color: '#b91c1c', marginBottom: '0.25rem' }}>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Quick Fixes */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', margin: 0 }}>
                🛠️ Quick Fixes
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {debugInfo.summary.issues.includes('Student is not assigned to any batch') && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '0.375rem'
                  }}>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      <strong>Fix:</strong> Go to Admin → Students → Edit Student → Assign to Batch
                    </p>
                  </div>
                )}
                {debugInfo.summary.issues.includes('Batch is not assigned to any subscription plan') && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '0.375rem'
                  }}>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      <strong>Fix:</strong> Go to Admin → Batch Assignments → Create Assignment
                    </p>
                  </div>
                )}
                {debugInfo.summary.issues.includes('Student has no subscription') && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '0.375rem'
                  }}>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      <strong>Fix:</strong> Go to Student → Subscription → Subscribe to Plan
                    </p>
                  </div>
                )}
                {debugInfo.summary.issues.includes('Student subscription has expired') && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '0.375rem'
                  }}>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      <strong>Fix:</strong> Go to Student → Subscription → Renew Subscription
                    </p>
                  </div>
                )}
                {debugInfo.summary.issues.includes('No exams are assigned to student\'s batch') && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '0.375rem'
                  }}>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      <strong>Fix:</strong> Go to Admin → Exams → Edit Exam → Assign to Batches
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Steps */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', margin: 0 }}>
                🔍 Detailed Analysis
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {debugInfo.steps.map((step: any, index: number) => (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    padding: '1rem',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ color: '#3b82f6', marginRight: '0.75rem' }}>ℹ️</span>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                          Step {step.step}: {step.description}
                        </h3>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                          <pre style={{
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'white',
                            padding: '0.75rem',
                            borderRadius: '0.25rem',
                            border: '1px solid #e5e7eb',
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            margin: 0
                          }}>
                            {JSON.stringify(step, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDebugPage;
