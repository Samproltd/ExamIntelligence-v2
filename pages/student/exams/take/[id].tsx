import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Layout from '../../../../components/Layout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import Button from '../../../../components/Button';
import Timer from '../../../../components/Timer';
import ExamSecurityWarning from '../../../../components/ExamSecurityWarning';
import ExamSuspensionAlert from '../../../../components/ExamSuspensionAlert';
import ExamSystemCheck from '../../../../components/ExamSystemCheck';
import {
  fetchExam,
  startExam,
  resetExam,
  loadSavedAnswers,
  answerQuestion,
  submitExam,
  goToPreviousQuestion,
  goToNextQuestion,
  goToQuestion,
  setExam,
} from '../../../../store/slices/examSlice';
import { RootState, AppDispatch } from '../../../../store';
import { useToast } from '../../../../hooks/useToast';

// Define interfaces for our data structures if they don't exist elsewhere
interface ExamQuestion {
  _id: string;
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
}

interface Answer {
  questionId: string;
  selectedOption: string;
}

interface Exam {
  _id: string;
  name: string;
  duration: number;
  questions: ExamQuestion[];
  // other fields...
}

// Add new component for the time's up flash notification
const TimeUpFlash = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-red-600 z-[10001] flex items-center justify-center animate-flash">
      <div className="text-white text-5xl font-bold">TIME'S UP!</div>
    </div>
  );
};

// Add new component for the submission overlay
const SubmissionOverlay = ({ message, isVisible }: { message: string; isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-[10000] flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-color mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold mb-3">{message}</h2>
        <p className="text-gray-600">Please wait while we process your submission...</p>
      </div>
    </div>
  );
};

// Helper function to ensure consistent answer formatting
const prepareAnswersForSubmission = (currentExam: Exam, userAnswers: Answer[]): Answer[] => {
  try {
    // Create maps for efficient lookups
    const questionsMap = new Map(currentExam.questions.map(q => [q._id, q]));
    const answersMap = new Map(userAnswers.map(a => [a.questionId, a]));

    // Create complete answer set with all questions
    const formattedAnswers = Array.from(questionsMap.keys()).map(questionId => {
      const existingAnswer = answersMap.get(questionId);
      return {
        questionId: questionId as string,
        selectedOption: existingAnswer?.selectedOption || 'not_attempted', // Use marker for unanswered
      };
    });

    // Validate the structure to ensure there are no empty answers
    const hasInvalidAnswers = formattedAnswers.some(
      answer => !answer.questionId || answer.selectedOption === undefined
    );

    if (hasInvalidAnswers) {
      console.error('Found invalid answers in formatted data. Using fallback method.');
      // Fallback to ensure we have a valid answer set
      return currentExam.questions.map(question => ({
        questionId: question._id,
        selectedOption:
          userAnswers.find(a => a.questionId === question._id)?.selectedOption || 'not_attempted',
      }));
    }

    return formattedAnswers;
  } catch (error) {
    console.error('Error formatting answers:', error);
    // Last-resort fallback in case of any error
    return currentExam.questions.map(question => ({
      questionId: question._id,
      selectedOption: 'not_attempted',
    }));
  }
};

const CameraPreview = ({ stream }: { stream: MediaStream | null }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] rounded-full overflow-hidden border-2 border-primary-color shadow-lg w-40 h-40">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
    </div>
  );
};

// Add Mobile Tracking Component
const MobileTrackingIndicator = () => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] text-red-600 flex items-center gap-2">
      <svg
        className="w-8 h-8 animate-[wiggle_1s_ease-in-out_infinite]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <span className="font-medium text-red-600 whitespace-nowrap">Tracking Mobile Device</span>
    </div>
  );
};

// Add camera shutter sound effect
const playCameraSound = () => {
  try {
    const audio = new Audio('/audio/camera-capture.mp3');
    audio.volume = 1.0; // Set maximum volume
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Audio played successfully');
        })
        .catch(error => {
          console.error('Audio play failed:', error);
        });
    }
  } catch (error) {
    console.error('Error creating audio:', error);
  }
};

const TakeExamPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useDispatch<AppDispatch>();
  const {
    currentExam,
    currentQuestionIndex,
    userAnswers,
    loading,
    error,
    examStarted,
    examSubmitted,
    result,
  } = useSelector((state: RootState) => state.exam);

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: '',
  });
  const [submissionOverlay, setSubmissionOverlay] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: '',
  });
  const examContainerRef = useRef<HTMLDivElement>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Exam suspension state
  const [examSuspended, setExamSuspended] = useState(false);
  const [suspensionData, setSuspensionData] = useState<{
    reason: string;
    incidentCount: number;
    timestamp: string;
  }>({
    reason: '',
    incidentCount: 0,
    timestamp: '',
  });
  const [securitySettings, setSecuritySettings] = useState<{
    enableAutoSuspend: boolean;
    maxIncidents: number;
  }>({
    enableAutoSuspend: false,
    maxIncidents: 5,
  });
  const [currentIncidentCount, setCurrentIncidentCount] = useState(0);

  // New state variables for system check
  const [systemCheckComplete, setSystemCheckComplete] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // New state to track when ready to start after system check
  const [readyToStart, setReadyToStart] = useState(false);

  // Add a new state variable for tracking camera status
  const [isCameraActive, setIsCameraActive] = useState(true);
  const cameraCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add a ref to track if we've already shuffled the exam
  const hasShuffled = useRef(false);

  // Add state for tracking indicator
  const [showMobileTracking, setShowMobileTracking] = useState(false);

  // Add flag to prevent multiple submissions when time expires
  const isSubmittingRef = useRef(false);
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add state for time's up flash notification
  const [showTimeUpFlash, setShowTimeUpFlash] = useState(false);
  // Add to existing state declarations at the top of the component
  const [sessionTrackingId, setSessionTrackingId] = useState<string | null>(null);

  const { showError } = useToast();

  // First, define the stopCamera function right after state variables
  const stopCamera = useCallback(() => {
    if (mediaStream) {
      console.log('Stopping camera and microphone tracks');
      mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      setMediaStream(null);
    }
  }, [mediaStream]);

  // Define the handleSecurityIncident function as a useCallback
  const handleSecurityIncident = useCallback(
    async (type: string, details: string): Promise<void> => {
      try {
        const token = localStorage.getItem('token');
        if (!id || !token) return;

        const response = await axios.post(
          `/api/security-incidents`,
          {
            examId: id,
            incidentType: type,
            incidentDetails: details,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Update state with current incident count and security settings
        if (response.data.securitySettings) {
          setSecuritySettings(response.data.securitySettings);
        }
        if (response.data.incidentCount) {
          setCurrentIncidentCount(response.data.incidentCount);
        }

        // If the exam is now suspended, update the UI
        if (response.data.suspended) {
          setExamSuspended(true);
          const suspensionData = response.data.suspension;
          setSuspensionData({
            reason: suspensionData.reason,
            incidentCount: suspensionData.incidents.length,
            timestamp: suspensionData.suspensionTime,
          });

          // Stop camera when exam is suspended
          stopCamera();

          // Exit fullscreen mode if it's active
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
              console.error(`Error exiting fullscreen: ${err.message}`);
            });
          }
        }
      } catch (error) {
        console.error('Failed to report security incident:', error);
      }
    },
    [
      id,
      stopCamera,
      setSecuritySettings,
      setCurrentIncidentCount,
      setExamSuspended,
      setSuspensionData,
    ]
  );

  // Make reportSecurityIncident a useCallback function to avoid re-creating it on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reportSecurityIncident = useCallback(
    (() => {
      // Debounce mechanism to prevent multiple calls in quick succession
      let lastReportTime = 0;
      let lastReportType = '';
      const DEBOUNCE_TIME = 1000; // 1 second debounce

      return async (type: string, details: string): Promise<void> => {
        const now = Date.now();

        // Skip if the same incident type was reported within the debounce time
        if (type === lastReportType && now - lastReportTime < DEBOUNCE_TIME) {
          console.log(`Debounced security incident: ${type} - ${details}`);
          return;
        }

        // Update timestamp and type for the debounce check
        lastReportTime = now;
        lastReportType = type;

        // Use the handleSecurityIncident method
        handleSecurityIncident(type, details);
      };
    })(),
    [handleSecurityIncident] // Add handleSecurityIncident as a dependency
  );

  // Then, define the handleFullscreenChange function
  const handleFullscreenChange = useCallback(() => {
    const isFullscreen = !!document.fullscreenElement;
    setFullscreenActive(isFullscreen);

    // If exiting fullscreen during exam, report incident and stop camera
    if (!isFullscreen && examStarted && !examSubmitted) {
      // Report the incident to the server
      reportSecurityIncident('EXIT_FULLSCREEN', 'Student exited fullscreen mode');

      setSecurityWarning({
        visible: true,
        message:
          'Warning: You exited fullscreen mode. Please return to fullscreen to continue your exam.',
      });

      // Stop camera when exiting fullscreen
      stopCamera();
    }
  }, [
    examStarted,
    examSubmitted,
    setFullscreenActive,
    setSecurityWarning,
    stopCamera,
    reportSecurityIncident,
  ]);

  // Modify the useEffect that adds event listeners for security monitoring
  useEffect(() => {
    if (examStarted && !examSubmitted && id) {
      // Handle page visibility changes (tab switching)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // Report the incident to the server
          reportSecurityIncident(
            'TAB_SWITCH',
            'Student switched to another tab or minimized the browser window'
          );

          // Show warning message after a short delay (this helps avoid false positives)
          visibilityTimeoutRef.current = setTimeout(() => {
            setSecurityWarning({
              visible: true,
              message:
                'Warning: You left the exam tab. Repeated attempts to navigate away from the exam may result in automatic submission.',
            });
          }, 500);
        } else if (visibilityTimeoutRef.current) {
          // Clear the timeout when tab is back in focus
          clearTimeout(visibilityTimeoutRef.current);
        }
      };

      // Detect context menu (right click)
      const handleContextMenu = (e: MouseEvent) => {
        // Report the incident to the server
        reportSecurityIncident(
          'COPY_ATTEMPT',
          'Student attempted to open context menu (right-click)'
        );

        e.preventDefault();
        return false;
      };

      // Detect keyboard shortcuts for developer tools
      const handleKeyDown = (e: KeyboardEvent) => {
        // Detect F12, Ctrl+Shift+I, Ctrl+Shift+J
        if (
          e.key === 'F12' ||
          (e.ctrlKey &&
            e.shiftKey &&
            (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j'))
        ) {
          // Report the incident to the server
          reportSecurityIncident(
            'DEV_TOOLS_OPEN',
            `Student attempted to open developer tools using keyboard shortcut: ${
              e.key === 'F12' ? 'F12' : `Ctrl+Shift+${e.key}`
            }`
          );

          e.preventDefault();
          setSecurityWarning({
            visible: true,
            message:
              'Warning: Developer tools shortcut detected. Using developer tools during the exam is not allowed.',
          });
          return false;
        }

        // Detect Alt+Tab, Ctrl+Tab
        if ((e.altKey && e.key === 'Tab') || (e.ctrlKey && e.key === 'Tab')) {
          // Report the incident to the server
          reportSecurityIncident(
            'TAB_SWITCH',
            `Student attempted to switch tabs using keyboard shortcut: ${
              e.altKey ? 'Alt+Tab' : 'Ctrl+Tab'
            }`
          );

          setSecurityWarning({
            visible: true,
            message: 'Warning: Tab switching detected. Please stay on the exam tab.',
          });
        }
      };

      // Handle browser close/navigate away
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        // Report the incident to the server
        reportSecurityIncident(
          'BROWSER_CLOSE',
          'Student attempted to close the browser or navigate away from the exam'
        );

        e.preventDefault();
        e.returnValue = '';
        return '';
      };

      // Detect copy attempts
      const handleCopy = (e: ClipboardEvent) => {
        // Report the incident to the server
        reportSecurityIncident('COPY_ATTEMPT', `Student attempted to ${e.type} content`);

        e.preventDefault();
        return false;
      };

      // Add all event listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('cut', handleCopy);

      // Cleanup function
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('cut', handleCopy);

        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }

        // Stop camera tracks when cleaning up this effect
        if (!examSubmitted) {
          stopCamera();
        }
      };
    }
  }, [examStarted, examSubmitted, id, handleFullscreenChange, stopCamera, reportSecurityIncident]);

  // Fetch exam when component mounts
  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchExam(id));
    }

    // Cleanup when unmounting
    return () => {
      if (!examSubmitted) {
        // Don't reset if we're just viewing the result
        dispatch(resetExam());

        // Exit fullscreen if active
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error(`Error exiting fullscreen: ${err.message}`);
          });
        }
      }
    };
  }, [id, dispatch, examSubmitted]);

  // Add a new effect to handle question shuffling when exam is loaded
  useEffect(() => {
    if (currentExam && !examStarted && !examSubmitted && !hasShuffled.current) {
      // Create a deep copy of the exam
      const examCopy = JSON.parse(JSON.stringify(currentExam));

      // Shuffle questions using Fisher-Yates algorithm
      for (let i = examCopy.questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [examCopy.questions[i], examCopy.questions[j]] = [
          examCopy.questions[j],
          examCopy.questions[i],
        ];
      }

      // Shuffle options within each question
      examCopy.questions.forEach((question: any) => {
        for (let i = question.options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [question.options[i], question.options[j]] = [question.options[j], question.options[i]];
        }
      });

      // Update the exam with shuffled questions using the proper action
      dispatch(setExam(examCopy));

      // Mark that we've shuffled the exam
      hasShuffled.current = true;
    }
  }, [currentExam, examStarted, examSubmitted, dispatch]);

  // Reset the shuffle flag when the exam is submitted or component unmounts
  useEffect(() => {
    return () => {
      hasShuffled.current = false;
    };
  }, []);

  // Function to check exam suspension status
  const checkExamSuspension = useCallback(async () => {
    if (!id || examSubmitted) return;

    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(`/api/exams/suspension/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update security settings and incident count from response
      if (response.data.securitySettings) {
        setSecuritySettings(response.data.securitySettings);
      }
      if (response.data.incidentCount !== undefined) {
        setCurrentIncidentCount(response.data.incidentCount);
      }

      // If exam is suspended, update UI accordingly
      if (response.data.suspended) {
        const suspension = response.data.suspension;
        setExamSuspended(true);
        setSuspensionData({
          reason: suspension.reason,
          incidentCount: suspension.incidents.length,
          timestamp: suspension.suspensionTime,
        });

        // Stop camera when exam is suspended
        stopCamera();

        // Exit fullscreen if active
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error(`Error exiting fullscreen: ${err.message}`);
          });
        }

        // Show error message and redirect to dashboard after a short delay
        showError(`Exam suspended: ${suspension.reason}`);
        setTimeout(() => {
          // Replace the current history entry with dashboard
          router.replace('/student');
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to check exam suspension status:', error);
    }
  }, [id, examSubmitted, stopCamera, router, showError]);

  // Check for exam suspension on a timer
  useEffect(() => {
    if (id && examStarted && !examSubmitted) {
      checkExamSuspension();

      // Check for suspension every 10 seconds
      const suspensionCheckInterval = setInterval(checkExamSuspension, 10000);

      return () => {
        clearInterval(suspensionCheckInterval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, examStarted, examSubmitted]);

  // Start exam after confirming ready to start (modified to not request fullscreen immediately)
  useEffect(() => {
    if (currentExam && readyToStart && !examStarted && !examSubmitted) {
      dispatch(startExam());
      dispatch(loadSavedAnswers());

      // Request fullscreen mode as exam is starting now
      requestFullscreen();
    }
  }, [currentExam, readyToStart, examStarted, examSubmitted, dispatch]);

  // Request fullscreen function
  const requestFullscreen = () => {
    const elem = document.documentElement;

    try {
      if (elem.requestFullscreen) {
        elem
          .requestFullscreen()
          .then(() => setFullscreenActive(true))
          .catch(err => console.error(`Error requesting fullscreen: ${err.message}`));
      } else if ((elem as any).mozRequestFullScreen) {
        // Firefox
        (elem as any).mozRequestFullScreen();
        setFullscreenActive(true);
      } else if ((elem as any).webkitRequestFullscreen) {
        // Chrome, Safari, Opera
        (elem as any).webkitRequestFullscreen();
        setFullscreenActive(true);
      } else if ((elem as any).msRequestFullscreen) {
        // IE/Edge
        (elem as any).msRequestFullscreen();
        setFullscreenActive(true);
      }
    } catch (err: any) {
      console.error('Fullscreen request failed:', err);
      setSecurityWarning({
        visible: true,
        message:
          "Your browser doesn't support fullscreen mode or permission was denied. Please enable fullscreen for the best exam experience.",
      });
    }
  };

  // Get current question
  const currentQuestion = currentExam?.questions[currentQuestionIndex];

  // Check if the current question has been answered
  const currentAnswer = userAnswers.find(
    answer => answer.questionId === currentQuestion?._id
  )?.selectedOption;

  // Handle option selection
  const handleOptionSelect = (optionText: string) => {
    if (currentQuestion && !examSubmitted) {
      dispatch(
        answerQuestion({
          questionId: currentQuestion._id,
          selectedOption: optionText,
        })
      );
    }
  };

  // Handle timer expiration
  const handleTimeExpired = () => {
    if (!examSubmitted && id && typeof id === 'string' && currentExam && !isSubmittingRef.current) {
      // Set flag to prevent multiple submissions
      isSubmittingRef.current = true;

      // Define the submission function
      const submitAndShowResults = async () => {
        try {
          // Stop camera
          stopCamera();

          // Use the helper function to prepare answers
          const finalAnswers = prepareAnswersForSubmission(currentExam, userAnswers);

          console.log('Time expired - Submitting answers:', finalAnswers); // Debug log

          // Wait for the overlay to be visible for at least 2 seconds before submission
          await new Promise(resolve => {
            redirectTimeoutRef.current = setTimeout(resolve, 2000);
          });

          const resultAction = await dispatch(submitExam({ examId: id, answers: finalAnswers }));

          // Exit fullscreen mode
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
              console.error(`Error exiting fullscreen: ${err.message}`);
            });
          }

          // Check if submission was successful
          if (submitExam.fulfilled.match(resultAction)) {
            // Navigate to the results page
            const resultData = resultAction.payload as any;
            if (resultData && resultData._id) {
              // Show results instead of redirecting to dashboard
              setTimeout(() => {
                router.push(`/student/results/${resultData._id}`);
              }, 1000);
            }
          } else {
            // If there was an error, show it but still try to redirect to dashboard
            const errorMsg = resultAction.payload || 'Failed to submit exam';
            console.error('Submit error on time expiry:', errorMsg);
            setTimeout(() => {
              router.replace('/student');
            }, 3000);
          }
        } catch (error) {
          console.error('Failed to submit exam on time expiry:', error);
          // Redirect to dashboard after a delay if submission fails
          setTimeout(() => {
            router.replace('/student');
          }, 3000);
        } finally {
          // Clear the submission flag after a delay to prevent any race conditions
          submissionTimeoutRef.current = setTimeout(() => {
            isSubmittingRef.current = false;
          }, 5000);
        }
      };

      // First show the time's up flash notification
      setShowTimeUpFlash(true);

      // After a brief delay, hide the flash and show the submission overlay
      setTimeout(() => {
        setShowTimeUpFlash(false);

        // Then show the submission overlay
        setSubmissionOverlay({
          visible: true,
          message: "Time's Up!",
        });

        // Submit exam with current state and show results
        submitAndShowResults();
      }, 1500); // Show flash for 1.5 seconds
    }
  };

  // Clean up all timeouts when component unmounts or exam changes
  useEffect(() => {
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Handle manual exam submission
  const handleSubmitExam = async () => {
    // First check if all questions are answered
    if (!confirmSubmit) {
      // Check for unanswered questions
      const hasUnansweredQuestions = userAnswers.some(answer => !answer.selectedOption);

      if (hasUnansweredQuestions) {
        // Modified to show a confirmation dialog instead of blocking submission
        setSecurityWarning({
          visible: true,
          message:
            'Warning: You have unanswered questions. Are you sure you want to submit the exam? Click "Submit Exam" again to confirm.',
        });
        setConfirmSubmit(true);
        return;
      }

      setConfirmSubmit(true);
      return;
    }

    // Prevent submission if already submitting
    if (submitting || isSubmittingRef.current) {
      return;
    }

    try {
      setSubmitting(true);
      isSubmittingRef.current = true;

      // Show submission overlay
      setSubmissionOverlay({
        visible: true,
        message: 'Submitting Exam',
      });

      if (id && typeof id === 'string' && currentExam) {
        // Use the helper function to prepare answers
        const finalAnswers = prepareAnswersForSubmission(currentExam, userAnswers);

        console.log('Submitting answers:', finalAnswers); // Debug log

        const resultAction = await dispatch(submitExam({ examId: id, answers: finalAnswers }));

        // Check if submission was successful
        if (submitExam.fulfilled.match(resultAction)) {
          // Stop the camera
          stopCamera();

          // Exit fullscreen mode
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
              console.error(`Error exiting fullscreen: ${err.message}`);
            });
          }

          // Get the result ID and redirect to the dashboard
          const resultData = resultAction.payload as any;
          if (resultData && resultData._id) {
            // Keep the overlay visible during redirect
            setTimeout(() => {
              router.push(`/student/results/${resultData._id}`);
            }, 1000);
          }
        } else {
          // If there was an error, show it
          const errorMsg = resultAction.payload || 'Failed to submit exam';
          console.error('Submit error:', errorMsg);

          // Hide submission overlay
          setSubmissionOverlay({
            visible: false,
            message: '',
          });

          setSecurityWarning({
            visible: true,
            message: `Error: ${errorMsg}. Please try again.`,
          });

          // Reset flags to allow retry
          isSubmittingRef.current = false;
        }
      }
    } catch (error) {
      console.error('Failed to submit exam:', error);

      // Hide submission overlay
      setSubmissionOverlay({
        visible: false,
        message: '',
      });

      setSecurityWarning({
        visible: true,
        message: 'Error submitting exam. Please try again.',
      });

      // Reset flags to allow retry
      isSubmittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  // Handle closing security warning
  const handleCloseWarning = () => {
    setSecurityWarning({ visible: false, message: '' });

    // If not in fullscreen mode and exam has started, request it again
    if (!document.fullscreenElement && examStarted) {
      requestFullscreen();
    }
  };

  // Modify the handleSystemCheckComplete to include camera sound
  const handleSystemCheckComplete = (success: boolean, stream?: MediaStream) => {
    if (success && stream) {
      setSystemCheckComplete(true);
      setMediaStream(stream);
      // Play camera sound when exam starts
      // playCameraSound();
    } else {
      setSystemCheckComplete(false);
    }
  };

  // New function to handle starting the exam after system checks pass
  const handleStartExam = () => {
    setReadyToStart(true);
  };

  // Add a function to check if the camera is active
  const checkCameraActive = useCallback(() => {
    if (!mediaStream) {
      return false;
    }

    // Check if camera tracks exist and are active
    const videoTracks = mediaStream.getVideoTracks();
    const isActive =
      videoTracks.length > 0 &&
      videoTracks.some(track => track.enabled && track.readyState === 'live');

    // Update state and last check time
    setIsCameraActive(isActive);

    return isActive;
  }, [mediaStream, setIsCameraActive]);

  // Start camera monitoring as soon as system check completes
  useEffect(() => {
    if (systemCheckComplete && mediaStream) {
      // Start periodic camera monitoring even before exam starts,
      // as long as system check is complete
      if (!cameraCheckIntervalRef.current) {
        console.log('Starting camera monitoring after system check');

        // Do initial check
        checkCameraActive();

        // Set up periodic camera checking
        cameraCheckIntervalRef.current = setInterval(() => {
          const isActive = checkCameraActive();

          // Only report incidents after exam has started
          if (!isActive && isCameraActive && examStarted && !examSubmitted) {
            console.warn('Camera has become inactive during the exam');
            reportSecurityIncident(
              'CAMERA_INACTIVE',
              "Student's camera has become inactive during the exam"
            );
          }
        }, 5000); // Check every 5 seconds
      }
    }

    return () => {
      if (cameraCheckIntervalRef.current) {
        clearInterval(cameraCheckIntervalRef.current);
        cameraCheckIntervalRef.current = null;
      }
    };
  }, [
    systemCheckComplete,
    mediaStream,
    checkCameraActive,
    isCameraActive,
    examStarted,
    examSubmitted,
    reportSecurityIncident,
  ]);

  // Update CameraStatusIndicator
  const CameraStatusIndicator = () => {
    if (!examStarted || examSubmitted) return null;

    return (
      <div
        className={`fixed bottom-[200px] right-4 z-[9998] p-2 rounded-lg ${
          isCameraActive ? 'bg-green-100' : 'bg-red-100'
        }`}
      >
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isCameraActive ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <span className="text-xs font-medium">
            {isCameraActive ? 'Camera Active' : 'Camera Inactive'}
          </span>
        </div>
      </div>
    );
  };

  // Enhanced screenshot detection
  useEffect(() => {
    if (examStarted && !examSubmitted && id) {
      // Function to detect screenshot attempts
      const detectScreenshot = () => {
        let lastVisibilityChange = Date.now();
        let lastClipboardChange = Date.now();
        let lastDOMChange = Date.now();
        let screenshotAttempts = 0;
        let initialChangesIgnored = false;
        let initialChangeTimeout: NodeJS.Timeout;

        // Monitor DOM changes that might indicate screenshot attempts
        const observer = new MutationObserver(mutations => {
          const now = Date.now();

          // Ignore initial changes for the first 5 seconds after exam start
          if (!initialChangesIgnored) {
            initialChangeTimeout = setTimeout(() => {
              initialChangesIgnored = true;
            }, 5000);
            return;
          }

          // Only report if significant time has passed since last change
          if (now - lastDOMChange > 1000) {
            lastDOMChange = now;

            // Check if the changes are suspicious (e.g., large number of changes at once)
            if (mutations.length > 10) {
              reportSecurityIncident(
                'SCREENSHOT_ATTEMPT',
                'Multiple DOM changes detected (possible screenshot attempt)'
              );
              setSecurityWarning({
                visible: true,
                message:
                  'Warning: Suspicious activity detected. This will be reported as a security violation.',
              });
            }
          }
        });

        // Start observing the document with more specific options
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: false, // Don't monitor attribute changes
          characterData: false, // Don't monitor text changes
        });

        // Monitor page visibility changes
        const handleVisibilityChange = () => {
          const now = Date.now();
          // Only report if the page was hidden for more than 1 second
          if (document.visibilityState === 'hidden' && now - lastVisibilityChange > 1000) {
            lastVisibilityChange = now;
            reportSecurityIncident(
              'SCREENSHOT_ATTEMPT',
              'Page visibility changed (possible screenshot attempt)'
            );
            setSecurityWarning({
              visible: true,
              message:
                'Warning: Page visibility change detected. This will be reported as a security violation.',
            });
          }
        };

        // Monitor clipboard changes
        const handleClipboardChange = async () => {
          const now = Date.now();
          // Only check clipboard if significant time has passed
          if (now - lastClipboardChange > 1000) {
            lastClipboardChange = now;
            try {
              const clipboardItems = await navigator.clipboard.read();
              if (clipboardItems.length > 0) {
                reportSecurityIncident(
                  'SCREENSHOT_ATTEMPT',
                  'Clipboard content changed (possible screenshot attempt)'
                );
                setSecurityWarning({
                  visible: true,
                  message:
                    'Warning: Clipboard activity detected. This will be reported as a security violation.',
                });
              }
            } catch (error) {
              // Only report clipboard access attempts if they're suspicious
              if (error instanceof Error && error.message.includes('permission')) {
                reportSecurityIncident(
                  'SCREENSHOT_ATTEMPT',
                  'Clipboard access attempted (possible screenshot attempt)'
                );
                setSecurityWarning({
                  visible: true,
                  message:
                    'Warning: Clipboard access detected. This will be reported as a security violation.',
                });
              }
            }
          }
        };

        // Enhanced keyboard shortcut detection
        const handleKeyDown = (e: KeyboardEvent) => {
          // Check for screenshot shortcuts across different OS and browsers
          const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
          const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
          const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;

          // Common screenshot shortcuts
          const isScreenshotShortcut =
            // PrintScreen key
            e.key === 'PrintScreen' ||
            e.key === 'Snapshot' ||
            // Mac shortcuts
            (isMac && e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
            // Windows shortcuts
            (isWindows && e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) ||
            // Linux shortcuts
            (isLinux && e.key === 'PrintScreen') ||
            // Browser-specific shortcuts
            (e.key === 's' && e.ctrlKey) || // Save
            (e.key === 'p' && e.ctrlKey) || // Print
            (e.key === 'c' && e.ctrlKey) || // Copy
            (e.key === 'v' && e.ctrlKey) || // Paste
            (e.key === 'x' && e.ctrlKey) || // Cut
            (e.key === 'a' && e.ctrlKey); // Select All

          if (isScreenshotShortcut) {
            screenshotAttempts++;
            reportSecurityIncident(
              'SCREENSHOT_ATTEMPT',
              `Screenshot shortcut detected (${e.key}) - Attempt ${screenshotAttempts}`
            );
            setSecurityWarning({
              visible: true,
              message: `Warning: Screenshot attempt detected (${screenshotAttempts}). This will be reported as a security violation.`,
            });
            e.preventDefault();
            return false;
          }
        };

        // Prevent context menu and right-click
        const handleContextMenu = (e: MouseEvent) => {
          reportSecurityIncident('SCREENSHOT_ATTEMPT', 'Context menu access attempted');
          setSecurityWarning({
            visible: true,
            message:
              'Warning: Context menu access detected. This will be reported as a security violation.',
          });
          e.preventDefault();
          return false;
        };

        // Prevent drag and drop
        const handleDragStart = (e: DragEvent) => {
          reportSecurityIncident('SCREENSHOT_ATTEMPT', 'Drag operation attempted');
          setSecurityWarning({
            visible: true,
            message:
              'Warning: Drag operation detected. This will be reported as a security violation.',
          });
          e.preventDefault();
          return false;
        };

        // Add all event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('dragstart', handleDragStart);
        document.addEventListener('paste', handleClipboardChange);
        document.addEventListener('copy', handleClipboardChange);
        document.addEventListener('cut', handleClipboardChange);

        // Cleanup function
        return () => {
          if (initialChangeTimeout) {
            clearTimeout(initialChangeTimeout);
          }
          observer.disconnect();
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('contextmenu', handleContextMenu);
          document.removeEventListener('dragstart', handleDragStart);
          document.removeEventListener('paste', handleClipboardChange);
          document.removeEventListener('copy', handleClipboardChange);
          document.removeEventListener('cut', handleClipboardChange);
        };
      };

      // Start screenshot detection
      const cleanup = detectScreenshot();

      // Cleanup when component unmounts or exam ends
      return () => {
        cleanup();
      };
    }
  }, [examStarted, examSubmitted, id, reportSecurityIncident, setSecurityWarning]);

  // Add keyframe animation for wiggle effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes wiggle {
        0%, 100% { transform: rotate(-3deg); }
        50% { transform: rotate(3deg); }
      }
      @keyframes flash {
        0%, 100% { opacity: 0; }
        20%, 80% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add useEffect for periodic mobile tracking indicator
  useEffect(() => {
    if (examStarted && !examSubmitted) {
      // Show initially for 5 seconds and play sound
      setShowMobileTracking(true);
      playCameraSound();

      const initialHideTimeout = setTimeout(() => {
        setShowMobileTracking(false);
      }, 5000);

      // Set up 1-minute interval
      const interval = setInterval(
        () => {
          setShowMobileTracking(true);
          playCameraSound(); // Play sound when showing
          // Hide after 5 seconds
          setTimeout(() => {
            setShowMobileTracking(false);
          }, 5000);
        },
        15 * 60 * 1000
      ); // 1 minute in milliseconds

      // Cleanup function
      return () => {
        clearInterval(interval);
        clearTimeout(initialHideTimeout);
        setShowMobileTracking(false);
      };
    }
  }, [examStarted, examSubmitted]);

  // Add a function to track the exam session
  const trackExamSession = async (action: 'start' | 'heartbeat' | 'end') => {
    try {
      if (!id) return;

      const token = localStorage.getItem('token');
      const deviceInfo = navigator.userAgent;

      const response = await axios.post(
        '/api/exams/session/track',
        {
          examId: id,
          action,
          browserInfo: window.navigator.userAgent,
          deviceInfo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (action === 'start' && response.data.success) {
        setSessionTrackingId(response.data.session.id);
      }
    } catch (error) {
      console.error('Error tracking exam session:', error);
      // Don't show error to user, just log it
    }
  };

  // Add heartbeat tracking for active sessions
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    // If exam has started but not submitted, send heartbeats
    if (examStarted && !examSubmitted) {
      // Track exam start
      trackExamSession('start');

      // Set up heartbeat every 30 seconds
      heartbeatInterval = setInterval(() => {
        trackExamSession('heartbeat');
      }, 30000);
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [examStarted, examSubmitted, id]);

  // Track when exam ends (either submitted or component unmounts)
  useEffect(() => {
    if (examSubmitted) {
      trackExamSession('end');
    }

    return () => {
      // If component unmounts and exam was started but not submitted,
      // mark the session as ended
      if (examStarted && !examSubmitted) {
        trackExamSession('end');
      }
    };
  }, [examSubmitted]);

  // Before rendering the exam content, show the system check
  if (!systemCheckComplete) {
    return (
      <ProtectedRoute requiredRole="student">
        <Layout title="System Check">
          <ExamSystemCheck
            onComplete={(success, stream) => handleSystemCheckComplete(success, stream)}
          />
        </Layout>
      </ProtectedRoute>
    );
  }

  // Show the pre-exam instructions and start button after system check completes but before exam starts
  if (systemCheckComplete && !readyToStart) {
    return (
      <ProtectedRoute requiredRole="student">
        <Layout title="Ready to Begin Exam">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
              <h1 className="text-2xl font-bold mb-6">Secure Exam Environment</h1>

              <div className="mb-6 bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h2 className="text-xl font-semibold mb-4">System Check Completed Successfully</h2>
                <div className="flex items-center mb-4 text-green-600">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>Your system meets all requirements for taking this exam</span>
                </div>

                <p className="mb-4">The following will happen when you start the exam:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>
                    Your browser will enter <strong>fullscreen mode</strong>
                  </li>
                  <li>Your camera will continue to monitor the exam environment</li>
                  <li>The timer will start immediately</li>
                  <li>Security monitoring will be active throughout the exam</li>
                </ul>

                <p className="font-medium text-blue-700">
                  Note: Your camera video feed will appear in the corner of the screen during the
                  exam.
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Important Rules</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li className="text-red-600 font-semibold">
                    You must remain in fullscreen mode the entire time
                  </li>
                  <li className="text-red-600 font-semibold">
                    Switching tabs or windows is not allowed
                  </li>
                  <li className="text-red-600 font-semibold">Copying exam content is prohibited</li>
                  <li>Your face must remain visible to the camera</li>
                  <li>No other people should be visible in your webcam</li>
                  <li>No reference materials are allowed unless specified</li>
                </ul>
              </div>

              <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <p className="text-yellow-800">
                  <strong>Warning:</strong> Security violations may result in automatic suspension
                  of your exam. All security incidents are logged and reported to administrators.
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  onClick={handleStartExam}
                  disabled={examSuspended}
                  className="px-8 py-3 text-lg"
                >
                  {examSuspended ? 'Exam Suspended' : 'Start Exam Now'}
                </Button>
              </div>
            </div>
          </div>

          {/* Camera preview to show it's still active */}
          <CameraPreview stream={mediaStream} />
        </Layout>
      </ProtectedRoute>
    );
  }

  // Render exam completion screen
  if (examSubmitted && result) {
    return (
      <ProtectedRoute requiredRole="student">
        <Layout title="Exam Completed">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h1 className="text-3xl font-bold mb-6">Exam Completed</h1>

              <div className={`p-6 rounded-lg mb-6 ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                <h2 className="text-2xl font-bold mb-2">
                  {result.passed ? 'Congratulations!' : 'Better luck next time!'}
                </h2>
                <p className="text-lg mb-4">
                  {result.passed
                    ? 'You have successfully passed the exam.'
                    : 'You did not meet the passing score for this exam.'}
                </p>

                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto text-left">
                  <div>
                    <h3 className="font-medium text-gray-500">Your Score</h3>
                    <p className="text-xl font-bold">
                      {result.score} / {result.totalQuestions}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Percentage</h3>
                    <p className="text-xl font-bold">{result.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/student/results/${(result as any)._id}`)}
                >
                  View Detailed Results
                </Button>

                <Button variant="primary" onClick={() => router.push('/student')}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="student">
      <Layout title={currentExam ? `Taking: ${currentExam.name}` : 'Taking Exam'}>
        {/* Add Time's Up Flash Notification */}
        <TimeUpFlash isVisible={showTimeUpFlash} />

        {/* Add Submission Overlay */}
        <SubmissionOverlay
          isVisible={submissionOverlay.visible}
          message={submissionOverlay.message}
        />

        {/* Add Mobile Tracking Indicator */}
        {showMobileTracking && examStarted && !examSubmitted && <MobileTrackingIndicator />}

        {/* Security Warning Modal */}
        <ExamSecurityWarning
          visible={securityWarning.visible}
          message={securityWarning.message}
          onClose={handleCloseWarning}
        />

        {/* Exam Suspension Alert - only show when exam is suspended */}
        <ExamSuspensionAlert
          visible={examSuspended}
          suspensionReason={suspensionData.reason}
          incidentCount={currentIncidentCount}
          timestamp={suspensionData.timestamp}
          securitySettings={securitySettings}
          isSuspended={examSuspended}
        />

        {!fullscreenActive && examStarted && !examSubmitted && (
          <div className="fixed bottom-4 right-4 z-40">
            <Button variant="primary" onClick={requestFullscreen}>
              Enter Fullscreen Mode
            </Button>
          </div>
        )}

        {/* Add camera warning if inactive */}
        {!isCameraActive && examStarted && !examSubmitted && (
          <div className="fixed top-4 left-0 right-0 mx-auto w-auto max-w-lg z-50">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    Your camera is not active. This is a security violation. Please enable your
                    camera immediately to continue with the exam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="exam-mode" ref={examContainerRef}>
          {loading && !currentExam ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error mb-4">{error}</div>
          ) : currentExam && currentQuestion ? (
            <div>
              {/* Exam Header */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
                <div>
                  <h1 className="text-xl font-bold">{currentExam.name}</h1>
                  <p className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {currentExam.questions.length}
                  </p>
                </div>

                {/* Timer */}
                <Timer duration={currentExam.duration} onTimeExpired={handleTimeExpired} />
              </div>

              {/* Question and Options */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="md:col-span-3">
                  {/* Question */}
                  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-lg font-bold mb-4">Question {currentQuestionIndex + 1}:</h2>
                    <p className="text-lg mb-6">{currentQuestion.text}</p>

                    {/* Options */}
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-md border cursor-pointer ${
                            currentAnswer === option.text
                              ? 'bg-primary-light bg-opacity-10 border-primary-color'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => handleOptionSelect(option.text)}
                        >
                          <div className="flex items-center">
                            <span className="mr-3">{String.fromCharCode(65 + index)}.</span>
                            <span>{option.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => dispatch(goToPreviousQuestion())}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>

                    {currentQuestionIndex < currentExam.questions.length - 1 ? (
                      <Button variant="primary" onClick={() => dispatch(goToNextQuestion())}>
                        Next
                      </Button>
                    ) : (
                      <Button
                        variant={confirmSubmit ? 'secondary' : 'primary'}
                        onClick={handleSubmitExam}
                        disabled={submitting}
                      >
                        {confirmSubmit
                          ? 'Confirm Submit'
                          : submitting
                            ? 'Submitting...'
                            : 'Submit Exam'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Question Navigation Panel */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="font-bold mb-3">Question Navigator</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentExam.questions.map((_, index) => {
                      const isAnswered = userAnswers.some(
                        answer =>
                          answer.questionId === currentExam.questions[index]._id &&
                          answer.selectedOption
                      );

                      return (
                        <button
                          key={index}
                          className={`h-10 w-[calc(20%-8px)] rounded-md flex items-center justify-center font-medium ${
                            index === currentQuestionIndex
                              ? 'bg-primary-color text-white'
                              : isAnswered
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 hover:bg-gray-200 transition-colors'
                          }`}
                          onClick={() => dispatch(goToQuestion(index))}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-primary-color rounded-sm"></div>
                      <span className="text-sm">Current Question</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 rounded-sm"></div>
                      <span className="text-sm">Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 rounded-sm"></div>
                      <span className="text-sm">Unanswered</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      variant="secondary"
                      onClick={handleSubmitExam}
                      disabled={submitting}
                      fullWidth
                    >
                      {confirmSubmit
                        ? 'Confirm Submit'
                        : submitting
                          ? 'Submitting...'
                          : 'Submit Exam'}
                    </Button>

                    {confirmSubmit && (
                      <p className="text-sm text-center mt-2 text-red-500">
                        Are you sure? Click again to confirm.
                      </p>
                    )}

                    {!confirmSubmit && (
                      <p className="text-xs text-center mt-2 text-gray-500">
                        You can submit even with unanswered questions.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* {currentExam && (
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">Exam Progress</h2>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      Question {currentQuestionIndex + 1} of {currentExam.questionsToDisplay}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-color h-2 rounded-full"
                        style={{
                          width: `${((currentQuestionIndex + 1) / currentExam.questionsToDisplay) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )} */}
            </div>
          ) : (
            <div className="text-center py-12">
              <p>No exam data found. Please return to the dashboard.</p>
              <Button variant="primary" onClick={() => router.push('/student')} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Camera status indicator */}
        <CameraStatusIndicator />

        {/* Add camera preview - ensure it's always shown during the exam */}
        {mediaStream && <CameraPreview stream={mediaStream} />}
      </Layout>
    </ProtectedRoute>
  );
};

export default TakeExamPage;
