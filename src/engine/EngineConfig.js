/**
 * Configuration constants for the Stockfish chess engine.
 * @module EngineConfig
 */

/**
 * Engine configuration settings
 * @constant {Object}
 */
export const ENGINE_CONFIG = {
  /** Timeout for engine initialization in milliseconds */
  INIT_TIMEOUT: 10000, // 10 seconds
  
  /** Timeout for move calculation in milliseconds */
  MOVE_TIMEOUT: 30000, // 30 seconds
  
  /** Default search depth for move analysis */
  DEFAULT_DEPTH: 15,
  
  /** UCI engine options */
  UCI_OPTIONS: {
    /** Number of CPU threads to use */
    Threads: 1,
    
    /** Hash table size in MB */
    Hash: 128,
  },
};
