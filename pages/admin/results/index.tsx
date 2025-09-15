import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import { format } from 'date-fns';
import { MagnifyingGlassIcon, FunnelIcon, XCircleIcon } from '@heroicons/react/20/solid';
import Head from 'next/head';
import useToast from '@/hooks/useToast';
import Snackbar from '@/components/Snackbar';

interface FilterOptions {
  exam: string;
  batch: string;
  status: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
  uniqueStudents: boolean;
}

interface Result {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  exam: {
    _id: string;
    name: string;
    maxAttempts: number;
  };
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  startTime: string;
  endTime: string;
  batch?: {
    _id: string;
    name: string;
  };
  notAttempted?: boolean;
  actualMaxAttempts?: number;
}

const Results = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [apiMessage, setApiMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [attemptsLoading, setAttemptsLoading] = useState<{ [key: string]: boolean }>({});
  const [emailSending, setEmailSending] = useState<{ [key: string]: boolean }>({});
  const [sentEmails, setSentEmails] = useState<{ [key: string]: boolean }>({});
  const { showSuccess, showError, toast, hideToast } = useToast();

  // State for filter options
  const [filters, setFilters] = useState<FilterOptions>({
    exam: '',
    batch: '',
    status: '',
    startDate: '',
    endDate: '',
    searchTerm: '',
    uniqueStudents: false,
  });

  // State for available exams and batches (for dropdowns)
  const [exams, setExams] = useState<{ _id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });

  // Load filters from localStorage and URL on initial render
  useEffect(() => {
    // Only run this once on initial load
    if (!isInitialized && router.isReady) {
      // First try to get values from URL query parameters
      const { exam, batch, status, startDate, endDate, search, uniqueStudents, page } =
        router.query;

      // Then check localStorage for saved filters
      const savedFilters = localStorage.getItem('resultFilters');
      const savedPagination = localStorage.getItem('resultPagination');

      let newFilters = { ...filters };
      let newPagination = { ...pagination };

      // Apply URL params if present
      if (exam || batch || status || startDate || endDate || search || uniqueStudents || page) {
        newFilters = {
          ...newFilters,
          exam: typeof exam === 'string' ? exam : '',
          batch: typeof batch === 'string' ? batch : '',
          status: typeof status === 'string' ? status : '',
          startDate: typeof startDate === 'string' ? startDate : '',
          endDate: typeof endDate === 'string' ? endDate : '',
          searchTerm: typeof search === 'string' ? search : '',
          uniqueStudents: uniqueStudents === 'true',
        };

        if (typeof page === 'string' && !isNaN(parseInt(page))) {
          newPagination.page = parseInt(page);
        }
      }
      // If no URL params, try localStorage values
      else if (savedFilters) {
        try {
          const parsedFilters = JSON.parse(savedFilters);
          newFilters = { ...newFilters, ...parsedFilters };

          if (savedPagination) {
            const parsedPagination = JSON.parse(savedPagination);
            newPagination = { ...newPagination, ...parsedPagination };
          }
        } catch (e) {
          console.error('Error parsing saved filters:', e);
        }
      }

      setFilters(newFilters);
      setPagination(newPagination);
      setIsInitialized(true);
    }
  }, [router.isReady, router.query, isInitialized]);

  // Fetch data on component mount - but after initialization
  useEffect(() => {
    if (isInitialized) {
      fetchExams();
      fetchBatches();
      fetchResults();
    }
  }, [isInitialized]);

  // Fetch results when filters change or pagination changes
  useEffect(() => {
    if (isInitialized) {
      fetchResults();
      // Update URL with current filters
      updateUrlWithFilters();
      // Save filters to localStorage
      saveFiltersToLocalStorage();
    }
  }, [filters, pagination.page, isInitialized]);

  // Save filters to localStorage
  const saveFiltersToLocalStorage = () => {
    localStorage.setItem('resultFilters', JSON.stringify(filters));
    localStorage.setItem('resultPagination', JSON.stringify({ page: pagination.page }));
  };

  // Update URL with current filters
  const updateUrlWithFilters = () => {
    const query: any = {};

    if (filters.exam) query.exam = filters.exam;
    if (filters.batch) query.batch = filters.batch;
    if (filters.status) query.status = filters.status;
    if (filters.searchTerm) query.search = filters.searchTerm;
    if (filters.startDate) query.startDate = filters.startDate;
    if (filters.endDate) query.endDate = filters.endDate;
    if (filters.uniqueStudents) query.uniqueStudents = 'true';
    if (pagination.page > 1) query.page = pagination.page.toString();

    router.replace(
      {
        pathname: router.pathname,
        query: query,
      },
      undefined,
      { shallow: true }
    );
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      setApiMessage('');

      // Get the authentication token
      const token = localStorage.getItem('token');

      // Build the query parameters
      const params = new URLSearchParams();
      if (filters.exam) params.append('exam', filters.exam);
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.status) params.append('status', filters.status);
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.uniqueStudents) params.append('uniqueStudents', 'true');
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await axios.get(`/api/admin/results?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setResults(response.data.results);
        setPagination(response.data.pagination);

        // Check if API returned a message
        if (response.data.message) {
          setApiMessage(response.data.message);
        }

        setError('');

        // For each result, fetch the actual max attempts
        response.data.results.forEach((result: Result) => {
          if (!result.notAttempted) {
            fetchActualMaxAttempts(result);
          }
        });
      } else {
        setError(response.data.message || 'Failed to fetch results');
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      // Get the authentication token
      const token = localStorage.getItem('token');

      const response = await axios.get('/api/exams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setExams(response.data.exams);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      // Get the authentication token
      const token = localStorage.getItem('token');

      const response = await axios.get('/api/batches', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setBatches(response.data.batches);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    // Reset to page 1 when filters change
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      exam: '',
      batch: '',
      status: '',
      startDate: '',
      endDate: '',
      searchTerm: '',
      uniqueStudents: false,
    });
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const viewResultDetails = (resultId: string) => {
    router.push(`/admin/results/${resultId}`);
  };

  // Helper function to get max attempts with fallback to default
  const getMaxAttempts = (result: Result) => {
    return result.actualMaxAttempts || result.exam?.maxAttempts || 3; // Default to 3 if not defined
  };

  // Fetch actual max attempts for a result
  const fetchActualMaxAttempts = async (result: Result) => {
    try {
      if (result.notAttempted || attemptsLoading[result._id]) {
        return;
      }

      setAttemptsLoading(prev => ({ ...prev, [result._id]: true }));

      // Get the authentication token
      const token = localStorage.getItem('token');

      const response = await axios.get(`/api/admin/student-exam-attempts`, {
        params: {
          studentId: result.student._id,
          examId: result.exam._id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Update the result with actual max attempts
        setResults(prevResults =>
          prevResults.map(r =>
            r._id === result._id
              ? { ...r, actualMaxAttempts: response.data.data.totalMaxAttempts }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Error fetching max attempts:', err);
    } finally {
      setAttemptsLoading(prev => ({ ...prev, [result._id]: false }));
    }
  };

  const handleNotifyToPay = async (result: Result) => {
    const token = localStorage.getItem('token');
    const examId = result.exam._id;
    const studentMail = result.student.email;
    const studentName = result.student.name;
    const examName = result.exam.name;

    try {
      // Set loading state for this specific email
      setEmailSending(prev => ({ ...prev, [result._id]: true }));

      console.log(`Initiating email send for exam ${examId} to ${studentMail}`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/mailservice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: studentMail,
            emailType: 'attempt-refill-notification',
            payload: {
              email: studentMail,
              name: studentName,
              examName: examName,
              dashboardLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5050'}/student`,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      console.log('Mail sent successfully');
      showSuccess(`Mail sent to ${studentName} for ${examName}.`);

      // Mark this email as sent
      setSentEmails(prev => ({ ...prev, [result._id]: true }));
    } catch (error) {
      console.error('Error sending notification:', error);
      showError(`Failed to send mail to ${studentName}.`);
    } finally {
      // Clear loading state whether success or failure
      setEmailSending(prev => ({ ...prev, [result._id]: false }));
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const toggleFilterSection = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const exportToExcel = async () => {
    try {
      // Get all results (no pagination)
      const token = localStorage.getItem('token');

      // Build the query parameters with all filters but no pagination
      const params = new URLSearchParams();
      if (filters.exam) params.append('exam', filters.exam);
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.status) params.append('status', filters.status);
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.uniqueStudents) params.append('uniqueStudents', 'true');
      params.append('limit', '1000'); // Get a large number of results for export

      setLoading(true);
      const response = await axios.get(`/api/admin/results?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Load the SheetJS library dynamically
        const XLSX = await import('xlsx');

        // Prepare data for Excel
        const results = response.data.results;

        // Create worksheet data
        const wsData = results.map(result => {
          const status = result.notAttempted ? 'Not Attempted' : result.passed ? 'Pass' : 'Fail';
          const date = result.notAttempted
            ? '-'
            : format(new Date(result.endTime), 'dd MMM yyyy HH:mm');
          const score = result.notAttempted ? '-' : `${result.score}/${result.totalQuestions}`;
          const percentage = result.notAttempted ? '-' : `${result.percentage.toFixed(2)}%`;

          return {
            'Student Name': result.student.name,
            Email: result.student.email,
            Exam: result.exam.name,
            Batch: result.batch?.name || '-',
            Score: score,
            Percentage: percentage,
            Status: status,
            Date: date,
          };
        });

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(wsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

        // Generate Excel file (.xlsx)
        XLSX.writeFile(workbook, `exam_results_${new Date().toISOString().split('T')[0]}.xlsx`);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setLoading(false);

      // If SheetJS library fails, fallback to server-side export
      try {
        const token = localStorage.getItem('token');

        // Build the query parameters with all filters
        const params = new URLSearchParams();
        if (filters.exam) params.append('exam', filters.exam);
        if (filters.batch) params.append('batch', filters.batch);
        if (filters.status) params.append('status', filters.status);
        if (filters.searchTerm) params.append('search', filters.searchTerm);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.uniqueStudents) params.append('uniqueStudents', 'true');

        // Create download URL
        const downloadUrl = `/api/admin/exports/results?${params.toString()}`;

        // Create a download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute(
          'download',
          `exam_results_${new Date().toISOString().split('T')[0]}.xlsx`
        );
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        console.error('Fallback export also failed:', fallbackErr);
      }
    }
  };

  // Handle toggle for unique students filter - immediately apply
  const handleUniqueStudentsToggle = () => {
    const newValue = !filters.uniqueStudents;
    setFilters(prev => ({
      ...prev,
      uniqueStudents: newValue,
    }));
    // Reset to page 1 when filters change
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  return (
    <AdminLayout title="Exam Results - Admin Dashboard">
      <div className="mx-auto px-4">
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Exam Results</h1>
            <div className="flex space-x-4">
              <button
                onClick={toggleFilterSection}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition"
              >
                <FunnelIcon className="h-5 w-5" />
                <span>{isFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
              </button>

              <button
                onClick={exportToExcel}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Export to Excel</span>
              </button>
            </div>
          </div>

          {/* Enhanced Filters Section */}
          {isFilterOpen && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-indigo-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center text-sm text-gray-600 hover:text-red-600"
                >
                  <XCircleIcon className="h-5 w-5 mr-1" />
                  Clear all filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Search Bar */}
                <div className="lg:col-span-3">
                  <div className="relative mt-1 flex items-center">
                    <input
                      type="text"
                      name="searchTerm"
                      value={filters.searchTerm}
                      onChange={handleFilterChange}
                      placeholder="Search by student name or email..."
                      className="block w-full pr-10 pl-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Exam Filter */}
                <div>
                  <label htmlFor="exam" className="block text-sm font-medium text-gray-700 mb-1">
                    Exam
                  </label>
                  <select
                    id="exam"
                    name="exam"
                    value={filters.exam}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All Exams</option>
                    {exams.map(exam => (
                      <option key={exam._id} value={exam._id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Filter */}
                <div>
                  <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-1">
                    Batch
                  </label>
                  <select
                    id="batch"
                    name="batch"
                    value={filters.batch}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All Batches</option>
                    {batches.map(batch => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="not_attempted">Not Attempted</option>
                  </select>
                </div>

                {/* Date Range Filters */}
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    From Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Unique Students Toggle */}
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.uniqueStudents}
                      onChange={handleUniqueStudentsToggle}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Show only latest result per student
                    </span>
                  </label>
                </div>

                {/* Apply Filters Button */}
                {/* <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => fetchResults()}
                    className="py-2 px-4 w-full border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Apply Filters
                  </button>
                </div> */}
              </div>
            </div>
          )}

          {/* Results Table with Card Design */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Results</h2>
              {!loading && !error && results.length > 0 && (
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">{error}</div>
            ) : apiMessage ? (
              <div className="text-center p-8">
                <div className="flex flex-col items-center justify-center">
                  <svg
                    className="h-12 w-12 text-indigo-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg font-medium text-gray-700">Information</p>
                  <p className="text-sm mt-1 text-gray-500 max-w-md text-center">{apiMessage}</p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-gray-500 p-8">
                <div className="flex flex-col items-center justify-center">
                  <svg
                    className="h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg font-medium">No results found matching the criteria.</p>
                  <p className="text-sm mt-1">
                    Try adjusting your filters or clearing them to see more results.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Student
                        </th>
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
                          Batch
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Score
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
                          Attempt #
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map(result => (
                        <tr
                          key={result._id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-700 font-medium">
                                  {result.student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.student.name}
                                </div>
                                <div className="text-sm text-gray-500">{result.student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{result.exam.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{result.batch?.name || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {result.notAttempted ? (
                                <span className="text-gray-500">Not Attempted</span>
                              ) : (
                                <>
                                  {result.score} / {result.totalQuestions}
                                </>
                              )}
                            </div>
                            {!result.notAttempted && (
                              <div className="text-xs text-gray-500">
                                {result.percentage.toFixed(2)}%
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                result.notAttempted
                                  ? 'bg-gray-100 text-gray-800'
                                  : result.passed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {result.notAttempted
                                ? 'Not Attempted'
                                : result.passed
                                  ? 'Pass'
                                  : 'Fail'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.notAttempted ? (
                              <div className="text-sm text-gray-500">-</div>
                            ) : (
                              <>
                                <div className="text-sm text-gray-900">
                                  {format(new Date(result.endTime), 'dd MMM yyyy')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(new Date(result.endTime), 'HH:mm')}
                                </div>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {result.notAttempted
                                ? '-'
                                : `${result.attemptNumber} / ${getMaxAttempts(result)}`}
                              {attemptsLoading[result._id] && (
                                <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-500 border-r-transparent"></span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => viewResultDetails(result._id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Details
                            </button>
                            {result.notAttempted ? (
                              <span className="text-gray-500 text-sm">No details available</span>
                            ) : (
                              <>
                                {!result.passed &&
                                result.attemptNumber >= getMaxAttempts(result) ? (
                                  <button
                                    onClick={() => handleNotifyToPay(result)}
                                    disabled={emailSending[result._id]}
                                    className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                                      emailSending[result._id]
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                    }`}
                                  >
                                    {emailSending[result._id] ? (
                                      <>
                                        <svg
                                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          ></path>
                                        </svg>
                                        Sending...
                                      </>
                                    ) : sentEmails[result._id] ? (
                                      'Re-send Email'
                                    ) : (
                                      'Send Email'
                                    )}
                                  </button>
                                ) : (
                                  '-'
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          pagination.page === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          handlePageChange(Math.min(pagination.pages, pagination.page + 1))
                        }
                        disabled={pagination.page === pagination.pages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          pagination.page === pagination.pages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {(pagination.page - 1) * pagination.limit + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                          </span>{' '}
                          of <span className="font-medium">{pagination.total}</span> results
                        </p>
                      </div>
                      <div>
                        <nav
                          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                          aria-label="Pagination"
                        >
                          <button
                            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                              pagination.page === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>

                          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            // Determine which page numbers to show
                            let pageNum;
                            if (pagination.pages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.pages - 2) {
                              pageNum = pagination.pages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }

                            return (
                              <button
                                key={i}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  pagination.page === pageNum
                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() =>
                              handlePageChange(Math.min(pagination.pages, pagination.page + 1))
                            }
                            disabled={pagination.page === pagination.pages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                              pagination.page === pagination.pages
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Snackbar component */}
      <Snackbar open={toast.open} message={toast.message} type={toast.type} onClose={hideToast} />
    </AdminLayout>
  );
};

export default Results;
