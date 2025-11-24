/**
 * StateMachineLogger - Visualization and Logging for Question Lifecycle
 *
 * Tracks and visualizes the state machine transitions for the quiz question lifecycle:
 * IDLE → ACTIVE → LOCKED → TRANSITIONING → IDLE (repeat)
 *
 * @class StateMachineLogger
 */
class StateMachineLogger {
  constructor() {
    this.currentState = 'IDLE';
    this.stateHistory = [];
    this.transitionCount = 0;

    // State definitions
    this.states = {
      IDLE: {
        name: 'IDLE',
        description: 'No active question',
        icon: '⏸️',
        color: '\x1b[90m' // Gray
      },
      ACTIVE: {
        name: 'ACTIVE',
        description: 'Question active, accepting submissions',
        icon: '🟢',
        color: '\x1b[32m' // Green
      },
      LOCKED: {
        name: 'LOCKED',
        description: 'Winner found, question locked',
        icon: '🔒',
        color: '\x1b[33m' // Yellow
      },
      TRANSITIONING: {
        name: 'TRANSITIONING',
        description: 'Showing winner, preparing next question',
        icon: '🔄',
        color: '\x1b[36m' // Cyan
      }
    };

    // Valid state transitions
    this.validTransitions = {
      IDLE: ['ACTIVE'],
      ACTIVE: ['LOCKED', 'IDLE'],
      LOCKED: ['TRANSITIONING'],
      TRANSITIONING: ['ACTIVE', 'IDLE']
    };
  }

  /**
   * Transitions to a new state
   * @param {String} newState - The new state to transition to
   * @param {Object} context - Additional context about the transition
   */
  transition(newState, context = {}) {
    const oldState = this.currentState;

    // Validate transition
    if (!this.validTransitions[oldState]?.includes(newState)) {
      console.warn(`⚠️  Invalid state transition: ${oldState} → ${newState}`);
    }

    // Record transition
    this.transitionCount++;
    const transition = {
      from: oldState,
      to: newState,
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      transitionNumber: this.transitionCount,
      context
    };

    this.stateHistory.push(transition);
    this.currentState = newState;

    // Log the transition
    this.logTransition(transition);
  }

  /**
   * Logs a state transition with visual formatting
   * @param {Object} transition - Transition object
   */
  logTransition(transition) {
    const fromState = this.states[transition.from];
    const toState = this.states[transition.to];
    const reset = '\x1b[0m';

    console.log('\n' + '─'.repeat(70));
    console.log(`${toState.icon} STATE TRANSITION #${transition.transitionNumber}`);
    console.log('─'.repeat(70));
    console.log(`${fromState.color}${fromState.name}${reset} → ${toState.color}${toState.name}${reset}`);
    console.log(`📝 ${toState.description}`);
    console.log(`⏰ ${transition.timestampISO}`);

    if (Object.keys(transition.context).length > 0) {
      console.log(`📊 Context:`, JSON.stringify(transition.context, null, 2));
    }

    console.log('─'.repeat(70) + '\n');
  }

  /**
   * Gets the current state
   * @returns {String} Current state name
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Gets the current state object with metadata
   * @returns {Object} State object
   */
  getCurrentStateObject() {
    return {
      ...this.states[this.currentState],
      name: this.currentState
    };
  }

  /**
   * Checks if the state machine is in a specific state
   * @param {String} state - State name to check
   * @returns {Boolean} True if in that state
   */
  isInState(state) {
    return this.currentState === state;
  }

  /**
   * Gets the complete state history
   * @returns {Array} Array of state transitions
   */
  getHistory() {
    return this.stateHistory;
  }

  /**
   * Gets statistics about state transitions
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const stateCounts = {};
    this.stateHistory.forEach(t => {
      stateCounts[t.to] = (stateCounts[t.to] || 0) + 1;
    });

    return {
      currentState: this.currentState,
      totalTransitions: this.transitionCount,
      stateVisitCounts: stateCounts,
      averageTimeInStates: this.calculateAverageTimeInStates(),
      lastTransition: this.stateHistory[this.stateHistory.length - 1]
    };
  }

  /**
   * Calculates average time spent in each state
   * @returns {Object} Average times per state in milliseconds
   */
  calculateAverageTimeInStates() {
    const stateTimes = {};
    const stateCounts = {};

    for (let i = 0; i < this.stateHistory.length - 1; i++) {
      const current = this.stateHistory[i];
      const next = this.stateHistory[i + 1];
      const duration = next.timestamp - current.timestamp;

      stateTimes[current.to] = (stateTimes[current.to] || 0) + duration;
      stateCounts[current.to] = (stateCounts[current.to] || 0) + 1;
    }

    const averages = {};
    Object.keys(stateTimes).forEach(state => {
      averages[state] = Math.round(stateTimes[state] / stateCounts[state]);
    });

    return averages;
  }

  /**
   * Visualizes the state machine flow
   */
  visualizeStateMachine() {
    const reset = '\x1b[0m';

    console.log('\n' + '═'.repeat(70));
    console.log('QUESTION LIFECYCLE STATE MACHINE');
    console.log('═'.repeat(70) + '\n');

    console.log('State Flow:');
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │                                                         │');
    console.log('  │  ⏸️  IDLE  ──────────────────────────────────────┐      │');
    console.log('  │    │                                              │      │');
    console.log('  │    │ New Question Generated                      │      │');
    console.log('  │    ▼                                              │      │');
    console.log('  │  🟢 ACTIVE (Accepting Submissions)                │      │');
    console.log('  │    │                                              │      │');
    console.log('  │    │ First Correct Answer                         │      │');
    console.log('  │    ▼                                              │      │');
    console.log('  │  🔒 LOCKED (Winner Determined)                    │      │');
    console.log('  │    │                                              │      │');
    console.log('  │    │ Display Winner (3s)                          │      │');
    console.log('  │    ▼                                              │      │');
    console.log('  │  🔄 TRANSITIONING (Preparing Next)                │      │');
    console.log('  │    │                                              │      │');
    console.log('  │    └──────────────────────────────────────────────┘      │');
    console.log('  │                                                         │');
    console.log('  └─────────────────────────────────────────────────────────┘\n');

    console.log('Current State:');
    const current = this.states[this.currentState];
    console.log(`  ${current.icon} ${current.color}${current.name}${reset}`);
    console.log(`  ${current.description}\n`);

    console.log('═'.repeat(70) + '\n');
  }

  /**
   * Prints a summary of state transitions
   */
  printSummary() {
    const stats = this.getStatistics();
    const reset = '\x1b[0m';

    console.log('\n' + '═'.repeat(70));
    console.log('STATE MACHINE SUMMARY');
    console.log('═'.repeat(70) + '\n');

    console.log(`Current State: ${this.states[stats.currentState].icon} ${stats.currentState}`);
    console.log(`Total Transitions: ${stats.totalTransitions}\n`);

    console.log('State Visit Counts:');
    Object.entries(stats.stateVisitCounts).forEach(([state, count]) => {
      const stateObj = this.states[state];
      console.log(`  ${stateObj.icon} ${state}: ${count} times`);
    });

    console.log('\nAverage Time in Each State:');
    Object.entries(stats.averageTimeInStates).forEach(([state, avgTime]) => {
      const stateObj = this.states[state];
      console.log(`  ${stateObj.icon} ${state}: ${avgTime}ms`);
    });

    console.log('\n' + '═'.repeat(70) + '\n');
  }

  /**
   * Resets the state machine to IDLE
   */
  reset() {
    this.transition('IDLE', { reason: 'Manual reset' });
  }
}

module.exports = StateMachineLogger;
