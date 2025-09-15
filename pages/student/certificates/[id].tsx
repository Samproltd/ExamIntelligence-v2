import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Certificate from '../../../components/Certificate';
import { CertificateData } from '../../../utils/certificate';
import { generateAndDownloadCertificate } from '../../../utils/clientCertificate';

const CertificatePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [clientDownloadInProgress, setClientDownloadInProgress] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!id || !token) return;

    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/results/${id}/certificate`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          // Parse the date string into a Date object
          const examDate = new Date(response.data.data.issuedDate);

          setCertificateData({
            studentName: response.data.data.studentName || 'Student',
            examName: response.data.data.examName || 'Exam',
            examDate: examDate,
            certificateId: response.data.data.certificateId,
            score: response.data.data.score,
            percentage: response.data.data.percentage,
          });
        } else {
          setError('Failed to load certificate');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(
          'Failed to load certificate. You may not have access or the certificate does not exist.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id, token]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!certificateData || !id || !token) return;

    try {
      setDownloadInProgress(true);

      // Create a new anchor element for direct download
      const a = document.createElement('a');
      a.href = `/api/results/${id}/certificate/download?token=${encodeURIComponent(token)}`;
      a.target = '_blank'; // Open in new tab
      a.download = `certificate-${certificateData.certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);

      // Set a timeout to reset the download state after 3 seconds
      setTimeout(() => {
        setDownloadInProgress(false);
      }, 3000);
    } catch (err) {
      console.error('Error initiating PDF certificate download:', err);
      setError('Failed to download PDF certificate. Please try again later.');
      setDownloadInProgress(false);
    }
  };

  const handleDirectDownloadPdf = async () => {
    if (!certificateData || !id || !token) return;

    try {
      setDownloadInProgress(true);
      // Request PDF from the server using Axios
      const response = await axios.get(`/api/results/${id}/certificate/download`, {
        // Include token in both header and query param for robustness
        headers: { Authorization: `Bearer ${token}` },
        params: { token },
        responseType: 'blob',
      });

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Create a download link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateData.certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF certificate:', err);
      setError('Failed to download PDF certificate. Please try again later.');
    } finally {
      setDownloadInProgress(false);
    }
  };

  // Generate certificate in browser and download as PDF
  const handleClientDownloadPdf = async () => {
    if (!certificateData) return;

    try {
      setClientDownloadInProgress(true);

      // Use our utility function for certificate generation
      await generateAndDownloadCertificate({
        studentName: certificateData.studentName,
        examName: certificateData.examName,
        certificateId: certificateData.certificateId,
        score: certificateData.score,
        percentage: certificateData.percentage,
      });
    } catch (err) {
      console.error('Error generating PDF in browser:', err);
      setError('Failed to generate certificate PDF in browser');
    } finally {
      setClientDownloadInProgress(false);
    }
  };

  const handleDownloadHTML = () => {
    // Create an invisible iframe to render the certificate
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    document.body.appendChild(iframe);

    // Write the certificate HTML to the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Certificate</title>
          <style>
            body { margin: 0; }
            ${document.querySelector('style')?.innerHTML || ''}
          </style>
        </head>
        <body>
          ${document.querySelector('.certificate-container')?.outerHTML || ''}
        </body>
        </html>
      `);
      iframeDoc.close();

      // Create a download link for the certificate
      setTimeout(() => {
        try {
          const certificateHtml = iframeDoc.documentElement.outerHTML;
          const blob = new Blob([certificateHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `certificate-${certificateData?.certificateId || 'download'}.html`;
          document.body.appendChild(a);
          a.click();

          // Clean up
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          document.body.removeChild(iframe);
        } catch (err) {
          console.error('Error downloading certificate:', err);
          setError('Failed to download certificate');
          document.body.removeChild(iframe);
        }
      }, 100);
    }
  };

  return (
    <ProtectedRoute requiredRole="student">
      <Layout title="Certificate" description="View and download your certificate">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Certification of Completion</h1>
            <div className="flex space-x-4">
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Print
              </button>
              {downloadInProgress || clientDownloadInProgress ? (
                <button
                  disabled
                  className="bg-gray-400 text-white py-2 px-4 rounded cursor-not-allowed mb-4 w-full md:w-64 flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Downloading...
                </button>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 ">
                  <button
                    onClick={handleClientDownloadPdf}
                    className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download PDF
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    From Server
                  </button>
                  <button
                    onClick={handleDownloadHTML}
                    className=" bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download HTML
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {certificateData && (
            <div>
              <Certificate data={certificateData} />
              <div className="mt-6 text-center text-gray-600">
                <p>
                  This certificate has been issued to acknowledge your successful completion of the
                  exam.
                </p>
                <p className="mt-2">
                  Certificate ID:{' '}
                  <span className="font-semibold">{certificateData.certificateId}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default CertificatePage;
