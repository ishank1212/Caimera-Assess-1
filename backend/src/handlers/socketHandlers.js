/**
 * Socket.io Event Handlers
 *
 * Handles all WebSocket events for the Math Quiz application.
 * Integrates QuestionGenerator and StateManager for complete
 * concurrency control and question lifecycle management.
 */

const QuestionGenerator = require('../services/QuestionGenerator');
const StateManager = require('../services/StateManager');
const StateMachineLogger = require('../services/StateMachineLogger');

// Initialize services
const questionGenerator = new QuestionGenerator();
const stateManager = new StateManager();
const stateMachine = new StateMachineLogger();

// Question progression configuration
const WINNER_DISPLAY_DURATION = 3000; // 3 seconds to display winner
const DEFAULT_DIFFICULTY = 'medium';

// Track question timeout for automatic progression
let questionTimeout = null;

/**
 * Sets up all Socket.io event handlers
 * @param {Object} io - Socket.io server instance
 */
function setupSocketHandlers(io) {
  console.log('📡 Setting up Socket.io event handlers...');

  // Visualize the state machine on startup
  stateMachine.visualizeStateMachine();

  // Generate the first question when server starts
  generateNewQuestion(io);

  // Handle new connections
  io.on('connection', (socket) => {
    console.log(`[${new Date().toISOString()}] ✅ User connected: ${socket.id}`);

    // Send the current question to the newly connected user
    sendCurrentQuestionToUser(socket);

    // Handle answer submissions
    socket.on('submit-answer', (data) => {
      handleAnswerSubmission(socket, data, io);
    });

    // Handle disconnections
    socket.on('disconnect', () => {
      console.log(`[${new Date().toISOString()}] ❌ User disconnected: ${socket.id}`);
    });

    // Handle explicit request for current question
    socket.on('request-question', () => {
      sendCurrentQuestionToUser(socket);
    });
  });

  console.log('✅ Socket.io event handlers ready');
}

/**
 * Sends the current question to a specific user
 * @param {Object} socket - Socket.io socket instance
 */
function sendCurrentQuestionToUser(socket) {
  const currentQuestion = stateManager.getCurrentQuestion();

  if (currentQuestion) {
    socket.emit('current-question', {
      question: currentQuestion.question,
      questionId: currentQuestion.id,
      difficulty: currentQuestion.difficulty,
      timestamp: Date.now()
    });

    console.log(`📤 Sent current question to ${socket.id}: ${currentQuestion.question}`);
  } else {
    socket.emit('waiting-for-question', {
      message: 'Waiting for next question...',
      timestamp: Date.now()
    });
  }
}

/**
 * Handles answer submission from a user
 * Implements race condition prevention and concurrency control
 *
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} data - Submission data { answer }
 * @param {Object} io - Socket.io server instance
 */
