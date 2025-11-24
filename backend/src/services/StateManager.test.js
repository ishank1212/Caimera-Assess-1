/**
 * Unit Tests for StateManager
 *
 * Tests the concurrency control mechanism, atomic lock,
 * submission tracking, and race condition prevention.
 */

const StateManager = require('./StateManager');
const QuestionGenerator = require('./QuestionGenerator');

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected} but got ${actual}`
    );
  }
}

function test(description, testFunction) {
  try {
    testFunction();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Test Suite
console.log('\n🧪 Running StateManager Unit Tests\n');

// Test 1: Instantiation
test('StateManager can be instantiated', () => {
  const stateManager = new StateManager();
  assert(stateManager instanceof StateManager);
  assertEqual(stateManager.currentQuestion, null);
  assertEqual(stateManager.currentWinner, null);
  assertEqual(stateManager.isLocked, false);
  assert(stateManager.submissions instanceof Map);
});

// Test 2: Setting a question
test('setQuestion() properly initializes state', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  assertEqual(stateManager.getCurrentQuestion().id, question.id);
  assertEqual(stateManager.currentWinner, null);
  assertEqual(stateManager.isLocked, false);
  assertEqual(stateManager.submissions.size, 0);
});

// Test 3: Recording a submission
test('recordSubmission() records valid submission', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  const result = stateManager.recordSubmission('user-1', '42', Date.now());

  assertEqual(result.success, true);
  assert(stateManager.hasSubmitted('user-1'));
  assertEqual(stateManager.submissions.size, 1);
});

// Test 4: Preventing double submissions
test('recordSubmission() prevents double submissions', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  // First submission
  const result1 = stateManager.recordSubmission('user-1', '42', Date.now());
  assertEqual(result1.success, true);

  // Second submission from same user
  const result2 = stateManager.recordSubmission('user-1', '99', Date.now());
  assertEqual(result2.success, false);
  assertEqual(result2.reason, 'already-submitted');
});

// Test 5: Preventing submissions after lock
test('recordSubmission() prevents submissions after lock', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  // Lock the question
  stateManager.isLocked = true;

  // Try to submit
  const result = stateManager.recordSubmission('user-1', '42', Date.now());

  assertEqual(result.success, false);
  assertEqual(result.reason, 'question-locked');
});

// Test 6: Atomic winner detection
test('attemptWin() correctly identifies winner with correct answer', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);
  stateManager.recordSubmission('user-1', question.answer, Date.now());

  const isWinner = stateManager.attemptWin('user-1', true);

  assertEqual(isWinner, true);
  assertEqual(stateManager.getWinner(), 'user-1');
  assertEqual(stateManager.isQuestionLocked(), true);
});

// Test 7: Rejecting incorrect answers
test('attemptWin() rejects incorrect answer', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);
  stateManager.recordSubmission('user-1', '999', Date.now());

  const isWinner = stateManager.attemptWin('user-1', false);

  assertEqual(isWinner, false);
  assertEqual(stateManager.getWinner(), null);
  assertEqual(stateManager.isQuestionLocked(), false);
});

// Test 8: Preventing multiple winners (race condition test)
test('attemptWin() prevents multiple winners (atomic lock)', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  // Simulate two users submitting correct answers
  stateManager.recordSubmission('user-1', question.answer, Date.now());
  stateManager.recordSubmission('user-2', question.answer, Date.now() + 1);

  // First user wins
  const user1Wins = stateManager.attemptWin('user-1', true);
  assertEqual(user1Wins, true);

  // Second user cannot win (lock is set)
  const user2Wins = stateManager.attemptWin('user-2', true);
  assertEqual(user2Wins, false);

  // Only one winner
  assertEqual(stateManager.getWinner(), 'user-1');
});

// Test 9: Submission ordering
test('getSubmissionsInOrder() returns submissions in timestamp order', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  // Submit in random order
  const t1 = Date.now();
  stateManager.recordSubmission('user-3', '10', t1 + 30);
  stateManager.recordSubmission('user-1', '20', t1 + 10);
  stateManager.recordSubmission('user-2', '30', t1 + 20);

  const ordered = stateManager.getSubmissionsInOrder();

  assertEqual(ordered.length, 3);
  assertEqual(ordered[0].socketId, 'user-1'); // Earliest
  assertEqual(ordered[1].socketId, 'user-2');
  assertEqual(ordered[2].socketId, 'user-3'); // Latest
});

// Test 10: Grace period submissions
test('getGracePeriodSubmissions() returns submissions within grace period', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);
  stateManager.setGracePeriod(100); // 100ms grace period

  const t1 = Date.now();
  stateManager.recordSubmission('user-1', '10', t1);
  stateManager.recordSubmission('user-2', '20', t1 + 50); // Within grace
  stateManager.recordSubmission('user-3', '30', t1 + 150); // Outside grace

  const gracePeriodSubs = stateManager.getGracePeriodSubmissions();

  assertEqual(gracePeriodSubs.length, 2);
  assertEqual(gracePeriodSubs[0].socketId, 'user-1');
  assertEqual(gracePeriodSubs[1].socketId, 'user-2');
});

// Test 11: Getting submission data
test('getSubmission() returns correct submission data', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  const timestamp = Date.now();
  stateManager.recordSubmission('user-1', '42', timestamp);

  const submission = stateManager.getSubmission('user-1');

  assertEqual(submission.answer, '42');
  assertEqual(submission.timestamp, timestamp);
  assert(submission.timestampISO);
});

// Test 12: State retrieval
test('getState() returns comprehensive state snapshot', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);
  stateManager.recordSubmission('user-1', '42', Date.now());

  const state = stateManager.getState();

  assert(state.question);
  assertEqual(state.question.id, question.id);
  assertEqual(state.winner, null);
  assertEqual(state.isLocked, false);
  assertEqual(state.submissionCount, 1);
  assert(Array.isArray(state.submissions));
});

// Test 13: Statistics
test('getStats() returns accurate statistics', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);
  stateManager.recordSubmission('user-1', '42', Date.now());
  stateManager.recordSubmission('user-2', '99', Date.now());

  const stats = stateManager.getStats();

  assertEqual(stats.totalSubmissions, 2);
  assertEqual(stats.hasWinner, false);
  assertEqual(stats.isLocked, false);
  assertEqual(stats.questionId, question.id);
});

// Test 14: Reset functionality
test('reset() clears all state', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);
  stateManager.recordSubmission('user-1', '42', Date.now());
  stateManager.attemptWin('user-1', true);

  // Reset
  stateManager.reset();

  assertEqual(stateManager.currentQuestion, null);
  assertEqual(stateManager.currentWinner, null);
  assertEqual(stateManager.isLocked, false);
  assertEqual(stateManager.submissions.size, 0);
});

// Test 15: Grace period configuration
test('setGracePeriod() and getGracePeriod() work correctly', () => {
  const stateManager = new StateManager();

  assertEqual(stateManager.getGracePeriod(), 100); // Default

  stateManager.setGracePeriod(200);
  assertEqual(stateManager.getGracePeriod(), 200);
});

// Test 16: Error handling for invalid grace period
test('setGracePeriod() throws error for negative value', () => {
  const stateManager = new StateManager();

  try {
    stateManager.setGracePeriod(-100);
    throw new Error('Should have thrown an error');
  } catch (error) {
    assert(error.message.includes('non-negative'));
  }
});

// Test 17: Submission without active question
test('recordSubmission() fails when no active question', () => {
  const stateManager = new StateManager();

  const result = stateManager.recordSubmission('user-1', '42', Date.now());

  assertEqual(result.success, false);
  assertEqual(result.reason, 'no-question');
});

// Test 18: Concurrent submission simulation
test('Simulates race condition with multiple users', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  const t = Date.now();

  // Simulate 5 users submitting at nearly the same time
  const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
  const results = [];

  users.forEach((userId, index) => {
    stateManager.recordSubmission(userId, question.answer, t + index);
  });

  // All try to win
  users.forEach(userId => {
    const won = stateManager.attemptWin(userId, true);
    results.push({ userId, won });
  });

  // Count winners
  const winners = results.filter(r => r.won);

  assertEqual(winners.length, 1); // Only ONE winner
  assertEqual(winners[0].userId, 'user-1'); // First user wins
  assert(stateManager.isQuestionLocked());
});

// Test 19: hasSubmitted check
test('hasSubmitted() correctly identifies submitted users', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();
  const question = generator.generate();

  stateManager.setQuestion(question);

  assertEqual(stateManager.hasSubmitted('user-1'), false);

  stateManager.recordSubmission('user-1', '42', Date.now());

  assertEqual(stateManager.hasSubmitted('user-1'), true);
  assertEqual(stateManager.hasSubmitted('user-2'), false);
});

// Test 20: Complete workflow test
test('Complete workflow: question -> submissions -> winner -> reset', () => {
  const stateManager = new StateManager();
  const generator = new QuestionGenerator();

  // 1. Set question
  const question = generator.generate();
  stateManager.setQuestion(question);
  assert(stateManager.getCurrentQuestion());

  // 2. Multiple users submit
  stateManager.recordSubmission('user-1', '999', Date.now());
  stateManager.recordSubmission('user-2', question.answer.toString(), Date.now() + 10);
  stateManager.recordSubmission('user-3', '888', Date.now() + 20);

  // 3. First user (wrong answer) doesn't win
  const user1Wins = stateManager.attemptWin('user-1', false);
  assertEqual(user1Wins, false);

  // 4. Second user (correct answer) wins
  const user2Wins = stateManager.attemptWin('user-2', true);
  assertEqual(user2Wins, true);
  assertEqual(stateManager.getWinner(), 'user-2');

  // 5. Third user cannot win (locked)
  const user3Wins = stateManager.attemptWin('user-3', false);
  assertEqual(user3Wins, false);

  // 6. Get stats
  const stats = stateManager.getStats();
  assertEqual(stats.totalSubmissions, 3);
  assertEqual(stats.hasWinner, true);
  assertEqual(stats.isLocked, true);

  // 7. Reset for next question
  stateManager.reset();
  assertEqual(stateManager.currentQuestion, null);
  assertEqual(stateManager.submissions.size, 0);
});

// Print Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 Test Summary`);
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);
console.log(`🎯 Pass Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50) + '\n');

if (testsFailed === 0) {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review.\n');
  process.exit(1);
}
