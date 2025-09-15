import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import Layout from "../components/Layout";
import Button from "../components/Button";

const Home: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/student");
      }
    }
  }, [isAuthenticated, user, router]);

  const redirectToDashboard = () => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/student");
      }
    } else {
      router.push("/login");
    }
  };

  return (
    <Layout title="Online Exam Portal - Home">
      <div className="flex flex-col items-center">
        <section className="py-12 px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-color mb-4">
            Welcome to the Online Exam Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A comprehensive platform for taking online examinations with
            immediate feedback and detailed performance analytics.
          </p>
          <div className="flex justify-center">
            <Button variant="primary" size="lg" onClick={redirectToDashboard}>
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Button>
          </div>
        </section>

        <section className="py-12 px-4 bg-white rounded-lg shadow-sm w-full max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-4">
              <div className="bg-primary-light bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary-color"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Timed Exams</h3>
              <p className="text-gray-600">
                Take time-bound exams with auto-submission when the timer
                expires.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="bg-primary-light bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary-color"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">MCQ Format</h3>
              <p className="text-gray-600">
                Answer multiple-choice questions with instant grading and
                feedback.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="bg-primary-light bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary-color"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Performance Analytics
              </h3>
              <p className="text-gray-600">
                Get detailed insights on your performance with comprehensive
                reports.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 w-full max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-white p-6 rounded-lg shadow-sm">
              <div className="text-primary-color font-bold text-xl mb-2">
                For Students
              </div>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Register and log in to your account</li>
                <li>Browse available subjects and courses</li>
                <li>Select an exam to take</li>
                <li>Complete the exam within the allocated time</li>
                <li>Receive immediate results and feedback</li>
                <li>Review your performance statistics</li>
              </ol>
            </div>

            <div className="flex-1 bg-white p-6 rounded-lg shadow-sm">
              <div className="text-primary-color font-bold text-xl mb-2">
                For Administrators
              </div>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Log in with admin credentials</li>
                <li>Create and manage subjects</li>
                <li>Add courses to each subject</li>
                <li>Create exams with multiple-choice questions</li>
                <li>
                  Set exam parameters such as duration and pass percentage
                </li>
                <li>View student performance and analytics</li>
              </ol>
            </div>
          </div>

          {/* <div className="flex justify-center text-center mt-8">
            <Button
              variant="primary"
              onClick={() =>
                router.push(
                  isAuthenticated
                    ? user?.role === "admin"
                      ? "/admin"
                      : "/student"
                    : "/register"
                )
              }
            >
              {isAuthenticated ? "Go to Dashboard" : "Register Now"}
            </Button>
          </div> */}
        </section>
      </div>
    </Layout>
  );
};

export default Home;
