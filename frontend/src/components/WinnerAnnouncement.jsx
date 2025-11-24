import React, { useEffect } from 'react';

/**
 * WinnerAnnouncement Component
 * Displays winner announcement as an overlay
 */
function WinnerAnnouncement({ winner, onClose }) {
  useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const isCurrentUser = winner?.isYou;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scaleIn">
        {/* Celebration Icon */}
        <div className="flex justify-center mb-4">
          {isCurrentUser ? (
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-slate-500 to-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Winner Message */}
        <div className="text-center">
          <h3 className={`text-2xl font-bold mb-2 ${isCurrentUser ? 'text-yellow-600' : 'text-slate-700'}`}>
            {isCurrentUser ? '🎉 You Won! 🎉' : 'Round Complete!'}
          </h3>

          <p className="text-gray-600 mb-4">
            {isCurrentUser
              ? "Congratulations! You submitted the correct answer first!"
              : `${winner?.winnerId || 'Someone'} got the correct answer!`
            }
          </p>

          {/* Correct Answer */}
          {winner?.correctAnswer !== undefined && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Correct Answer</p>
              <p className="text-3xl font-bold text-gray-800">{winner.correctAnswer}</p>
            </div>
          )}

          {/* Next Question Countdown */}
          <p className="text-sm text-gray-500">
            Next question in {Math.ceil((winner?.nextQuestionIn || 3000) / 1000)} seconds...
          </p>
        </div>

        {/* Confetti Animation (for winners) */}
        {isCurrentUser && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WinnerAnnouncement;
