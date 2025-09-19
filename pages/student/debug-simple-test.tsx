import React, { useState } from 'react';

const SimpleDebugTest: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimpleDebug = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/debug/simple', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to run simple debug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🔍 Simple Debug Test</h1>
      
      <button 
        onClick={runSimpleDebug} 
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Run Simple Debug'}
      </button>

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div>
          <h2>📊 Summary</h2>
          {result.data?.summary && (
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>✅ Student has batch: {result.data.summary.studentHasBatch ? 'Yes' : 'No'}</div>
                <div>✅ Batch exists: {result.data.summary.batchExists ? 'Yes' : 'No'}</div>
                <div>✅ Batch has assignment: {result.data.summary.batchHasAssignment ? 'Yes' : 'No'}</div>
                <div>✅ Student has subscription: {result.data.summary.studentHasSubscription ? 'Yes' : 'No'}</div>
                <div>✅ Exams assigned: {result.data.summary.examsAssignedToBatch}</div>
              </div>
              
              {result.data.summary.issues.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <h3 style={{ color: '#dc3545' }}>🚨 Issues Found:</h3>
                  <ul>
                    {result.data.summary.issues.map((issue: string, index: number) => (
                      <li key={index} style={{ color: '#dc3545' }}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <h2>📋 Full Data</h2>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SimpleDebugTest;
