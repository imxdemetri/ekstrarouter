/**
 * Setup State Machine
 * 
 * Manages the state of the onboarding process.
 */

const { EventEmitter } = require('events');

// Setup states
const STATES = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  DETECTED: 'detected',
  FLASHING: 'flashing',
  REBOOTING: 'rebooting',
  VERIFYING: 'verifying',
  COMPLETE: 'complete',
  ERROR: 'error',
};

class SetupStateMachine extends EventEmitter {
  constructor() {
    super();
    this.state = STATES.IDLE;
    this.routerInfo = null;
    this.error = null;
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      state: this.state,
      routerInfo: this.routerInfo,
      error: this.error,
    };
  }
  
  /**
   * Set state and emit event
   */
  setState(newState, data = {}) {
    const oldState = this.state;
    this.state = newState;
    
    // Update router info if provided
    if (data.routerInfo) {
      this.routerInfo = data.routerInfo;
    }
    
    // Update error if provided
    if (data.error) {
      this.error = data.error;
    } else if (newState !== STATES.ERROR) {
      this.error = null;
    }
    
    // Emit state change event
    this.emit('state-change', {
      oldState,
      newState,
      state: this.state,
      routerInfo: this.routerInfo,
      error: this.error,
    });
  }
  
  /**
   * Transition to detecting state
   */
  startDetection() {
    this.setState(STATES.DETECTING);
  }
  
  /**
   * Transition to detected state
   */
  routerDetected(routerInfo) {
    this.setState(STATES.DETECTED, { routerInfo });
  }
  
  /**
   * Transition to flashing state
   */
  startFlashing() {
    this.setState(STATES.FLASHING);
  }
  
  /**
   * Transition to rebooting state
   */
  startRebooting() {
    this.setState(STATES.REBOOTING);
  }
  
  /**
   * Transition to verifying state
   */
  startVerifying() {
    this.setState(STATES.VERIFYING);
  }
  
  /**
   * Transition to complete state
   */
  complete() {
    this.setState(STATES.COMPLETE);
  }
  
  /**
   * Transition to error state
   */
  setError(error) {
    this.setState(STATES.ERROR, { error });
  }
  
  /**
   * Reset to idle state
   */
  reset() {
    this.state = STATES.IDLE;
    this.routerInfo = null;
    this.error = null;
    this.emit('state-change', {
      oldState: this.state,
      newState: STATES.IDLE,
      state: STATES.IDLE,
      routerInfo: null,
      error: null,
    });
  }
}

// Create singleton instance
const stateMachine = new SetupStateMachine();

module.exports = {
  stateMachine,
  STATES,
};
