import React from "react";
import { useRouter } from "next/router";

interface ExamSuspensionAlertProps {
  visible: boolean;
  suspensionReason: string;
  incidentCount: number;
  timestamp: string;
  isSuspended?: boolean;
  securitySettings?: {
    enableAutoSuspend: boolean;
    maxIncidents: number;
  };
}

const ExamSuspensionAlert: React.FC<ExamSuspensionAlertProps> = ({
  visible,
  suspensionReason,
  incidentCount,
  timestamp,
}) => {
  const router = useRouter();

  if (!visible) {
    return null;
  }

  const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : "";

  // Calculate remaining incidents (commented out as it's not currently used)
  // const remainingIncidents = securitySettings?.maxIncidents
  //   ? securitySettings.maxIncidents - incidentCount
  //   : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full animate-fade-in-up">
        <div className="border-b border-red-500 p-4 bg-red-100">
          <h2 className="text-2xl font-bold text-red-700 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mr-2"
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
            Exam Suspended
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-xl font-semibold text-red-800 mb-3">
              Your exam has been suspended due to security violations
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Reason:</strong> {suspensionReason}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Time:</strong> {formattedTime}
            </p>
            <p className="text-gray-700">
              <strong>Security Incidents:</strong> {incidentCount}
            </p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Your exam has been locked. Please contact your instructor or
                  administrator to address this issue.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => router.push("/student")}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => router.push(`/student/exams/${router.query.id}`)}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-medium transition-colors"
            >
              View Exam Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSuspensionAlert;
