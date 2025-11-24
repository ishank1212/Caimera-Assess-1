import React from 'react';

/**
 * AnswerInput Component
 * Input field and submit button for answer submission
 */
function AnswerInput({
  answer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  hasSubmitted,
  disabled
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex gap-3">
        {/* Input Field */}
        <div className="flex-1 relative">
          <input
            type="number"
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={disabled ? "Connecting..." : "Enter your answer..."}
            disabled={disabled || hasSubmitted}
            className={`
              w-full px-6 py-4 text-lg font-medium
              border-2 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-offset-2
              transition-all duration-200
              ${disabled || hasSubmitted
                ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
              }
            `}
            autoFocus={!disabled}
          />

          {/* Input Icon */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled || isSubmitting || hasSubmitted || !answer.trim()}
          className={`
            px-8 py-4 rounded-xl font-semibold text-lg
            transition-all duration-200 transform
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${disabled || isSubmitting || hasSubmitted || !answer.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-slate-700 to-gray-800 text-white hover:from-slate-800 hover:to-gray-900 hover:scale-105 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending...
            </span>
          ) : hasSubmitted ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submitted
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </div>

      {/* Keyboard Hint */}
      {!disabled && !hasSubmitted && (
        <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2">
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
            Enter
          </kbd>
          <span>to submit quickly</span>
        </p>
      )}
    </form>
  );
}

export default AnswerInput;
