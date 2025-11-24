import React from 'react';

/**
 * ConnectionStatus Component
 * Displays real-time connection status to the server
 * Phase 12: Enhanced to show reconnection attempts
 */
function ConnectionStatus({ connected, connecting, reconnectAttempts }) {
  // Determine connection state and styling
  const isReconnecting = !connected && reconnectAttempts > 0;
  const isInitialConnection = !connected && reconnectAttempts === 0;

  const bgColor = connected
    ? 'bg-green-50 border-green-200'
    : isReconnecting
    ? 'bg-orange-50 border-orange-200'
    : 'bg-yellow-50 border-yellow-200';

  const dotColor = connected
    ? 'bg-green-500 animate-pulse'
    : isReconnecting
    ? 'bg-orange-500 animate-pulse'
    : 'bg-yellow-500';

  const textColor = connected
    ? 'text-green-700'
    : isReconnecting
    ? 'text-orange-700'
    : 'text-yellow-700';

  const iconColor = connected
    ? 'text-green-600'
    : isReconnecting
    ? 'border-orange-600'
    : 'border-yellow-600';

  // Determine status message
  const getStatusMessage = () => {
    if (connected) return 'Connected to Quiz Server';
    if (isReconnecting) return `Reconnecting... (Attempt ${reconnectAttempts})`;
    return 'Connecting to Server...';
  };

  return (
    <div className="mb-4">
      <div
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full
          transition-all duration-300 ${bgColor} border
        `}
      >
        {/* Status Indicator Dot */}
        <div className={`w-3 h-3 rounded-full ${dotColor}`} />

        {/* Status Text */}
        <span className={`text-sm font-medium ${textColor}`}>
          {getStatusMessage()}
        </span>

        {/* Connection Icon */}
        {connected ? (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className={`w-4 h-4 border-2 ${iconColor} border-t-transparent rounded-full animate-spin`} />
        )}
      </div>
    </div>
  );
}

export default ConnectionStatus;
