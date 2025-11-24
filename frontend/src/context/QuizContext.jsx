import React, { createContext, useContext } from 'react';
import { useSocket } from '../hooks/useSocket';

/**
 * QuizContext
 * Provides global state management for the quiz application
 * Integrated with Socket.io connection (Phase 8)
 */
const QuizContext = createContext(null);

/**
 * Custom hook to use QuizContext
 * Throws error if used outside of QuizProvider
 */
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

/**
 * QuizProvider Component
 * Wraps the application and provides quiz state to all components
 * Now integrated with Socket.io for real-time communication
 */
export function QuizProvider({ children }) {
  // Use the socket hook which provides all quiz state and functionality
  const socket = useSocket();

  // Context value - expose all socket hook values
  const value = {
    // Connection state
    connected: socket.connected,
    connecting: socket.connecting,
    connectionError: socket.connectionError,
    reconnectAttempts: socket.reconnectAttempts,
    socketId: socket.socketId,

    // Question state
    currentQuestion: socket.currentQuestion,
    questionId: socket.currentQuestion?.questionId,

    // Answer state
    hasSubmitted: socket.hasSubmitted,
    isSubmitting: socket.isSubmitting,

    // Winner state
    winner: socket.winner,
    isWinner: socket.isWinner,

    // Status message state
    statusMessage: {
      type: socket.messageType,
      message: socket.message
    },

    // User count
    activeUsers: socket.userCount,

    // Actions
    submitAnswer: socket.submitAnswer,
    requestQuestion: socket.requestQuestion,
    showMessage: socket.showMessage,
    clearStatus: socket.clearMessage,

    // Legacy compatibility
    setUserAnswer: () => {}, // No longer needed - submission is handled directly
    handleConnectionChange: () => {}, // Handled by socket hook
    handleNewQuestion: () => {}, // Handled by socket hook
    handleWinner: () => {}, // Handled by socket hook
    resetAnswerState: () => {}, // Handled by socket hook
    setStatusMessage: socket.showMessage
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
}

export default QuizContext;
