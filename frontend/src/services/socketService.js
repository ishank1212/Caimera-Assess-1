import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * SocketService - Manages WebSocket connection to backend server
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event handler registration
 * - Connection state management
 * - Error handling and timeout management
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connectionAttempts = 0;
    this.maxReconnectionAttempts = 10;
  }

  /**
   * Connect to the backend WebSocket server
   * @param {Object} eventHandlers - Object containing event handler functions
   * @returns {Socket} The socket.io client instance
   */
  connect(eventHandlers = {}) {
    if (this.socket && this.connected) {
      return this.socket;
    }

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectionAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true
    });

    // Connection events
    this.socket.on('connect', () => {
      this.connected = true;
      this.connectionAttempts = 0;

      if (eventHandlers.onConnect) {
        eventHandlers.onConnect(this.socket.id);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;

      if (eventHandlers.onDisconnect) {
        eventHandlers.onDisconnect(reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.connectionAttempts++;

      if (eventHandlers.onConnectionError) {
        eventHandlers.onConnectionError(error, this.connectionAttempts);
      }

      // If max attempts reached, stop trying
      if (this.connectionAttempts >= this.maxReconnectionAttempts) {
        this.socket.disconnect();
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      if (eventHandlers.onReconnectAttempt) {
        eventHandlers.onReconnectAttempt(attemptNumber);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.connected = true;
      this.connectionAttempts = 0;

      if (eventHandlers.onReconnect) {
        eventHandlers.onReconnect(attemptNumber);
      }
    });

    this.socket.on('reconnect_failed', () => {
      if (eventHandlers.onReconnectFailed) {
        eventHandlers.onReconnectFailed();
      }
    });

    // Quiz-specific events
    if (eventHandlers.onNewQuestion) {
      this.socket.on('new-question', (data) => {
        eventHandlers.onNewQuestion(data);
      });
    }

    if (eventHandlers.onCurrentQuestion) {
      this.socket.on('current-question', (data) => {
        eventHandlers.onCurrentQuestion(data);
      });
    }

    if (eventHandlers.onWinnerDeclared) {
      this.socket.on('winner-declared', (data) => {
        eventHandlers.onWinnerDeclared(data);
      });
    }

    if (eventHandlers.onYouWon) {
      this.socket.on('you-won', (data) => {
        eventHandlers.onYouWon(data);
      });
    }

    if (eventHandlers.onSubmissionResult) {
      this.socket.on('submission-result', (data) => {
        eventHandlers.onSubmissionResult(data);
      });
    }

    if (eventHandlers.onSubmissionRejected) {
      this.socket.on('submission-rejected', (data) => {
        eventHandlers.onSubmissionRejected(data);
      });
    }

    if (eventHandlers.onSubmissionError) {
      this.socket.on('submission-error', (data) => {
        eventHandlers.onSubmissionError(data);
      });
    }

    if (eventHandlers.onUserCount) {
      this.socket.on('user-count', (count) => {
        eventHandlers.onUserCount(count);
      });
    }

    return this.socket;
  }

  /**
   * Submit an answer to the current question
   * @param {string|number} answer - The user's answer
   */
  submitAnswer(answer) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('submit-answer', { answer });
    return true;
  }

  /**
   * Request the current question from the server
   */
  requestCurrentQuestion() {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('request-question');
    return true;
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Check if currently connected to the server
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  /**
   * Get the current socket ID
   * @returns {string|null} Socket ID or null if not connected
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  /**
   * Get the socket instance
   * @returns {Socket|null} Socket instance or null
   */
  getSocket() {
    return this.socket;
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;
