import React from "react";
import Layout from "../../components/Layout";
import Button from "../../components/Button";
import Snackbar from "../../components/Snackbar";
import useToast from "../../hooks/useToast";

const ToastDemoPage: React.FC = () => {
  const { toast, showSuccess, showError, showInfo, hideToast } = useToast();

  return (
    <Layout title="Toast Notification Demo">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Toast Notifications</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Success Toast</h2>
            <p className="text-gray-600 mb-6">
              Display a success message to confirm an action completed
              successfully.
            </p>
            <Button
              variant="primary"
              onClick={() => showSuccess("Operation completed successfully!")}
              fullWidth
            >
              Show Success Toast
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Error Toast</h2>
            <p className="text-gray-600 mb-6">
              Display an error message when something goes wrong.
            </p>
            <Button
              variant="secondary"
              onClick={() =>
                showError("Something went wrong. Please try again.")
              }
              fullWidth
            >
              Show Error Toast
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Info Toast</h2>
            <p className="text-gray-600 mb-6">
              Display an informational message to notify the user.
            </p>
            <Button
              variant="outline"
              onClick={() => showInfo("New features are now available!")}
              fullWidth
            >
              Show Info Toast
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">How to Use</h2>
          <p className="text-gray-600 mb-4">
            To use toast notifications in your components:
          </p>

          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            {`import useToast from '../hooks/useToast';
import Snackbar from '../components/Snackbar';

const YourComponent = () => {
  const { toast, showSuccess, showError, showInfo, hideToast } = useToast();
  
  // Use the toast functions when needed:
  // showSuccess('Success message');
  // showError('Error message');
  // showInfo('Info message');
  
  return (
    <>
      {/* Your component JSX */}
      
      <Snackbar
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
};`}
          </pre>
        </div>
      </div>

      {/* Render the Snackbar component */}
      <Snackbar
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </Layout>
  );
};

export default ToastDemoPage;
