import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import Card from '../../components/Card';
import Button from '../../components/Button';

interface Setting {
  _id: string;
  key: string;
  value: any;
  description: string;
  updatedAt: string;
}

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings form state
  const [securityMaxIncidents, setSecurityMaxIncidents] = useState<number>(5);
  const [securityEnableAutoSuspend, setSecurityEnableAutoSuspend] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get('/api/settings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Set form values from fetched settings
        response.data.settings.forEach((setting: Setting) => {
          if (setting.key === 'security.maxIncidents') {
            setSecurityMaxIncidents(setting.value);
          } else if (setting.key === 'security.enableAutoSuspend') {
            setSecurityEnableAutoSuspend(setting.value);
          }
        });

        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle saving security settings
  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');

      console.log('Saving security settings:', {
        maxIncidents: securityMaxIncidents,
        enableAutoSuspend: securityEnableAutoSuspend,
      });

      // Update max incidents setting
      const maxIncidentsResponse = await axios.put(
        '/api/settings',
        {
          key: 'security.maxIncidents',
          value: Number(securityMaxIncidents),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Max incidents response:', maxIncidentsResponse.data);

      // Update auto suspend setting
      const autoSuspendResponse = await axios.put(
        '/api/settings',
        {
          key: 'security.enableAutoSuspend',
          value: Boolean(securityEnableAutoSuspend),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Auto suspend response:', autoSuspendResponse.data);

      setSuccess('Security settings saved successfully');

      // Refresh settings
      const response = await axios.get('/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state with the refreshed settings
      response.data.settings.forEach((setting: Setting) => {
        if (setting.key === 'security.maxIncidents') {
          setSecurityMaxIncidents(Number(setting.value));
        } else if (setting.key === 'security.enableAutoSuspend') {
          setSecurityEnableAutoSuspend(Boolean(setting.value));
        }
      });
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);

      // Clear success message after 3 seconds
      if (!error) {
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="System Settings - Exam Portal">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">System Settings</h1>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Security Settings */}
              <Card>
                <h2 className="text-xl font-semibold mb-4">Exam Security Settings</h2>

                {success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSaveSecuritySettings}>
                  <div className="space-y-4">
                    {/* Enable Auto Suspend */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="security-enable-auto-suspend"
                        checked={securityEnableAutoSuspend}
                        onChange={e => setSecurityEnableAutoSuspend(e.target.checked)}
                        className="h-4 w-4 text-primary-color rounded focus:ring-primary-color"
                      />
                      <label
                        htmlFor="security-enable-auto-suspend"
                        className="font-medium text-gray-700"
                      >
                        Enable Automatic Exam Suspension
                      </label>
                    </div>

                    <div className="form-group">
                      <label
                        htmlFor="security-max-incidents"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Maximum Security Incidents Before Suspension
                      </label>
                      <div className="flex items-center mt-1">
                        <input
                          type="number"
                          id="security-max-incidents"
                          min="1"
                          max="50"
                          value={securityMaxIncidents}
                          onChange={e => setSecurityMaxIncidents(parseInt(e.target.value))}
                          className="form-control max-w-xs"
                          disabled={!securityEnableAutoSuspend}
                        />
                        <span className="ml-2 text-sm text-gray-500">incidents</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        After this many security incidents (tab switching, exiting fullscreen,
                        etc.), the student's exam will be automatically suspended.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Security Settings'}
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>

              <h3 className="text-lg font-medium text-gray-900">
                Don&apos;t see a setting you need?
              </h3>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default SettingsPage;
