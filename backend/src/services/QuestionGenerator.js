/**
 * QuestionGenerator - Math Question Generation Service
 *
 * Generates random arithmetic questions for the competitive math quiz.
 * Supports addition, subtraction, and multiplication operations with
 * configurable difficulty levels.
 *
 * @class QuestionGenerator
 */
class QuestionGenerator {
  constructor() {
    // Define available operators with their operations
    this.operators = [
      {
        symbol: '+',
        name: 'addition',
        operation: (a, b) => a + b,
        difficulty: 'easy'
      },
      {
        symbol: '-',
        name: 'subtraction',
        operation: (a, b) => a - b,
        difficulty: 'easy'
      },
      {
        symbol: '*',
        name: 'multiplication',
        operation: (a, b) => a * b,
        difficulty: 'medium'
      }
    ];

    // Difficulty level configurations
    this.difficultyLevels = {
      easy: {
        minNumber: 1,
        maxNumber: 50,
        operators: ['+', '-']
      },
      medium: {
        minNumber: 1,
        maxNumber: 100,
        operators: ['+', '-', '*']
      },
      hard: {
        minNumber: 10,
        maxNumber: 100,
        operators: ['+', '-', '*']
      }
    };

    this.currentDifficulty = 'medium'; // Default difficulty
  }

  /**
   * Generates a random number within the specified range
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random number between min and max
   */
  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Selects a random operator based on current difficulty level
   * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard')
   * @returns {object} Operator object with symbol and operation function
   */
  getRandomOperator(difficulty = this.currentDifficulty) {
    const config = this.difficultyLevels[difficulty];
    const availableOperators = this.operators.filter(op =>
      config.operators.includes(op.symbol)
    );

    const randomIndex = Math.floor(Math.random() * availableOperators.length);
    return availableOperators[randomIndex];
  }

  /**
   * Generates a random math question
   * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard')
   * @returns {object} Question object with id, question text, answer, and metadata
   */
  generate(difficulty = this.currentDifficulty) {
    const config = this.difficultyLevels[difficulty];

    // Generate random numbers based on difficulty
    let num1 = this.getRandomNumber(config.minNumber, config.maxNumber);
    let num2 = this.getRandomNumber(config.minNumber, config.maxNumber);

    // Select random operator
    const operator = this.getRandomOperator(difficulty);

    // For subtraction, ensure result is non-negative
    if (operator.symbol === '-' && num1 < num2) {
      [num1, num2] = [num2, num1]; // Swap to make num1 larger
    }

    // For multiplication, use smaller numbers to avoid very large products
    if (operator.symbol === '*') {
      num1 = this.getRandomNumber(config.minNumber, Math.min(config.maxNumber, 20));
      num2 = this.getRandomNumber(config.minNumber, Math.min(config.maxNumber, 20));
    }

    // Calculate the correct answer
    const answer = operator.operation(num1, num2);

    // Generate unique question ID
    const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: questionId,
      question: `${num1} ${operator.symbol} ${num2}`,
      answer: answer,
      operands: { num1, num2 },
      operator: operator.symbol,
      operatorName: operator.name,
      difficulty: difficulty,
      generatedAt: Date.now(),
      generatedAtISO: new Date().toISOString()
    };
  }

  /**
   * Validates a user's answer against the correct answer
   * @param {string|number} userAnswer - The answer submitted by the user
   * @param {number} correctAnswer - The correct answer to the question
   * @returns {boolean} True if the answer is correct, false otherwise
   */
  validate(userAnswer, correctAnswer) {
    // Handle null, undefined, or empty string
    if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
      return false;
    }

    // Parse the user answer to a number
    const parsedAnswer = Number(userAnswer);

    // Check if the parsed answer is a valid number
    if (isNaN(parsedAnswer)) {
      return false;
    }

    // Compare with correct answer (handle floating point precision)
    return Math.abs(parsedAnswer - correctAnswer) < 0.0001;
  }

  /**
   * Sets the default difficulty level for generated questions
   * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard')
   * @throws {Error} If difficulty level is invalid
   */
  setDifficulty(difficulty) {
    if (!this.difficultyLevels[difficulty]) {
      throw new Error(`Invalid difficulty level: ${difficulty}. Must be 'easy', 'medium', or 'hard'.`);
    }
    this.currentDifficulty = difficulty;
  }

  /**
   * Gets the current difficulty level
   * @returns {string} Current difficulty level
   */
  getDifficulty() {
    return this.currentDifficulty;
  }

  /**
   * Generates multiple questions at once
   * @param {number} count - Number of questions to generate
   * @param {string} difficulty - Difficulty level
   * @returns {Array} Array of question objects
   */
  generateBatch(count, difficulty = this.currentDifficulty) {
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push(this.generate(difficulty));
    }
    return questions;
  }

  /**
   * Gets statistics about the question generator
   * @returns {object} Statistics object
   */
  getStats() {
    return {
      availableOperators: this.operators.map(op => ({
        symbol: op.symbol,
        name: op.name,
        difficulty: op.difficulty
      })),
      difficultyLevels: Object.keys(this.difficultyLevels),
      currentDifficulty: this.currentDifficulty,
      difficultyConfigs: this.difficultyLevels
    };
  }
}

module.exports = QuestionGenerator;
