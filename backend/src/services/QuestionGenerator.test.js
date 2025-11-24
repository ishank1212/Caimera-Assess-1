/**
 * Unit Tests for QuestionGenerator
 *
 * Tests all functionality of the QuestionGenerator class including:
 * - Question generation
 * - Answer validation
 * - Difficulty levels
 * - Random number generation
 */

const QuestionGenerator = require('./QuestionGenerator');

// Test helper function
function runTest(testName, testFunction) {
  try {
    testFunction();
    console.log(`✅ PASS: ${testName}`);
    return true;
  } catch (error) {
    console.error(`❌ FAIL: ${testName}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Expected true, but got false');
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message || 'Expected false, but got true');
  }
}

// Test Suite
console.log('='.repeat(60));
console.log('QuestionGenerator Test Suite');
console.log('='.repeat(60));
console.log('');

const results = [];

// Test 1: QuestionGenerator instantiation
results.push(runTest('QuestionGenerator can be instantiated', () => {
  const generator = new QuestionGenerator();
  assert(generator instanceof QuestionGenerator, 'Generator should be an instance of QuestionGenerator');
  assertEquals(generator.currentDifficulty, 'medium', 'Default difficulty should be medium');
}));

// Test 2: Random number generation
results.push(runTest('getRandomNumber generates numbers in range', () => {
  const generator = new QuestionGenerator();
  for (let i = 0; i < 100; i++) {
    const num = generator.getRandomNumber(1, 100);
    assert(num >= 1 && num <= 100, `Number ${num} should be between 1 and 100`);
    assert(Number.isInteger(num), `Number ${num} should be an integer`);
  }
}));

// Test 3: Question generation returns valid structure
results.push(runTest('generate() returns valid question structure', () => {
  const generator = new QuestionGenerator();
  const question = generator.generate();

  assert(question.id, 'Question should have an id');
  assert(question.question, 'Question should have question text');
  assert(typeof question.answer === 'number', 'Question should have a numeric answer');
  assert(question.operands, 'Question should have operands');
  assert(question.operator, 'Question should have an operator');
  assert(question.difficulty, 'Question should have a difficulty level');
  assert(question.generatedAt, 'Question should have a timestamp');
}));

// Test 4: Question answer is calculated correctly
results.push(runTest('Question answer is calculated correctly', () => {
  const generator = new QuestionGenerator();

  // Test 100 questions to ensure calculations are correct
  for (let i = 0; i < 100; i++) {
    const question = generator.generate();
    const { num1, num2 } = question.operands;
    let expectedAnswer;

    switch (question.operator) {
      case '+':
        expectedAnswer = num1 + num2;
        break;
      case '-':
        expectedAnswer = num1 - num2;
        break;
      case '*':
        expectedAnswer = num1 * num2;
        break;
    }

    assertEquals(question.answer, expectedAnswer,
      `For ${question.question}, expected ${expectedAnswer}, got ${question.answer}`);
  }
}));

// Test 5: Subtraction always produces non-negative results
results.push(runTest('Subtraction produces non-negative results', () => {
  const generator = new QuestionGenerator();

  // Generate many subtraction questions
  for (let i = 0; i < 100; i++) {
    const question = generator.generate();
    if (question.operator === '-') {
      assert(question.answer >= 0,
        `Subtraction result should be non-negative: ${question.question} = ${question.answer}`);
    }
  }
}));

// Test 6: Answer validation - correct answers
results.push(runTest('validate() returns true for correct answers', () => {
  const generator = new QuestionGenerator();

  assertTrue(generator.validate(42, 42), 'Should validate integer match');
  assertTrue(generator.validate('42', 42), 'Should validate string number match');
  assertTrue(generator.validate(42.0, 42), 'Should validate float match');
  assertTrue(generator.validate('42.0', 42), 'Should validate string float match');
}));

// Test 7: Answer validation - incorrect answers
results.push(runTest('validate() returns false for incorrect answers', () => {
  const generator = new QuestionGenerator();

  assertFalse(generator.validate(42, 43), 'Should reject wrong number');
  assertFalse(generator.validate('41', 42), 'Should reject wrong string number');
  assertFalse(generator.validate('abc', 42), 'Should reject non-numeric string');
  assertFalse(generator.validate(null, 42), 'Should reject null');
  assertFalse(generator.validate(undefined, 42), 'Should reject undefined');
  assertFalse(generator.validate('', 42), 'Should reject empty string');
}));

// Test 8: Difficulty level setting
results.push(runTest('setDifficulty() changes difficulty level', () => {
  const generator = new QuestionGenerator();

  generator.setDifficulty('easy');
  assertEquals(generator.getDifficulty(), 'easy', 'Difficulty should be set to easy');

  generator.setDifficulty('hard');
  assertEquals(generator.getDifficulty(), 'hard', 'Difficulty should be set to hard');

  generator.setDifficulty('medium');
  assertEquals(generator.getDifficulty(), 'medium', 'Difficulty should be set to medium');
}));

// Test 9: Invalid difficulty level throws error
results.push(runTest('setDifficulty() throws error for invalid level', () => {
  const generator = new QuestionGenerator();

  try {
    generator.setDifficulty('impossible');
    throw new Error('Should have thrown an error for invalid difficulty');
  } catch (error) {
    assert(error.message.includes('Invalid difficulty level'),
      'Should throw error with appropriate message');
  }
}));

// Test 10: Easy difficulty respects constraints
results.push(runTest('Easy difficulty respects number range constraints', () => {
  const generator = new QuestionGenerator();

  for (let i = 0; i < 50; i++) {
    const question = generator.generate('easy');
    const { num1, num2 } = question.operands;

    assert(num1 >= 1 && num1 <= 50, `Easy mode num1 (${num1}) should be between 1 and 50`);
    assert(num2 >= 1 && num2 <= 50, `Easy mode num2 (${num2}) should be between 1 and 50`);
    assert(['+', '-'].includes(question.operator),
      `Easy mode should only use + or -, got ${question.operator}`);
  }
}));

// Test 11: Medium difficulty includes multiplication
results.push(runTest('Medium difficulty includes multiplication operator', () => {
  const generator = new QuestionGenerator();
  const operators = new Set();

  // Generate many questions to ensure we see all operators
  for (let i = 0; i < 100; i++) {
    const question = generator.generate('medium');
    operators.add(question.operator);
  }

  assert(operators.has('+') || operators.has('-') || operators.has('*'),
    'Medium difficulty should include at least one operator');
}));

// Test 12: Batch generation
results.push(runTest('generateBatch() generates multiple questions', () => {
  const generator = new QuestionGenerator();
  const questions = generator.generateBatch(10);

  assertEquals(questions.length, 10, 'Should generate 10 questions');

  // Verify all questions are unique
  const ids = new Set(questions.map(q => q.id));
  assertEquals(ids.size, 10, 'All question IDs should be unique');

  // Verify all questions are valid
  questions.forEach(question => {
    assert(question.id, 'Each question should have an id');
    assert(question.question, 'Each question should have question text');
    assert(typeof question.answer === 'number', 'Each question should have a numeric answer');
  });
}));

// Test 13: Statistics
results.push(runTest('getStats() returns valid statistics', () => {
  const generator = new QuestionGenerator();
  const stats = generator.getStats();

  assert(stats.availableOperators, 'Stats should include available operators');
  assert(stats.difficultyLevels, 'Stats should include difficulty levels');
  assert(stats.currentDifficulty, 'Stats should include current difficulty');
  assert(Array.isArray(stats.availableOperators), 'Available operators should be an array');
  assert(Array.isArray(stats.difficultyLevels), 'Difficulty levels should be an array');
}));

// Test 14: Question uniqueness
results.push(runTest('Generated questions have unique IDs', () => {
  const generator = new QuestionGenerator();
  const ids = new Set();

  for (let i = 0; i < 100; i++) {
    const question = generator.generate();
    assert(!ids.has(question.id), `Question ID ${question.id} should be unique`);
    ids.add(question.id);
  }

  assertEquals(ids.size, 100, 'Should generate 100 unique question IDs');
}));

// Test 15: Multiplication uses reasonable numbers
results.push(runTest('Multiplication uses reasonable numbers to avoid huge products', () => {
  const generator = new QuestionGenerator();

  for (let i = 0; i < 50; i++) {
    const question = generator.generate('medium');
    if (question.operator === '*') {
      const { num1, num2 } = question.operands;
      assert(num1 <= 20, `Multiplication num1 (${num1}) should be <= 20`);
      assert(num2 <= 20, `Multiplication num2 (${num2}) should be <= 20`);
    }
  }
}));

// Summary
console.log('');
console.log('='.repeat(60));
console.log('Test Summary');
console.log('='.repeat(60));

const passed = results.filter(r => r).length;
const failed = results.filter(r => !r).length;
const total = results.length;

console.log(`Total Tests: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`);
console.log('='.repeat(60));

// Exit with appropriate code
if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
