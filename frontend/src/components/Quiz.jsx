import React, { useState } from 'react';
import QuestionDisplay from './QuestionDisplay';
import AnswerInput from './AnswerInput';
import StatusMessage from './StatusMessage';
import WinnerAnnouncement from './WinnerAnnouncement';
import ConnectionStatus from './ConnectionStatus';
import { useQuiz } from '../context/QuizContext';

/**
 * Main Quiz Component
 * Manages the quiz UI and coordinates all subcomponents
 * Now integrated with Socket.io (Phase 8)
 */
function Quiz() {
  // Get quiz state from context (connected via Socket.io)
  const {
    connected,
    connecting,
    reconnectAttempts,
    currentQuestion,
    hasSubmitted,
    isSubmitting,
    winner,
    isWinner,
    statusMessage,
    submitAnswer,
    clearStatus,
    activeUsers
  } = useQuiz();

  // Local state for input field
  const [answer, setAnswer] = useState('');

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!answer.trim()) {
      return;
    }

    // Submit via Socket.io
    const success = submitAnswer(answer);

    // Clear input if submission successful
    if (success) {
      // Keep the answer visible for user reference
      // It will be cleared on next question
    }
  };

  // Handle answer input change
  const handleAnswerChange = (value) => {
    setAnswer(value);
    // Clear status when user starts typing again
    if (statusMessage.message && hasSubmitted) {
      clearStatus();
    }
  };

  // Clear answer input when new question arrives
  React.useEffect(() => {
    if (currentQuestion) {
      setAnswer('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.questionId]); // Only depend on questionId changing

  return (
    <div className="max-w-4xl mx-auto">
      {/* Connection Status */}
      <ConnectionStatus connected={connected} connecting={connecting} reconnectAttempts={reconnectAttempts} />

      {/* Main Quiz Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
        {/* Winner Announcement Overlay */}
        {winner && (
          <WinnerAnnouncement
            winner={{
              ...winner,
              isYou: isWinner
            }}
            onClose={clearStatus}
          />
        )}

        {/* Question Display */}
        <QuestionDisplay
          question={currentQuestion?.question || (connecting ? 'Connecting to server...' : 'Waiting for question...')}
          questionId={currentQuestion?.questionId}
          hasSubmitted={hasSubmitted}
        />

        {/* Answer Input Section */}
        <div className="p-8 bg-gray-50">
          <AnswerInput
            answer={answer}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            hasSubmitted={hasSubmitted}
            disabled={!connected || !currentQuestion || connecting}
          />

          {/* Status Message */}
          <StatusMessage status={statusMessage} />
        </div>

        {/* Footer Info */}
        <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>First correct answer wins!</span>
            </div>
            <div className="flex items-center gap-2">
              {activeUsers > 0 && (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{activeUsers} player{activeUsers !== 1 ? 's' : ''} online</span>
                </>
              )}
              {activeUsers === 0 && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Quiz</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Play</h3>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Solve the math problem as quickly as possible</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Enter your answer and click Submit (or press Enter)</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>First person with the correct answer wins the round!</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>New questions appear automatically after each round</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Quiz;
