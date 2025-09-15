import React from 'react';

interface ExamSecurityWarningProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
}

const ExamSecurityWarning: React.FC<ExamSecurityWarningProps> = ({ message, visible, onClose }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 left-0 right-0 top-0 bottom-0 w-screen h-screen bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
      <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg max-w-md mx-auto border-2 border-white">
        <div className="flex items-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-xl font-bold">Security Warning</h3>
        </div>

        <p className="mb-6 text-lg">{message}</p>

        {onClose && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition"
            >
              I Understand
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamSecurityWarning;
