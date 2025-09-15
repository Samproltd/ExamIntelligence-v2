import React, { useEffect, useState, useRef } from 'react';

interface TimerProps {
  duration: number; // in minutes
  onTimeExpired: () => void;
  isActive?: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration = 0, onTimeExpired, isActive = true }) => {
  // Convert minutes to milliseconds and ensure it's a valid number
  const initialTimeRemaining = (isNaN(duration) ? 0 : duration) * 60 * 1000;
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  // Add a ref to track if the timer has already expired to prevent multiple callbacks
  const hasExpiredRef = useRef(false);
  // Add state to track final countdown for visual effects
  const [isFinalCountdown, setIsFinalCountdown] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Check if there's saved time in localStorage
    const startTime = localStorage.getItem('examStartTime');
    const examId = localStorage.getItem('currentExamId');

    if (startTime && examId) {
      const elapsedTime = Date.now() - parseInt(startTime);
      const remaining = initialTimeRemaining - elapsedTime;

      // If time has already expired
      if (remaining <= 0) {
        setTimeRemaining(0);
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onTimeExpired();
        }
        return;
      }

      // Check if we're in the final countdown (last 60 seconds)
      if (remaining <= 60000) {
        setIsFinalCountdown(true);
      }

      setTimeRemaining(remaining);
    } else {
      // Save start time and exam ID in localStorage
      localStorage.setItem('examStartTime', Date.now().toString());
      localStorage.setItem('currentExamId', Math.random().toString()); // This should be the actual exam ID
    }

    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        // Check if entering final countdown (last 60 seconds)
        if (prevTime <= 60000 && prevTime > 59000) {
          setIsFinalCountdown(true);
        }

        if (prevTime <= 1000) {
          clearInterval(timer);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onTimeExpired();
          }
          return 0;
        }
        return prevTime - 1000;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [duration, initialTimeRemaining, onTimeExpired, isActive]);

  // Format time as HH:MM:SS
  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const format = (val: number) => (val < 10 ? `0${val}` : val);

    return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
  };

  // Determine color class based on remaining time
  const getColorClass = () => {
    // Prevent division by zero or NaN values
    const divisor = initialTimeRemaining || 1; // Use 1 if initialTimeRemaining is 0 or NaN
    const percentageRemaining = (timeRemaining / divisor) * 100;

    if (isFinalCountdown) return 'text-red-600';
    if (percentageRemaining <= 10) return 'text-red-600';
    if (percentageRemaining <= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Add animation class for final countdown
  const getTimerClasses = () => {
    let classes = `text-2xl font-bold ${getColorClass()}`;

    if (isFinalCountdown) {
      classes += ' animate-pulse';
    }

    return classes;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-medium">
        {isFinalCountdown ? 'TIME ALMOST UP!' : 'Time Remaining'}
      </div>
      <div className={getTimerClasses()}>{formatTime(timeRemaining)}</div>
    </div>
  );
};

export default Timer;
