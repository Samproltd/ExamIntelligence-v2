import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Snackbar from '../../../components/Snackbar';
import useToast from '../../../hooks/useToast';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface Batch {
  _id: string;
  name: string;
  description: string;
  year: number;
  isActive: boolean;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  maxAttempts: number;
  maxSecurityIncidents?: number;
  enableAutoSuspend?: boolean;
  additionalSecurityIncidentsAfterRemoval?: number;
  additionalAttemptsAfterPayment?: number;
}

interface Student {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  rollNumber?: string;
  dateOfBirth?: string;
  mobile?: string;
  createdAt: string;
}

interface Exam {
  _id: string;
  name: string;
}

const BatchDetailPage = () => {
  // state declarations exam invite
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});
  const [sentEmails, setSentEmails] = useState<Record<string, boolean>>({});

  // state declarations onbord invite
  const [sendingOnboardEmails, setSendingOnboardEmails] = useState<Record<string, boolean>>({});
  const [sentOnboardEmails, setSentOnboardEmails] = useState<Record<string, boolean>>({});

  const [isSendingBatchEmails, setIsSendingBatchEmails] = useState(false);
  const [showExamSelectModal, setShowExamSelectModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Individual student exam selection
  const [showIndividualExamModal, setShowIndividualExamModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedIndividualExamId, setSelectedIndividualExamId] = useState<string | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validatedStudents, setValidatedStudents] = useState<any[]>([]);
  const [uploadErrors, setUploadErrors] = useState<
    {
      row: number;
      errors: string[];
      cells?: {
        cell: string;
        message: string;
      }[];
    }[]
  >([]);
  const [uploadStep, setUploadStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [editedBatch, setEditedBatch] = useState<Partial<Batch>>({});
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    rollNumber: '',
    dateOfBirth: '',
    mobile: '',
  });

  const router = useRouter();
  const { id } = router.query;
  const { token } = useSelector((state: RootState) => state.auth);

  // Toast notifications
  const { toast, showSuccess, showError, hideToast, showInfo } = useToast();

  // Fetch batch details and students
  const fetchBatch = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/batches/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { batch, students } = response.data;
      console.log('BATCH DATA RECEIVED FROM API:', batch);
      console.log('Security Settings:', {
        maxSecurityIncidents: batch.maxSecurityIncidents,
        enableAutoSuspend: batch.enableAutoSuspend,
        additionalSecurityIncidentsAfterRemoval: batch.additionalSecurityIncidentsAfterRemoval,
        additionalAttemptsAfterPayment: batch.additionalAttemptsAfterPayment,
      });
      setBatch(batch);
      setStudents(students);

      // Initialize edit form with current values
      setEditedBatch({
        name: batch.name,
        description: batch.description,
        year: batch.year,
        isActive: batch.isActive,
        maxAttempts: typeof batch.maxAttempts === 'number' ? batch.maxAttempts : 3,
        maxSecurityIncidents:
          typeof batch.maxSecurityIncidents === 'number' ? batch.maxSecurityIncidents : 5,
        enableAutoSuspend:
          typeof batch.enableAutoSuspend === 'boolean' ? batch.enableAutoSuspend : true,
        additionalSecurityIncidentsAfterRemoval:
          typeof batch.additionalSecurityIncidentsAfterRemoval === 'number'
            ? batch.additionalSecurityIncidentsAfterRemoval
            : 3,
        additionalAttemptsAfterPayment:
          typeof batch.additionalAttemptsAfterPayment === 'number'
            ? batch.additionalAttemptsAfterPayment
            : 2,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch batch details';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error fetching batch details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle editing batch
  const handleEditBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Debug log
      console.log('SUBMITTING BATCH EDIT:', editedBatch);
      console.log('Security Settings Being Sent:', {
        maxSecurityIncidents: editedBatch.maxSecurityIncidents,
        enableAutoSuspend: editedBatch.enableAutoSuspend,
        additionalSecurityIncidentsAfterRemoval:
          editedBatch.additionalSecurityIncidentsAfterRemoval,
        additionalAttemptsAfterPayment: editedBatch.additionalAttemptsAfterPayment,
      });

      const response = await axios.put(`/api/batches/${id}`, editedBatch, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('BATCH UPDATE RESPONSE:', response.data);
      console.log('UPDATED BATCH SECURITY SETTINGS:', {
        maxSecurityIncidents: response.data.batch.maxSecurityIncidents,
        enableAutoSuspend: response.data.batch.enableAutoSuspend,
        additionalSecurityIncidentsAfterRemoval:
          response.data.batch.additionalSecurityIncidentsAfterRemoval,
        additionalAttemptsAfterPayment: response.data.batch.additionalAttemptsAfterPayment,
      });

      // Update local state with edited batch
      setBatch({
        ...batch!,
        ...response.data.batch,
      });

      // Show success message
      showSuccess('Batch updated successfully');

      setShowEditModal(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update batch';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error updating batch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new student to batch
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Create full name for backwards compatibility
      const fullName = `${newStudent.firstName} ${newStudent.lastName}`.trim();

      // Add student with batch ID
      const response = await axios.post(
        '/api/students',
        {
          ...newStudent,
          name: fullName,
          batchId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add the new student to the list
      setStudents([response.data.student, ...students]);

      // Show success message
      showSuccess(`Student ${fullName} added successfully`);

      // Reset form and close modal
      setNewStudent({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        rollNumber: '',
        dateOfBirth: '',
        mobile: '',
      });

      setShowAddStudentModal(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add student';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error adding student:', error);
    } finally {
      setLoading(false);
    }
  };

  // const sendMail = async (studentId: string) => {
  //   console.log('Sending mail to student:', studentId);
  // };
  // Handle removing student from batch
  const handleRemoveStudent = async (studentId: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this student from the batch? This will not delete the student account.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `/api/students/${studentId}`,
        { batchId: null },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setStudents(students.filter(student => student._id !== studentId));

      // Show success message
      showSuccess('Student removed from batch successfully');

      // Refresh batch data to ensure UI is in sync with server
      await fetchBatch();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove student from batch';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error removing student from batch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadedFile(files[0]);
  };

  // Download template file
  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      // const response = await axios.get('/api/batches/template', {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      //   responseType: 'blob',
      // });

      // // Create a URL for the blob
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', 'student_import_template.xlsx');
      // document.body.appendChild(link);
      // link.click();

      // Clean up
      // link.parentNode?.removeChild(link);
      // window.URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.href = '/templates/batch-students-template.xlsx'; // path inside /public
      link.setAttribute('download', 'batch-students-template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      showSuccess('Template downloaded successfully');
    } catch (error: any) {
      const errorMessage = 'Failed to download template. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error downloading template:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate Excel file
  const handleValidateExcel = async () => {
    if (!id || !uploadedFile) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await axios.post(`/api/batches/${id}/upload-students`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // On success, move to preview step
      setValidatedStudents(response.data.students);
      setUploadStep('preview');

      // Show success message
      showSuccess(`Successfully validated ${response.data.students.length} students`);
    } catch (error: any) {
      // Handle validation errors
      if (error.response?.data?.errors) {
        setUploadErrors(error.response.data.errors);
        showError('The uploaded file contains errors. Please check and try again.');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to validate Excel file';
        setError(errorMessage);
        showError(errorMessage);
      }
      console.error('Error validating Excel file:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save uploaded students
  const handleSaveStudents = async () => {
    if (!id || validatedStudents.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await axios.post(
        `/api/batches/${id}/save-students`,
        { students: validatedStudents },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Set success state and refresh
      setUploadStep('complete');
      showSuccess(`Successfully added ${validatedStudents.length} students to the batch`);
      fetchBatch(); // Refresh batch data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save students';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error saving students:', error);
    } finally {
      setLoading(false);
    }
  };
  // Show exam selection modal for individual student
  const sendMail = (studentId: string) => {
    fetchBatchExams();
    setSelectedStudentId(studentId);
    setShowIndividualExamModal(true);
  };

  // Send individual exam invite with selected exam
  const sendIndividualExamInvite = async () => {
    if (!selectedStudentId || !selectedIndividualExamId) {
      showError('Please select a student and exam');
      return;
    }

    try {
      setSendingEmails(prev => ({ ...prev, [selectedStudentId]: true }));

      const student = students.find(s => s._id === selectedStudentId);
      if (!student) {
        showError('Student not found');
        return;
      }

      const exam = batchExams.find(e => e._id === selectedIndividualExamId);
      if (!exam) {
        showError('Selected exam not found');
        return;
      }

      // Use API URL directly without environment checks
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/mailservice`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: student.email,
          emailType: 'invite',
          payload: {
            email: student.email,
            name: student.name,
            password: 'Sampro@2025',
            loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5050'}/login`,
            examName: exam.name,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to send invitation email: ${response.status}`);
      }

      const data = await response.json();

      showSuccess(`Invitation email sent successfully for ${exam.name}!`);
      setSentEmails(prev => ({ ...prev, [selectedStudentId]: true }));

      // Close modal and reset state
      setShowIndividualExamModal(false);
      setSelectedStudentId(null);
      setSelectedIndividualExamId(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send invitation email';
      showError(errorMessage);
      console.error('Error sending invitation email:', error);
    } finally {
      setSendingEmails(prev => ({ ...prev, [selectedStudentId]: false }));
    }
  };

  const [batchExams, setBatchExams] = useState<Exam[]>([]);

  // Fetch exams assigned to this batch
  const fetchBatchExams = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`/api/exams?batch=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBatchExams(response.data.exams);
    } catch (error) {
      showError('Failed to fetch exams for this batch.');
    }
  };

  const sendBatchEmails = async (emailType: 'invite' | 'onboard', examId?: string) => {
    if (isSendingBatchEmails) {
      showInfo('Already sending emails. Please wait.');
      return;
    }

    if (!students || students.length === 0) {
      showInfo('There are no students in this batch to send emails to.');
      return;
    }
    let examName;
    if (emailType === 'invite') {
      if (!examId) {
        showError('No exam selected.');
        return;
      }
      const exam = batchExams.find(e => e._id === examId);
      if (!exam) {
        showError('Selected exam not found.');
        return;
      }
      examName = exam.name;
    }
    setIsSendingBatchEmails(true);
    const emailTypeDisplay = emailType === 'invite' ? `Invite for ${examName}` : 'Onboarding';
    showInfo(`Sending ${emailTypeDisplay} emails to ${students.length} students...`);

    let successCount = 0;
    let errorCount = 0;

    const emailPromises = students.map(student => {
      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'
      }/api/mailservice`;

      return fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: student.email,
          emailType: emailType,
          payload: {
            email: student.email,
            name: student.name,
            password: 'Sampro@2025',
            loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5050'}/login`,
            examName: emailType === 'invite' ? examName : 'exam',
          },
        }),
      })
        .then(response => {
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to send ${emailType} email to ${student.email}`);
          }
        })
        .catch(error => {
          errorCount++;
          console.error(`Error sending ${emailType} email to ${student.email}:`, error);
        });
    });

    await Promise.all(emailPromises);

    if (errorCount === 0) {
      showSuccess(`Successfully sent ${emailTypeDisplay} emails to all ${successCount} students.`);
    } else {
      showError(
        `Finished sending emails. Success: ${successCount}, Failed: ${errorCount}. Please check the console for details.`
      );
    }

    setIsSendingBatchEmails(false);
  };

  const sendbatchExamInvite = () => {
    fetchBatchExams();
    setShowExamSelectModal(true);
  };

  const handleSendExamInvites = () => {
    if (selectedExamId) {
      sendBatchEmails('invite', selectedExamId);
    }
    setShowExamSelectModal(false);
    setSelectedExamId(null);
  };

  const sendbatchOnboardMail = () => sendBatchEmails('onboard');

  // invite students to onboard email
  const sendOnboardMail = async (studentId: string) => {
    try {
      setSendingOnboardEmails(prev => ({ ...prev, [studentId]: true }));

      const student = students.find(s => s._id === studentId);
      if (!student) {
        showError('Student not found');
        return;
      }

      // Use API URL directly without environment checks
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/mailservice`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: student.email,
          emailType: 'onboard',
          payload: {
            email: student.email,
            name: student.name,
            password: 'Sampro@2025',
            loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5050'}/login`,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to send onboarding email: ${response.status}`);
      }

      const data = await response.json();

      showSuccess('Onboarding email sent successfully!');
      setSentOnboardEmails(prev => ({ ...prev, [studentId]: true }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send onboarding email';
      showError(errorMessage);
      console.error('Error sending onboarding email:', error);
    } finally {
      setSendingOnboardEmails(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Reset upload modal
  const handleResetUpload = () => {
    setUploadedFile(null);
    setValidatedStudents([]);
    setUploadErrors([]);
    setUploadStep('upload');
  };

  // Close upload modal
  const handleCloseUploadModal = () => {
    handleResetUpload();
    setShowUploadModal(false);
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const fullName =
      student.firstName && student.lastName
        ? `${student.firstName} ${student.lastName}`.toLowerCase()
        : student.name.toLowerCase();

    return fullName.includes(query) || student.email.toLowerCase().includes(query);
  });

  // Effect to fetch batch when ID changes
  useEffect(() => {
    if (id && token) {
      fetchBatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  if (loading && !batch) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout title="Batch Details | Admin" description="View and manage batch">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-8">Loading...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error && !batch) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout title="Batch Details | Admin" description="View and manage batch">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <div className="flex justify-center">
              <Button onClick={() => router.push('/admin/batches')}>Back to Batches</Button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title={`${batch?.name || 'Batch'} | Admin`} description="View and manage batch">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex text-sm">
              <Link href="/admin">
                <span className="text-blue-600 hover:underline">Dashboard</span>
              </Link>
              <span className="mx-2">/</span>
              <Link href="/admin/batches">
                <span className="text-blue-600 hover:underline">Batches</span>
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-600">{batch?.name}</span>
            </nav>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Batch details */}
          {batch && (
            <div className="mb-8">
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold">{batch.name}</h1>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowEditModal(true)}>
                      Edit Batch
                    </Button>
                    <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                      Bulk Upload Students
                    </Button>
                    <Button onClick={() => setShowAddStudentModal(true)}>Add Student</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Batch Details</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="mb-2">
                        <span className="font-semibold">Description:</span> {batch.description}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Year:</span> {batch.year}
                      </p>
                      <p className="mb-2 text-blue-600 font-bold">
                        <span className="font-semibold">Max Exam Attempts Allowed:</span>{' '}
                        {batch.maxAttempts || 'Not set'}
                      </p>
                      <p className="mb-2 text-blue-600 font-bold">
                        <span className="font-semibold">Max Security Incidents Allowed:</span>{' '}
                        {batch.maxSecurityIncidents || 'Using global setting (5)'}
                      </p>
                      <p className="mb-2 text-blue-600 font-bold">
                        <span className="font-semibold">Auto Suspension:</span>{' '}
                        <span
                          className={batch.enableAutoSuspend ? 'text-green-600' : 'text-red-600'}
                        >
                          {batch.enableAutoSuspend !== undefined
                            ? batch.enableAutoSuspend
                              ? 'Enabled'
                              : 'Disabled'
                            : 'Using global setting'}
                        </span>
                      </p>
                      <p className="mb-2 text-blue-600 font-bold">
                        <span className="font-semibold">
                          Additional Incidents After Suspension Removal:
                        </span>{' '}
                        {batch.additionalSecurityIncidentsAfterRemoval !== undefined
                          ? batch.additionalSecurityIncidentsAfterRemoval
                          : 'Using default (3)'}
                      </p>
                      <p className="mb-2 text-blue-600 font-bold">
                        <span className="font-semibold">Additional Attempts After Payment:</span>{' '}
                        {batch.additionalAttemptsAfterPayment !== undefined
                          ? batch.additionalAttemptsAfterPayment
                          : 'Using default (2)'}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Status:</span>{' '}
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            batch.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {batch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Created:</span>{' '}
                        {formatDate(batch.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col h-full">
                    <h2 className="text-lg font-semibold mb-2">Batch Statistics</h2>
                    <div className="bg-gray-50 p-4 rounded-lg  ">
                      <p className="mb-2">
                        <span className="font-semibold">Total Students:</span> {students.length}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="outline"
                        onClick={sendbatchExamInvite}
                        disabled={isSendingBatchEmails}
                      >
                        {isSendingBatchEmails ? 'Sending...' : 'Exam Invite'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={sendbatchOnboardMail}
                        disabled={isSendingBatchEmails}
                      >
                        {isSendingBatchEmails ? 'Sending...' : 'Onboard Invite'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Students in batch */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Students in this Batch</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                {searchQuery && (
                  <span className="text-sm text-gray-600">
                    {filteredStudents.length} of {students.length} students
                  </span>
                )}
              </div>
            </div>

            {students.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-600">No students in this batch yet.</p>
                <Button onClick={() => setShowAddStudentModal(true)} className="mt-4">
                  Add a Student
                </Button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-600">No students found matching your search criteria.</p>
                <Button onClick={() => setSearchQuery('')} variant="outline" className="mt-4">
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Mobile</th>
                      <th className="px-4 py-3 text-left">Date of Birth</th>
                      <th className="px-4 py-3 text-left">Roll Number</th>
                      <th className="px-4 py-3 text-center">Joined On</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/admin/students/${student._id}`}>
                            <span className="text-blue-600 hover:underline font-medium">
                              {student.firstName && student.lastName
                                ? `${student.firstName} ${student.lastName}`
                                : student.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">{student.email}</td>
                        <td className="px-4 py-3">{student.mobile || '-'}</td>
                        <td className="px-4 py-3">
                          {student.dateOfBirth ? formatDate(student.dateOfBirth) : '-'}
                        </td>
                        <td className="px-4 py-3">{student.rollNumber || '-'}</td>
                        <td className="px-4 py-3 text-center">{formatDate(student.createdAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => sendMail(student._id)}
                              disabled={sendingEmails[student._id]}
                              className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                              title="Send mail"
                            >
                              {sendingEmails[student._id]
                                ? 'Sending...'
                                : sentEmails[student._id]
                                  ? 'Re-send Exam Invite'
                                  : 'Exam Invite'}
                            </button>

                            <button
                              onClick={() => sendOnboardMail(student._id)}
                              disabled={sendingOnboardEmails[student._id]}
                              className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                              title="Send onboard mail"
                            >
                              {sendingOnboardEmails[student._id]
                                ? 'Sending...'
                                : sentOnboardEmails[student._id]
                                  ? 'Re-send Onboard Invite'
                                  : 'Onboard Invite'}
                            </button>

                            <Link href={`/admin/students/${student._id}`}>
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200">
                                View
                              </span>
                            </Link>
                            <button
                              onClick={() => handleRemoveStudent(student._id)}
                              className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 hover:bg-red-200"
                              title="Remove from Batch"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Batch Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white pb-4 border-b mb-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Edit Batch</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleEditBatch} className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded"
                      value={editedBatch.name}
                      onChange={e => setEditedBatch({ ...editedBatch, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded"
                      value={editedBatch.description}
                      onChange={e =>
                        setEditedBatch({ ...editedBatch, description: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Year</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={editedBatch.year}
                      onChange={e =>
                        setEditedBatch({ ...editedBatch, year: parseInt(e.target.value) })
                      }
                      min="2000"
                      max="2100"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Max Exam Attempts Allowed
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={editedBatch.maxAttempts}
                      onChange={e =>
                        setEditedBatch({ ...editedBatch, maxAttempts: parseInt(e.target.value) })
                      }
                      min="1"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Max Security Incidents Before Suspension
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={editedBatch.maxSecurityIncidents}
                      onChange={e =>
                        setEditedBatch({
                          ...editedBatch,
                          maxSecurityIncidents: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of security violations allowed before exam suspension
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={editedBatch.enableAutoSuspend}
                        onChange={e =>
                          setEditedBatch({ ...editedBatch, enableAutoSuspend: e.target.checked })
                        }
                      />
                      <span className="text-gray-700">Enable Automatic Exam Suspension</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-5">
                      When enabled, students will be automatically suspended after reaching the
                      maximum security incidents
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Additional Security Incidents After Suspension Removal
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={editedBatch.additionalSecurityIncidentsAfterRemoval}
                      onChange={e =>
                        setEditedBatch({
                          ...editedBatch,
                          additionalSecurityIncidentsAfterRemoval: parseInt(e.target.value),
                        })
                      }
                      min="0"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of additional security incidents allowed after a student pays to remove
                      a suspension
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Additional Attempts After Payment
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      value={editedBatch.additionalAttemptsAfterPayment}
                      onChange={e =>
                        setEditedBatch({
                          ...editedBatch,
                          additionalAttemptsAfterPayment: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of additional exam attempts granted when a student pays for more
                      attempts
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={editedBatch.isActive}
                        onChange={e =>
                          setEditedBatch({ ...editedBatch, isActive: e.target.checked })
                        }
                      />
                      <span className="text-gray-700">Active</span>
                    </label>
                  </div>
                  <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Exam Selection Modal */}
          {showExamSelectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Select an Exam to Send Invites</h2>
                <div className="space-y-2 mb-6">
                  {batchExams.length === 0 ? (
                    <div className="text-gray-500">No exams assigned to this batch.</div>
                  ) : (
                    batchExams.map(exam => (
                      <label
                        key={exam._id}
                        className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="examSelection"
                          value={exam._id}
                          checked={selectedExamId === exam._id}
                          onChange={() => setSelectedExamId(exam._id)}
                          className="mr-3"
                        />
                        <span>{exam.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowExamSelectModal(false);
                      setSelectedExamId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendExamInvites}
                    disabled={!selectedExamId || isSendingBatchEmails}
                  >
                    {isSendingBatchEmails ? 'Sending...' : 'Send Invites'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Individual Student Exam Selection Modal */}
          {showIndividualExamModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Select an Exam for Individual Invite</h2>
                <div className="space-y-2 mb-6">
                  {batchExams.length === 0 ? (
                    <div className="text-gray-500">No exams assigned to this batch.</div>
                  ) : (
                    batchExams.map(exam => (
                      <label
                        key={exam._id}
                        className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="individualExamSelection"
                          value={exam._id}
                          checked={selectedIndividualExamId === exam._id}
                          onChange={() => setSelectedIndividualExamId(exam._id)}
                          className="mr-3"
                        />
                        <span>{exam.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowIndividualExamModal(false);
                      setSelectedStudentId(null);
                      setSelectedIndividualExamId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendIndividualExamInvite}
                    disabled={!selectedIndividualExamId || sendingEmails[selectedStudentId || '']}
                  >
                    {sendingEmails[selectedStudentId || ''] ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Add Student Modal */}
          {showAddStudentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 sticky top-0 bg-white py-2">
                  Add Student to {batch?.name}
                </h2>
                <form onSubmit={handleAddStudent}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      First Name*
                    </label>
                    <input
                      type="text"
                      value={newStudent.firstName}
                      onChange={e =>
                        setNewStudent({
                          ...newStudent,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Last Name*</label>
                    <input
                      type="text"
                      value={newStudent.lastName}
                      onChange={e =>
                        setNewStudent({
                          ...newStudent,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Last Name"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email*</label>
                    <input
                      type="email"
                      value={newStudent.email}
                      onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="student@example.com"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Password*</label>
                    <input
                      type="password"
                      value={newStudent.password}
                      onChange={e =>
                        setNewStudent({
                          ...newStudent,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Create a password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={newStudent.mobile}
                      onChange={e =>
                        setNewStudent({
                          ...newStudent,
                          mobile: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mobile number"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={newStudent.dateOfBirth}
                      onChange={e =>
                        setNewStudent({
                          ...newStudent,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={newStudent.rollNumber}
                      onChange={e =>
                        setNewStudent({
                          ...newStudent,
                          rollNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., B2023001"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddStudentModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Adding...' : 'Add Student'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Upload Students Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Bulk Upload Students to {batch?.name}</h2>
                  <button
                    onClick={handleCloseUploadModal}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Upload step */}
                {uploadStep === 'upload' && (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded mb-6">
                      <p className="text-sm">
                        Upload an Excel (.xlsx) file with student data. The file should contain
                        columns for name, email, password, and optionally roll number.
                      </p>
                      <p className="text-sm mt-2">
                        <span className="font-semibold">Need a template?</span>{' '}
                        <button
                          onClick={handleDownloadTemplate}
                          className="text-blue-600 hover:text-blue-800 underline"
                          disabled={loading}
                        >
                          {loading ? 'Downloading...' : 'Download Excel Template'}
                        </button>
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                      </div>
                    )}

                    {uploadErrors && uploadErrors.length > 0 && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold mb-2">Excel Validation Errors:</p>
                        <ul className="list-disc pl-5">
                          {uploadErrors.map((err, index) => (
                            <li key={index} className="mb-2">
                              <div className="font-semibold">
                                {err.row === 0 ? 'File Error:' : `Row ${err.row}:`}
                              </div>
                              <ul className="list-disc pl-5 mb-1">
                                {err.errors.map((error, errorIndex) => (
                                  <li key={errorIndex}>{error}</li>
                                ))}
                              </ul>
                              {err.cells && err.cells.length > 0 && (
                                <div className="bg-yellow-50 p-2 mt-1 rounded text-yellow-800 text-sm">
                                  <p className="font-medium mb-1">Cell References:</p>
                                  <ul className="list-disc pl-5">
                                    {err.cells.map((cell, cellIndex) => (
                                      <li key={cellIndex}>
                                        <span className="font-mono bg-yellow-100 px-1 rounded">
                                          {cell.cell}
                                        </span>
                                        : {cell.message}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm mt-3 italic">
                          Please fix these errors in your Excel file and upload again.
                        </p>
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Excel File
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {uploadedFile ? (
                          <div>
                            <p className="mb-2 text-green-600">
                              <span className="font-semibold">{uploadedFile.name}</span> selected
                            </p>
                            <p className="text-sm text-gray-500">
                              {(uploadedFile.size / 1024).toFixed(2)} KB
                            </p>
                            <button
                              onClick={() => setUploadedFile(null)}
                              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                            >
                              Remove file
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input
                              id="file-upload"
                              type="file"
                              accept=".xlsx"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer text-blue-600 hover:text-blue-800"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <svg
                                  className="w-12 h-12 text-gray-400 mb-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <span className="text-blue-600 hover:text-blue-800">
                                  Click to select file
                                </span>
                                <p className="text-sm text-gray-500 mt-1">
                                  Only Excel (.xlsx) files are supported
                                </p>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleCloseUploadModal}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        disabled={!uploadedFile || loading}
                        onClick={handleValidateExcel}
                      >
                        {loading ? 'Validating...' : 'Validate & Preview'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Preview step */}
                {uploadStep === 'preview' && (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded mb-6">
                      <p className="text-sm">
                        Preview the student data before adding to the batch.{' '}
                        {validatedStudents.length} students will be added.
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                      </div>
                    )}

                    <div className="mb-6 overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              First Name
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Last Name
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Email
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Password
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Mobile
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Date of Birth
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Roll Number
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {validatedStudents.map((student, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {student.firstName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {student.lastName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.password}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.mobile || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.dateOfBirth || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.rollNumber || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleResetUpload}>
                        Back
                      </Button>
                      <Button type="button" disabled={loading} onClick={handleSaveStudents}>
                        {loading ? 'Saving...' : 'Save Students'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Complete step */}
                {uploadStep === 'complete' && (
                  <div className="text-center py-8">
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
                      <svg
                        className="w-16 h-16 text-green-600 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <h3 className="text-xl font-bold mb-2">Students Added Successfully!</h3>
                      <p>
                        {validatedStudents.length} students have been added to {batch?.name}.
                      </p>
                    </div>
                    <Button onClick={handleCloseUploadModal} fullWidth>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Snackbar component for toast notifications */}
          <Snackbar
            open={toast.open}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default BatchDetailPage;
