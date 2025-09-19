import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
}

interface StudentSubscription {
  _id: string;
  plan: SubscriptionPlan;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
}

interface SubscriptionStatus {
  hasAssignment: boolean;
  hasSubscription: boolean;
  subscription?: StudentSubscription;
  requiredPlan?: SubscriptionPlan;
  isExpired: boolean;
  daysUntilExpiry: number;
  status: string;
  message: string;
}

const StudentSubscriptionPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/subscription');
      const data = await response.json();

      if (data.success) {
        setSubscriptionStatus(data.subscriptionStatus);
        setAvailablePlans(data.availablePlans || []);
      } else {
        setError(data.message || 'Failed to fetch subscription data');
      }
    } catch (err) {
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to payment page or show success message
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          alert('Subscription created successfully!');
          fetchSubscriptionData(); // Refresh data
        }
      } else {
        setError(data.message || 'Failed to subscribe');
      }
    } catch (err) {
      setError('Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!subscriptionStatus?.subscription) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/student/subscription/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subscriptionId: subscriptionStatus.subscription._id 
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          alert('Subscription renewed successfully!');
          fetchSubscriptionData(); // Refresh data
        }
      } else {
        setError(data.message || 'Failed to renew subscription');
      }
    } catch (err) {
      setError('Failed to renew subscription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Subscription</h1>
          <p className="mt-2 text-gray-600">Manage your exam subscription and access</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        {subscriptionStatus && (
          <div className="mb-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              
              {!subscriptionStatus.hasAssignment ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">No Subscription Plan Assigned</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Your batch is not assigned to any subscription plan. Please contact your administrator.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !subscriptionStatus.hasSubscription ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">No Active Subscription</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>You need an active subscription to access exams.</p>
                        {subscriptionStatus.requiredPlan && (
                          <div className="mt-3">
                            <p><strong>Required Plan:</strong> {subscriptionStatus.requiredPlan.name}</p>
                            <p><strong>Price:</strong> ₹{subscriptionStatus.requiredPlan.price}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : subscriptionStatus.isExpired ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <X className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Subscription Expired</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>Your subscription has expired. Please renew to continue accessing exams.</p>
                        <div className="mt-3">
                          <Button onClick={handleRenew} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Renew Subscription
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <Check className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Active Subscription</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{subscriptionStatus.message}</p>
                        {subscriptionStatus.subscription && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="font-medium">Plan</p>
                              <p>{subscriptionStatus.subscription.plan.name}</p>
                            </div>
                            <div>
                              <p className="font-medium">Status</p>
                              <Badge variant={subscriptionStatus.status === 'active' ? 'default' : 'secondary'}>
                                {subscriptionStatus.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium">Expires</p>
                              <p>{new Date(subscriptionStatus.subscription.endDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Available Plans */}
        {subscriptionStatus?.hasAssignment && !subscriptionStatus.hasSubscription && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePlans.map((plan) => (
                <Card key={plan._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold">₹{plan.price}</span>
                      <span className="text-gray-600">/{plan.duration} months</span>
                    </div>

                    <ul className="text-sm text-gray-600 mb-6 space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button 
                      onClick={() => handleSubscribe(plan._id)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Subscribe Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/student')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentSubscriptionPage;
