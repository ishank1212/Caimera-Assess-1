/**
 * StateManager - Concurrency Control for Math Quiz
 *
 * Manages the state of the current question and handles concurrent answer submissions
 * with race condition prevention using atomic lock mechanisms.
 *
 * Key Features:
 * - In-memory state management for current question
 * - Atomic lock mechanism for winner detection
 * - Submission tracking to prevent double submissions
 * - Timestamp-based submission ordering
 * - Race condition prevention using Node.js single-threaded nature
 *
 * @class StateManager
 */
class StateManager {
  constructor() {
    // Current question state
    this.currentQuestion = null;

    // Winner tracking
    this.currentWinner = null;

    // Atomic lock - prevents multiple winners
    this.isLocked = false;

    // Submission tracking - Map of socketId -> submission data
    this.submissions = new Map();

    // Submission order tracking - Array of timestamps for ordering
    this.submissionOrder = [];

    // Grace period for near-simultaneous submissions (in milliseconds)
    this.GRACE_PERIOD_MS = 100;
  }

  /**
   * Sets a new question and resets all state
   * @param {Object} question - Question object from QuestionGenerator
   */
  setQuestion(question) {
    this.currentQuestion = question;
    this.currentWinner = null;
    this.isLocked = false;
    this.submissions.clear();
    this.submissionOrder = [];
  }

  /**
   * Gets the current question
   * @returns {Object|null} Current question or null
   */
  getCurrentQuestion() {
    return this.currentQuestion;
  }

  /**
   * Checks if a user has already submitted an answer
   * @param {String} socketId - Socket ID of the user
   * @returns {Boolean} True if user has already submitted
   */
  hasSubmitted(socketId) {
    return this.submissions.has(socketId);
  }

  /**
   * Records a submission with timestamp
   * Prevents double submissions and submissions after lock
   *
   * @param {String} socketId - Socket ID of the user
   * @param {String|Number} answer - User's answer
   * @param {Number} timestamp - Server timestamp of submission
   * @returns {Object} Result object with success status and optional message
   */
  recordSubmission(socketId, answer, timestamp) {
    // Check if question is locked (already has a winner)
    if (this.isLocked) {
      return {
        success: false,
        reason: 'question-locked',
        message: 'This question already has a winner'
      };
    }

    // Check for double submission
    if (this.hasSubmitted(socketId)) {
      return {
        success: false,
        reason: 'already-submitted',
        message: 'You have already submitted an answer for this question'
      };
    }

    // Check if there's a current question
    if (!this.currentQuestion) {
      return {
        success: false,
        reason: 'no-question',
        message: 'No active question to answer'
      };
    }

    // Record the submission
    this.submissions.set(socketId, {
      answer,
      timestamp,
      timestampISO: new Date(timestamp).toISOString()
    });

    // Track submission order
    this.submissionOrder.push({
      socketId,
      timestamp
    });

    return {
      success: true,
      timestamp
    };
  }

  /**
   * Attempts to claim victory for a user
   * Uses atomic lock mechanism to prevent race conditions
   *
   * This is the CRITICAL SECTION for concurrency control.
   * Node.js single-threaded event loop ensures these operations
   * are atomic - no context switching during execution.
   *
   * @param {String} socketId - Socket ID of the user
   * @param {Boolean} isCorrect - Whether the answer is correct
   * @returns {Boolean} True if user won, false otherwise
   */
  attemptWin(socketId, isCorrect) {
    // ATOMIC OPERATION - Check lock status
    // Node.js event loop ensures no race condition here
    if (this.isLocked) {
      return false;
    }

    // If answer is correct, set lock immediately
    if (isCorrect) {
      this.isLocked = true; // LOCK acquired - atomic in same tick
      this.currentWinner = socketId;

      // Get submission data for winner
      const submissionData = this.submissions.get(socketId);

      return true;
    }

    return false;
  }

  /**
   * Gets the current winner
   * @returns {String|null} Socket ID of winner or null
   */
  getWinner() {
    return this.currentWinner;
  }

  /**
   * Checks if the question is locked (has a winner)
   * @returns {Boolean} True if locked
   */
  isQuestionLocked() {
    return this.isLocked;
  }

  /**
   * Gets all submissions sorted by timestamp
   * @returns {Array} Array of submission objects sorted by timestamp
   */
  getSubmissionsInOrder() {
    return this.submissionOrder
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(entry => ({
        socketId: entry.socketId,
        timestamp: entry.timestamp,
        ...this.submissions.get(entry.socketId)
      }));
  }

  /**
   * Checks for near-simultaneous submissions within grace period
   * This helps handle network latency fairness
   *
   * @returns {Array} Submissions within grace period of first submission
   */
  getGracePeriodSubmissions() {
    if (this.submissionOrder.length === 0) {
      return [];
    }

    const sorted = this.submissionOrder.sort((a, b) => a.timestamp - b.timestamp);
    const firstTimestamp = sorted[0].timestamp;
    const gracePeriodEnd = firstTimestamp + this.GRACE_PERIOD_MS;

    return sorted.filter(entry => entry.timestamp <= gracePeriodEnd);
  }

  /**
   * Gets the submission data for a specific user
   * @param {String} socketId - Socket ID of the user
   * @returns {Object|undefined} Submission data or undefined
   */
  getSubmission(socketId) {
    return this.submissions.get(socketId);
  }

  /**
   * Gets comprehensive state information for debugging
   * @returns {Object} Complete state snapshot
   */
  getState() {
    return {
      question: this.currentQuestion,
      winner: this.currentWinner,
      isLocked: this.isLocked,
      submissionCount: this.submissions.size,
      submissions: Array.from(this.submissions.entries()).map(([socketId, data]) => ({
        socketId,
        ...data
      })),
      gracePeriodMs: this.GRACE_PERIOD_MS
    };
  }

  /**
   * Gets statistics about the current question
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      totalSubmissions: this.submissions.size,
      hasWinner: this.currentWinner !== null,
      isLocked: this.isLocked,
      questionId: this.currentQuestion?.id || null,
      gracePeriodSubmissions: this.getGracePeriodSubmissions().length
    };
  }

  /**
   * Resets all state completely
   * Useful for testing or server restart scenarios
   */
  reset() {
    this.currentQuestion = null;
    this.currentWinner = null;
    this.isLocked = false;
    this.submissions.clear();
    this.submissionOrder = [];
  }

  /**
   * Sets the grace period duration
   * @param {Number} milliseconds - Grace period in milliseconds
   */
  setGracePeriod(milliseconds) {
    if (milliseconds < 0) {
      throw new Error('Grace period must be non-negative');
    }
    this.GRACE_PERIOD_MS = milliseconds;
  }

  /**
   * Gets the grace period duration
   * @returns {Number} Grace period in milliseconds
   */
  getGracePeriod() {
    return this.GRACE_PERIOD_MS;
  }
}

module.exports = StateManager;
