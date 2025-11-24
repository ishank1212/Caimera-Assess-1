import React from 'react';
import Quiz from './components/Quiz';
import ErrorBoundary from './components/ErrorBoundary';
import { QuizProvider } from './context/QuizContext';
import './index.css';

/**
 * Main App Component
 * Sets up the quiz application with context providers and error boundary
 */
function App() {
  return (
    <ErrorBoundary>
      <QuizProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <header className="text-center mb-8 animate-fadeIn">
              <div className="inline-flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-700 via-gray-700 to-slate-800 bg-clip-text text-transparent">
                  Math Quiz Challenge
                </h1>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Compete with others in real-time! First to answer correctly wins.
              </p>
            </header>

            {/* Main Quiz */}
            <main>
              <Quiz />
            </main>

            {/* Footer */}
            <footer className="text-center mt-12 text-gray-500 text-sm">
              <p>Built with React, Socket.io, and TailwindCSS</p>
              <p className="mt-1">Real-time competitive math quiz platform</p>
            </footer>
          </div>
        </div>
      </QuizProvider>
    </ErrorBoundary>
  );
}

export default App;
