import React, { useState, useEffect } from 'react';

/**
 * QuestionDisplay Component
 * Displays the current math problem with beautiful styling and smooth transitions
 *
 * Phase 9: Real-time Question Display
 * - Smooth transitions when question changes
 */
function QuestionDisplay({ question, hasSubmitted, questionId }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousQuestion, setPreviousQuestion] = useState(null);

  // Handle question transitions
  useEffect(() => {
    if (question && question !== previousQuestion && previousQuestion !== null) {
      // Start transition
      setIsTransitioning(true);

      // End transition after animation
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);

      setPreviousQuestion(question);

      return () => {
        clearTimeout(transitionTimer);
      };
    } else if (question && previousQuestion === null) {
      setPreviousQuestion(question);
    }
  }, [question, previousQuestion]);

  return (
    <div className="relative bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 p-12">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-24 h-24 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white rounded-full"></div>
      </div>

      {/* Content */}
      <div className="relative text-center">
        <p className="text-white text-sm font-medium mb-3 tracking-wide uppercase opacity-90">
          Current Question
        </p>

        {question ? (
          <div
            key={questionId || question}
            className={`transition-all duration-500 ease-out ${
              isTransitioning
                ? 'animate-scaleIn'
                : 'opacity-100 scale-100'
            }`}
          >
            <h2 className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg tracking-tight">
              {question}
            </h2>

            {/* Question Mark Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>

            {/* Status Indicator */}
            {hasSubmitted && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Answer Submitted</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Loading State */}
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full backdrop-blur-sm">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-white text-xl font-medium">
                Waiting for question...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default QuestionDisplay;