function handleAnswerSubmission(socket, data, io) {
  const { answer } = data;
  const socketId = socket.id;
  const timestamp = Date.now(); // Server timestamp (critical for fairness)

  console.log(`[${new Date(timestamp).toISOString()}] 📥 Submission from ${socketId}: ${answer}`);

  // Validate input
  if (answer === undefined || answer === null || answer === '') {
    socket.emit('submission-error', {
      error: 'Invalid answer',
      message: 'Answer cannot be empty',
      timestamp
    });
    return;
  }

  // Record the submission (handles double submission and lock checks)
  const recordResult = stateManager.recordSubmission(socketId, answer, timestamp);

  if (!recordResult.success) {
    // Submission rejected (already submitted, locked, or no question)
    socket.emit('submission-rejected', {
      reason: recordResult.reason,
      message: recordResult.message,
      timestamp
    });

    console.log(`❌ Submission rejected from ${socketId}: ${recordResult.reason}`);
    return;
  }

  // Validate the answer against the correct answer
  const currentQuestion = stateManager.getCurrentQuestion();
  const isCorrect = questionGenerator.validate(answer, currentQuestion.answer);

  console.log(`🔍 Answer validation for ${socketId}: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

  // Attempt to claim victory (atomic operation)
  const isWinner = stateManager.attemptWin(socketId, isCorrect);

  if (isWinner) {
    // 🎉 We have a winner!
    console.log(`🏆 WINNER: ${socketId} answered ${currentQuestion.question} = ${currentQuestion.answer}`);

    // Transition state machine: ACTIVE → LOCKED
    stateMachine.transition('LOCKED', {
      winnerId: socketId,
      question: currentQuestion.question,
      answer: currentQuestion.answer
    });

    // Get submission data for the winner
    const winnerSubmission = stateManager.getSubmission(socketId);

    // Broadcast winner to ALL connected clients
    io.emit('winner-declared', {
      winnerId: socketId,
      correctAnswer: currentQuestion.answer,
      question: currentQuestion.question,
      questionId: currentQuestion.id,
      submissionTime: winnerSubmission.timestamp,
      nextQuestionIn: WINNER_DISPLAY_DURATION,
      timestamp
    });

    // Send special acknowledgment to the winner
    socket.emit('you-won', {
      message: 'Congratulations! You got it right first!',
      correctAnswer: currentQuestion.answer,
      question: currentQuestion.question,
      timestamp
    });

    // Transition state machine: LOCKED → TRANSITIONING
    setTimeout(() => {
      stateMachine.transition('TRANSITIONING', {
        displayDuration: WINNER_DISPLAY_DURATION
      });
    }, 100);

    // Schedule the next question
    clearTimeout(questionTimeout);
    questionTimeout = setTimeout(() => {
      generateNewQuestion(io);
    }, WINNER_DISPLAY_DURATION);

  } else {
    // Wrong answer or too late
    if (isCorrect) {
      // Correct answer but someone else got it first
      socket.emit('submission-result', {
        correct: true,
        winner: false,
        message: 'Correct answer, but someone else got it first!',
        timestamp
      });

      console.log(`⏱️  ${socketId} had correct answer but was too late`);
    } else {
      // Incorrect answer
      socket.emit('submission-result', {
        correct: false,
        winner: false,
        message: 'Incorrect answer. Keep trying!',
        timestamp
      });

      console.log(`❌ ${socketId} submitted incorrect answer: ${answer}`);
    }
  }
}

/**
 * Generates a new question and broadcasts to all users
 * Resets all state for the new question
 *
 * @param {Object} io - Socket.io server instance
 * @param {String} difficulty - Question difficulty (easy, medium, hard)
 */
function generateNewQuestion(io, difficulty = DEFAULT_DIFFICULTY) {
  // Generate a new question
  const newQuestion = questionGenerator.generate(difficulty);

  // Update state manager with new question (resets all state)
  stateManager.setQuestion(newQuestion);

  // Transition state machine: TRANSITIONING/IDLE → ACTIVE
  stateMachine.transition('ACTIVE', {
    questionId: newQuestion.id,
    question: newQuestion.question,
    difficulty: newQuestion.difficulty
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🆕 NEW QUESTION GENERATED`);
  console.log(`${'='.repeat(60)}`);
  console.log(`❓ Question: ${newQuestion.question}`);
  console.log(`✅ Answer: ${newQuestion.answer}`);
  console.log(`📊 Difficulty: ${newQuestion.difficulty}`);
  console.log(`🆔 ID: ${newQuestion.id}`);
  console.log(`${'='.repeat(60)}\n`);

  // Broadcast the new question to ALL connected clients
  io.emit('new-question', {
    question: newQuestion.question,
    questionId: newQuestion.id,
    difficulty: newQuestion.difficulty,
    timestamp: Date.now()
  });
}

/**
 * Gets current quiz state (for debugging/monitoring)
 * @returns {Object} Current state
 */
function getQuizState() {
  return {
    stateManager: stateManager.getState(),
    stats: stateManager.getStats(),
    stateMachine: stateMachine.getStatistics(),
    currentDifficulty: DEFAULT_DIFFICULTY
  };
}

/**
 * Manually triggers a new question (for testing or admin control)
 * @param {Object} io - Socket.io server instance
 * @param {String} difficulty - Optional difficulty level
 */
function forceNewQuestion(io, difficulty) {
  console.log('🔄 Forcing new question generation...');
  clearTimeout(questionTimeout);
  generateNewQuestion(io, difficulty);
}

/**
 * Resets the entire quiz state (for testing)
 */
function resetQuiz() {
  console.log('🔄 Resetting quiz state...');
  clearTimeout(questionTimeout);
  stateManager.reset();
}

// Export handler setup function and utilities
module.exports = {
  setupSocketHandlers,
  generateNewQuestion,
  getQuizState,
  forceNewQuestion,
  resetQuiz,
  // Export instances for testing
  _questionGenerator: questionGenerator,
  _stateManager: stateManager,
  _stateMachine: stateMachine
};
