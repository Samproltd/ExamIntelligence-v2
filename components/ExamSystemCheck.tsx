import { useState, useEffect, useRef } from "react";
import Button from "./Button";

interface ExamSystemCheckProps {
  onComplete: (success: boolean, stream?: MediaStream) => void;
}

const ExamSystemCheck: React.FC<ExamSystemCheckProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<
    "unchecked" | "checking" | "success" | "error"
  >("unchecked");
  const [microphoneStatus, setMicrophoneStatus] = useState<
    "unchecked" | "checking" | "success" | "error"
  >("unchecked");
  const [browserStatus, setBrowserStatus] = useState<
    "unchecked" | "checking" | "success" | "error"
  >("unchecked");
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioLevelRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const checksCompletedRef = useRef(false);

  // Check if running on a desktop/laptop
  useEffect(() => {
    setBrowserStatus("checking");

    // Simple check based on user agent and screen size
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) && window.innerWidth < 768;

    if (isMobile) {
      setBrowserStatus("error");
      setErrorMessage(
        "Please use a laptop, desktop computer, or tablet to take this exam."
      );
    } else {
      setBrowserStatus("success");
    }
  }, []);

  // Check camera access
  const checkCamera = async () => {
    setCameraStatus("checking");
    try {
      // Stop any existing stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraStatus("success");
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraStatus("error");
      setErrorMessage(
        "Could not access camera. Please ensure camera permissions are enabled in your browser."
      );
    }
  };

  // Check microphone access
  const checkMicrophone = async () => {
    setMicrophoneStatus("checking");
    try {
      // Stop any existing stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          if (track.kind !== "video") {
            track.stop();
          }
        });
      }

      // Request microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Add audio tracks to existing stream
      if (mediaStreamRef.current) {
        audioStream.getAudioTracks().forEach((track) => {
          mediaStreamRef.current?.addTrack(track);
        });
      } else {
        mediaStreamRef.current = audioStream;
      }

      // Set up audio visualization
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(
        mediaStreamRef.current
      );
      source.connect(analyser);

      // Start visualizing audio
      visualizeAudio();

      setMicrophoneStatus("success");
    } catch (error) {
      console.error("Microphone access error:", error);
      setMicrophoneStatus("error");
      setErrorMessage(
        "Could not access microphone. Please ensure microphone permissions are enabled in your browser."
      );
    }
  };

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyserRef.current || !audioLevelRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      if (!analyserRef.current || !audioLevelRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const level = Math.min(100, average * 2); // Scale for better visualization

      audioLevelRef.current.style.width = `${level}%`;
      audioLevelRef.current.style.backgroundColor =
        level > 50 ? "#4CAF50" : level > 20 ? "#FFC107" : "#F44336";

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  };

  // Clean up resources
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current && !checksCompletedRef.current) {
        console.log("Cleanup: Stopping media tracks in ExamSystemCheck");
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Move to next step
  const nextStep = () => {
    const newStep = step + 1;
    setStep(newStep);

    if (newStep === 1) {
      checkCamera();
    } else if (newStep === 2) {
      checkMicrophone();
    } else if (newStep === 3) {
      // All checks completed
      const success =
        cameraStatus === "success" &&
        microphoneStatus === "success" &&
        browserStatus === "success";

      // Mark checks as completed successfully if all passed
      checksCompletedRef.current = success;

      // Pass the stream to parent component
      onComplete(success, mediaStreamRef.current);
    }
  };

  // Status indicator component
  const StatusIndicator = ({
    status,
  }: {
    status: "unchecked" | "checking" | "success" | "error";
  }) => {
    if (status === "unchecked") return null;

    if (status === "checking") {
      return (
        <div className="ml-2 animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
      );
    }

    if (status === "success") {
      return (
        <div className="ml-2 w-5 h-5 text-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="ml-2 w-5 h-5 text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Exam System Check</h2>

        {step === 0 && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                System Requirements
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li className="flex items-center">
                  Desktop/Laptop/Tablet Browser
                  <StatusIndicator status={browserStatus} />
                </li>
                <li>Working webcam</li>
                <li>Working microphone</li>
                <li>Stable internet connection</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Exam Rules</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>You must remain in fullscreen mode during the exam</li>
                <li>
                  Your face must be visible to the webcam throughout the exam
                </li>
                <li>No other people should be visible in your webcam</li>
                <li>Do not switch tabs or applications during the exam</li>
                <li>Do not copy exam content or use unauthorized materials</li>
              </ul>
            </div>

            {browserStatus === "error" ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={nextStep}
                disabled={browserStatus !== "success"}
                className="w-full"
              >
                Begin System Check
              </Button>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Camera Check</h3>
            <div className="mb-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                ></video>
              </div>

              <div className="mt-4">
                <p className="text-gray-700 mb-2">
                  Make sure your face is clearly visible in the camera view.
                </p>
                <div className="flex items-center">
                  <span>Camera Status:</span>
                  <span className="ml-2 font-medium">
                    {cameraStatus === "checking" && "Checking..."}
                    {cameraStatus === "success" && "Camera is working"}
                    {cameraStatus === "error" && "Camera access denied"}
                  </span>
                  <StatusIndicator status={cameraStatus} />
                </div>
              </div>

              {cameraStatus === "error" && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={nextStep}
                disabled={cameraStatus !== "success"}
              >
                Next: Microphone Check
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Microphone Check</h3>
            <div className="mb-6">
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-4">
                  Please speak into your microphone to test that it&apos;s
                  working.
                </p>
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    ref={audioLevelRef}
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center">
                  <span>Microphone Status:</span>
                  <span className="ml-2 font-medium">
                    {microphoneStatus === "checking" && "Checking..."}
                    {microphoneStatus === "success" && "Microphone is working"}
                    {microphoneStatus === "error" && "Microphone access denied"}
                  </span>
                  <StatusIndicator status={microphoneStatus} />
                </div>
              </div>

              {microphoneStatus === "error" && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={nextStep}
                disabled={microphoneStatus !== "success"}
              >
                Continue to Exam
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center mb-8">
            <svg
              className="w-16 h-16 mx-auto text-red-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-xl font-bold text-red-600 mb-2">
              System Check Failed
            </h3>
            <p className="mb-4">
              We couldn&apos;t access your camera or microphone, which are
              required for this exam.
            </p>
            <p className="text-center my-4">
              Make sure you&apos;re using a compatible browser and have granted
              the necessary permissions.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-700">
                  System Check Failed
                </h3>
                <div className="mt-2 text-sm text-red-600">
                  <p>We couldn&apos;t access your camera or microphone.</p>
                  <p>
                    Make sure you&apos;re using a compatible browser and have
                    granted permission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamSystemCheck;
