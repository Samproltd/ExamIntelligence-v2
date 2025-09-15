import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Snackbar from '../../../components/Snackbar';
import useToast from '../../../hooks/useToast';

interface Payment {
  _id: string;
  amount: number;
  status: 'created' | 'pending' | 'success' | 'failed';
  paymentType: 'suspended' | 'max_attempts';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt: string;
  exam: {
    _id: string;
    name: string;
  };
}

const PaymentHistoryPage: React.FC = () => {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showError, hideToast } = useToast();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/payments/history', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPayments(response.data.payments);
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
        showError('Failed to load payment history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      created: { color: 'bg-blue-100 text-blue-800', text: 'Created' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      success: { color: 'bg-green-100 text-green-800', text: 'Success' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getPaymentTypeBadge = (type: string) => {
    const typeMap: Record<string, { text: string }> = {
      suspended: { text: 'Suspension Removal' },
      max_attempts: { text: 'Attempts Reset' },
    };

    const typeInfo = typeMap[type] || { text: type };

    return <span className="text-sm">{typeInfo.text}</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <ProtectedRoute requiredRole="student">
      <Layout title="Payment History">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Payment History</h1>
            <Button variant="outline" onClick={() => router.push('/student')}>
              Back to Dashboard
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : payments.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-4">No Payments Found</h2>
                <p className="text-gray-600 mb-4">You haven&apos;t made any payments yet.</p>
                <Button variant="primary" onClick={() => router.push('/student/exams')}>
                  Browse Exams
                </Button>
              </div>
            </Card>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Exam
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map(payment => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.exam.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentTypeBadge(payment.paymentType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{payment.amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(payment.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            className="text-primary-color hover:text-primary-color-dark font-medium"
                            onClick={() => router.push(`/student/exams/${payment.exam._id}`)}
                          >
                            View Exam
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <Snackbar open={toast.open} message={toast.message} type={toast.type} onClose={hideToast} />
      </Layout>
    </ProtectedRoute>
  );
};

export default PaymentHistoryPage;
