import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import AdminLayout from "../../../../components/AdminLayout";
import Button from "../../../../components/Button";
import Card from "../../../../components/Card";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";

interface Exam {
  _id: string;
  name: string;
  description: string;
  course: {
    _id: string;
    name: string;
    subject: {
      _id: string;
      name: string;
    };
  };
  duration: number;
  totalMarks: number;
  passPercentage: number;
}

interface QuestionData {
  text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number;
}

const UploadQuestionsPage = () => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validatedQuestions, setValidatedQuestions] = useState<QuestionData[]>(
    []
  );
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
   const [uploadStep, setUploadStep] = useState<
    "upload" | "preview" | "complete"
  >("upload");

  const router = useRouter();
  const { id } = router.query;
  const { token } = useSelector((state: RootState) => state.auth);

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
      // const response = await axios.get("/api/exams/template", {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      //   responseType: "blob",
      // });

      // // Create a URL for the blob
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement("a");
      // link.href = url;
      // link.setAttribute("download", "question_import_template.xlsx");
      // document.body.appendChild(link);
      // link.click();

      // // Clean up
      // link.parentNode?.removeChild(link);
      // window.URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.href = '/templates/question-import-template.xlsx'; // path inside /public
      link.setAttribute('download', 'question-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      setError('Failed to download template. Please try again.');
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
      formData.append("file", uploadedFile);

      const response = await axios.post(
        `/api/exams/${id}/upload-questions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // On success, move to preview step
      setValidatedQuestions(response.data.questions);
      setUploadStep("preview");
    } catch (error: any) {
      // Handle validation errors
      if (error.response?.data?.errors) {
        setUploadErrors(error.response.data.errors);
      } else {
        setError(error.response?.data?.message || "Failed to validate Excel file");
      }
       console.error("Error validating Excel file:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save uploaded questions
  const handleSaveQuestions = async () => {
    if (!id || validatedQuestions.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await axios.post(
        `/api/exams/${id}/save-questions`,
        { questions: validatedQuestions },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Set success state
      setUploadStep("complete");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to save questions");
      console.error("Error saving questions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset upload
  const handleResetUpload = () => {
    setUploadedFile(null);
    setValidatedQuestions([]);
    setUploadErrors([]);
    setUploadStep("upload");
  };

  useEffect(() => {
    const fetchExam = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`/api/exams/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setExam(response.data.exam);
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to fetch exam details");
        console.error("Error fetching exam details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchExam();
    }
  }, [id, token]); // only depends on actual used values

  if (loading && !exam) {
    return (
      <ProtectedRoute requiredRole="admin">
         <AdminLayout
          title="Upload Questions | Admin"
          description="Upload questions to exam"
        >
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-8">Loading...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error && !exam) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout
          title="Upload Questions | Admin"
          description="Upload questions to exam"
        >
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/admin/exams")}>
                Back to Exams
              </Button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout
        title={`Upload Questions | ${exam?.name || "Exam"}`}
        description="Upload questions to exam"
      >
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex text-sm">
              <Link href="/admin">
                <span className="text-blue-600 hover:underline">Dashboard</span>
              </Link>
              <span className="mx-2">/</span>
              <Link href="/admin/exams">
                <span className="text-blue-600 hover:underline">Exams</span>
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/admin/exams/${id}`}>
                <span className="text-blue-600 hover:underline">{exam?.name}</span>
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-600">Upload Questions</span>
            </nav>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <Card>
            <h1 className="text-2xl font-bold mb-6">
              Upload Questions to {exam?.name}
            </h1>

            {/* Upload step */}
            {uploadStep === "upload" && (
              <div>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded mb-6">
                  <p className="text-sm">
                    Upload an Excel (.xlsx) file with question data. The file
                    should contain columns for question text, options, and the
                    correct answer.
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-semibold">Need a template?</span>{" "}
                    <button
                      onClick={handleDownloadTemplate}
                      className="text-blue-600 hover:text-blue-800 underline"
                      disabled={loading}
                    >
                      {loading ? "Downloading..." : "Download Excel Template"}
                    </button>
                  </p>
                </div>

                {uploadErrors && uploadErrors.length > 0 && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="font-bold mb-2">Excel Validation Errors:</p>
                    <ul className="list-disc pl-5">
                      {uploadErrors.map((err, index) => (
                        <li key={index} className="mb-2">
                          <div className="font-semibold">
                            {err.row === 0 ? "File Error:" : `Row ${err.row}:`}
                          </div>
                          <ul className="list-disc pl-5 mb-1">
                            {err.errors.map((error, errorIndex) => (
                              <li key={errorIndex}>{error}</li>
                            ))}
                          </ul>
                          {err.cells && err.cells.length > 0 && (
                            <div className="bg-yellow-50 p-2 mt-1 rounded text-yellow-800 text-sm">
                              <p className="font-medium mb-1">
                                Cell References:
                              </p>
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
                      Please fix these errors in your Excel file and upload
                      again.
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
                          <span className="font-semibold">
                            {uploadedFile.name}
                          </span>{" "}
                          selected
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/exams/${id}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!uploadedFile || loading}
                    onClick={handleValidateExcel}
                  >
                    {loading ? "Validating..." : "Validate & Preview"}
                  </Button>
                </div>
              </div>
            )}

            {/* Preview step */}
            {uploadStep === "preview" && (
              <div>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded mb-6">
                  <p className="text-sm">
                    Preview the question data before adding to the exam.{" "}
                    {validatedQuestions.length} questions will be added.
                  </p>
                </div>

                <div className="mb-6 overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Question
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Option 1
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Option 2
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Option 3
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Option 4
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Correct
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validatedQuestions.map((question, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {question.text}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              question.correctOption === 1
                                ? "font-bold text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {question.option1}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              question.correctOption === 2
                                ? "font-bold text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {question.option2}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              question.correctOption === 3
                                ? "font-bold text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {question.option3}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              question.correctOption === 4
                                ? "font-bold text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {question.option4}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Option {question.correctOption}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetUpload}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={handleSaveQuestions}
                  >
                    {loading ? "Saving..." : "Save Questions"}
                  </Button>
                </div>
              </div>
            )}

            {/* Complete step */}
            {uploadStep === "complete" && (
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
                  <h3 className="text-xl font-bold mb-2">
                    Questions Added Successfully!
                  </h3>
                  <p>
                    {validatedQuestions.length} questions have been added to{" "}
                    {exam?.name}.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button onClick={() => router.push(`/admin/exams/${id}`)}>
                    Back to Exam
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default UploadQuestionsPage;
