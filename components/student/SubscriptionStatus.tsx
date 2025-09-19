import React from 'react';

interface SubscriptionStatusProps {
  subscriptionStatus: {
    hasAssignment: boolean;
    hasSubscription: boolean;
    subscription?: any;
    requiredPlan?: any;
    isExpired: boolean;
    daysUntilExpiry: number;
    status: string;
    message: string;
  };
  onSubscribe?: () => void;
  onRenew?: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscriptionStatus,
  onSubscribe,
  onRenew
}) => {
  if (!subscriptionStatus.hasAssignment) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No Subscription Plan Assigned</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Your batch is not assigned to any subscription plan. Please contact your administrator.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus.hasSubscription) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Subscription Required</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>You need an active subscription to access exams.</p>
              {subscriptionStatus.requiredPlan && (
                <div className="mt-2">
                  <p><strong>Required Plan:</strong> {subscriptionStatus.requiredPlan.name}</p>
                  <p><strong>Price:</strong> ₹{subscriptionStatus.requiredPlan.price} for {subscriptionStatus.requiredPlan.duration} months</p>
                  <p><strong>Features:</strong> {subscriptionStatus.requiredPlan.features?.join(', ')}</p>
                </div>
              )}
              {onSubscribe && (
                <div className="mt-3">
                  <button
                    onClick={onSubscribe}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Subscribe Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subscriptionStatus.isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Subscription Expired</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Your subscription has expired. Please renew to continue accessing exams.</p>
              {onRenew && (
                <div className="mt-3">
                  <button
                    onClick={onRenew}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Renew Subscription
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">Active Subscription</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>{subscriptionStatus.message}</p>
            {subscriptionStatus.subscription && (
              <div className="mt-2">
                <p><strong>Plan:</strong> {subscriptionStatus.subscription.plan?.name}</p>
                <p><strong>Status:</strong> {subscriptionStatus.status}</p>
                {subscriptionStatus.daysUntilExpiry > 0 && (
                  <p><strong>Expires in:</strong> {subscriptionStatus.daysUntilExpiry} days</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
