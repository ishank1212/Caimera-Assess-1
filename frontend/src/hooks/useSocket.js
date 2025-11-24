import { useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';

/**
 * useSocket - Custom React hook for managing WebSocket connection and quiz state
 *
 * This hook provides:
 * - Automatic connection on mount
 * - Connection state management
 * - Question state management
 * - Winner state management
 * - Answer submission functionality
 * - Status messages and error handling
 *
 * @returns {Object} Socket state and control functions
 */
export function useSocket() {
  // Connection state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // info, success, error, warning
  const [userCount, setUserCount] = useState(0);

  // Submission state
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  /**
   * Display a message to the user
   * @param {string} text - Message text
   * @param {string} type - Message type (info, success, error, warning)
   * @param {number} duration - Auto-clear duration in ms (0 = no auto-clear)
   */
  const showMessage = useCallback((text, type = 'info', duration = 5000) => {
    setMessage(text);
    setMessageType(type);

    if (duration > 0) {
      setTimeout(() => {
        setMessage('');
      }, duration);
    }
  }, []);

  /**
   * Clear the current message
   */
  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  /**
   * Submit an answer to the current question
   * @param {string|number} answer - The user's answer
   * @returns {boolean} Success status
   */
  const submitAnswer = useCallback((answer) => {
    if (!connected) {
      showMessage('Not connected to server. Please wait...', 'error');
      return false;
    }

    if (isSubmitting) {
      showMessage('Submission in progress...', 'warning');
      return false;
    }

    if (hasSubmitted) {
      showMessage('You have already submitted an answer', 'warning');
      return false;
    }

    if (!currentQuestion) {
      showMessage('No question available', 'warning');
      return false;
    }

    // Validate answer is not empty
    const trimmedAnswer = String(answer).trim();
    if (!trimmedAnswer) {
      showMessage('Please enter an answer', 'warning');
      return false;
    }

    // Set submitting state
    setIsSubmitting(true);

    const success = socketService.submitAnswer(trimmedAnswer);
    if (success) {
      setHasSubmitted(true);
      showMessage('Answer submitted! Waiting for results...', 'info', 0);
    } else {
      setIsSubmitting(false);
      showMessage('Failed to submit answer', 'error');
    }

    return success;
  }, [connected, isSubmitting, hasSubmitted, currentQuestion, showMessage]);

  /**
   * Request the current question from the server
   */
  const requestQuestion = useCallback(() => {
    if (connected) {
      socketService.requestCurrentQuestion();
    }
  }, [connected]);

  // Initialize WebSocket connection
  useEffect(() => {
    setConnecting(true);

    // Create stable references to avoid dependency issues
    const handleShowMessage = showMessage;
    const handleClearMessage = clearMessage;

    const eventHandlers = {
      // Connection lifecycle events
      onConnect: (socketId) => {
        setConnected(true);
        setConnecting(false);
        setConnectionError(null);
        setReconnectAttempts(0);
        handleShowMessage('Connected to quiz server!', 'success', 3000);
      },

      onDisconnect: (reason) => {
        setConnected(false);
        setConnecting(true);

        // Phase 12: Clear stale data on disconnect
        setWinner(null);
        setIsWinner(false);
        setHasSubmitted(false);
        setIsSubmitting(false);

        handleShowMessage('Disconnected from server. Reconnecting...', 'warning', 0);
      },

      onConnectionError: (error, attempts) => {
        setConnectionError(error.message);
        setReconnectAttempts(attempts);
        handleShowMessage(`Connection error (attempt ${attempts})`, 'error', 0);
      },

      onReconnectAttempt: (attemptNumber) => {
        setReconnectAttempts(attemptNumber);
        handleShowMessage(`Reconnecting (attempt ${attemptNumber})...`, 'warning', 0);
      },

      onReconnect: (attemptNumber) => {
        setConnected(true);
        setConnecting(false);
        setConnectionError(null);
        setReconnectAttempts(0);

        // Phase 12: Request current question on reconnect to sync state
        socketService.requestCurrentQuestion();

        handleShowMessage('Reconnected to server!', 'success', 3000);
      },

      onReconnectFailed: () => {
        setConnecting(false);
        setConnectionError('Unable to connect to server');
        handleShowMessage('Failed to connect. Please refresh the page.', 'error', 0);
      },

      // Quiz events
      onNewQuestion: (data) => {
        setCurrentQuestion(data);
        setWinner(null);
        setIsWinner(false);
        setHasSubmitted(false);
        setIsSubmitting(false);
        handleClearMessage();
        handleShowMessage('New question!', 'info', 2000);
      },

      onCurrentQuestion: (data) => {
        if (data && data.question) {
          setCurrentQuestion(data);
          handleShowMessage('Loaded current question', 'info', 2000);
        }
      },

      onWinnerDeclared: (data) => {
        setIsSubmitting(false);
        setWinner(data);

        const socketId = socketService.getSocketId();
        if (data.winnerId === socketId) {
          setIsWinner(true);
          handleShowMessage('🎉 You won this round!', 'success', 0);
        } else {
          handleShowMessage(`Winner: ${data.winnerId}`, 'info', 0);
        }
      },

      onYouWon: (data) => {
        setIsWinner(true);
        handleShowMessage('🎉 Congratulations! You won!', 'success', 0);
      },

      onSubmissionResult: (data) => {
        setIsSubmitting(false);

        if (data.correct) {
          handleShowMessage('✅ Correct answer!', 'success', 0);
        } else {
          handleShowMessage(data.message || '❌ Incorrect answer. Try the next one!', 'error', 3000);
          // Allow resubmission for wrong answers (server handles duplicate prevention)
          setHasSubmitted(false);
        }
      },

      onSubmissionRejected: (data) => {
        setIsSubmitting(false);
        handleShowMessage(data.message || 'Submission rejected', 'warning', 3000);

        // If rejected due to already submitted or question locked, keep submitted state
        if (data.reason === 'already-submitted' || data.reason === 'question-locked') {
          setHasSubmitted(true);
        } else {
          setHasSubmitted(false);
        }
      },

      onSubmissionError: (data) => {
        setIsSubmitting(false);
        handleShowMessage(data.message || 'Error submitting answer', 'error', 3000);
        setHasSubmitted(false);
      },

      onUserCount: (count) => {
        setUserCount(count);
      }
    };

    // Connect to server
    socketService.connect(eventHandlers);

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount (showMessage and clearMessage are stable)

  return {
    // Connection state
    connected,
    connecting,
    connectionError,
    reconnectAttempts,

    // Quiz state
    currentQuestion,
    winner,
    isWinner,
    userCount,

    // Message state
    message,
    messageType,

    // Submission state
    hasSubmitted,
    isSubmitting,

    // Actions
    submitAnswer,
    requestQuestion,
    showMessage,
    clearMessage,

    // Utility
    socketId: socketService.getSocketId()
  };
}
