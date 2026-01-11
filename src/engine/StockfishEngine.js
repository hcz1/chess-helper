import { readlinkSync, readdirSync, readFileSync } from "fs";
import { join, dirname, extname, basename as pathBasename } from "path";
import { fileURLToPath } from "url";
import { ENGINE_CONFIG } from "./EngineConfig.js";

/**
 * Manages the Stockfish chess engine lifecycle and communication.
 * Handles WASM initialization, UCI protocol, and move analysis.
 */
export class StockfishEngine {
  constructor() {
    this.engine = null;
    this.engineReady = false;
    this.engineCrashed = false;
    this.messageHandlers = new Map();
  }

  /**
   * Initialize the Stockfish WASM engine.
   * Loads the engine binary and sets up message handling.
   * @returns {Promise<void>}
   * @throws {Error} If engine initialization fails
   */
  async initialize() {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const projectRoot = join(__dirname, "..", "..");

      // Locate the Stockfish engine binary
      const pathToEngine = join(
        projectRoot,
        "node_modules",
        "stockfish",
        "src",
        readlinkSync(join(projectRoot, "node_modules/stockfish/src/stockfish.js"))
      );

      const ext = extname(pathToEngine);
      const basepath = pathToEngine.slice(0, -ext.length);
      const wasmPath = basepath + ".wasm";
      const basename = pathBasename(basepath);
      const engineDir = dirname(pathToEngine);
      const buffers = [];

      // Import the engine initialization function
      const INIT_ENGINE = (await import(pathToEngine)).default;

      // Configure WASM file locations
      const engineConfig = {
        locateFile: function (path) {
          if (path.indexOf(".wasm") > -1) {
            if (path.indexOf(".wasm.map") > -1) {
              return wasmPath + ".map";
            }
            return wasmPath;
          } else {
            return pathToEngine;
          }
        },
      };

      // Manually assemble the WASM parts if the engine is split into parts
      readdirSync(engineDir)
        .sort()
        .forEach(function (path) {
          if (path.startsWith(basename + "-part-") && path.endsWith(".wasm")) {
            buffers.push(readFileSync(join(engineDir, path)));
          }
        });

      if (buffers.length) {
        engineConfig.wasmBinary = Buffer.concat(buffers);
      }

      // Initialize the Stockfish WASM module
      const Stockfish = INIT_ENGINE();
      await Stockfish(engineConfig).then(
        function checkIfReady() {
          return new Promise((resolve) => {
            if (engineConfig._isReady) {
              const check = () => {
                if (!engineConfig._isReady()) {
                  return setTimeout(check, 10);
                }
                delete engineConfig._isReady;
                resolve();
              };
              check();
            } else {
              resolve();
            }
          });
        }
      );

      this.engine = engineConfig;

      // Set up command sending interface
      this.engine.sendCommand = (cmd) => {
        setImmediate(() => {
          this.engine.ccall("command", null, ["string"], [cmd], {
            async: /^go\b/.test(cmd),
          });
        });
      };

      // Set up message listener
      this.engine.listener = (line) => {
        if (line === "uciok") {
          this.engineReady = true;
        }
        // Notify all registered handlers
        for (const handler of this.messageHandlers.values()) {
          handler(line);
        }
      };
    } catch (error) {
      this.engineCrashed = true;
      throw new Error(`Failed to initialize engine: ${error.message}`);
    }
  }

  /**
   * Wait for the engine to be ready by sending UCI command and waiting for response.
   * @returns {Promise<void>}
   * @throws {Error} If engine initialization times out or crashes
   */
  async waitForReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Engine initialization timeout"));
      }, ENGINE_CONFIG.INIT_TIMEOUT);

      // Initialize the engine with UCI protocol
      this.sendCommand("uci");

      const checkReady = setInterval(() => {
        if (this.engineReady) {
          clearInterval(checkReady);
          clearTimeout(timeout);
          resolve();
        }
        if (this.engineCrashed) {
          clearInterval(checkReady);
          clearTimeout(timeout);
          reject(new Error("Engine crashed during initialization"));
        }
      }, 100);
    });
  }

  /**
   * Get the best move for a given position.
   * @param {string} fen - FEN string of the position
   * @param {number} [depth] - Search depth (defaults to ENGINE_CONFIG.DEFAULT_DEPTH)
   * @returns {Promise<string>} Best move in UCI format (e.g., "e2e4")
   * @throws {Error} If engine is not ready or times out
   */
  async getBestMove(fen, depth = ENGINE_CONFIG.DEFAULT_DEPTH) {
    return new Promise((resolve, reject) => {
      const requestId = Date.now() + Math.random(); // Unique ID for this request
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(requestId);
        reject(new Error("Engine response timeout"));
      }, ENGINE_CONFIG.MOVE_TIMEOUT);

      try {
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go depth ${depth}`);

        this.messageHandlers.set(requestId, (line) => {
          if (line.startsWith("bestmove")) {
            const bestMove = line.split(" ")[1];
            clearTimeout(timeout);
            this.messageHandlers.delete(requestId);
            resolve(bestMove);
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        this.messageHandlers.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * Get detailed analysis with evaluation and multiple move options.
   * @param {string} fen - FEN string of the position
   * @param {number} [numMoves=3] - Number of top moves to analyze
   * @param {number} [depth] - Search depth (defaults to ENGINE_CONFIG.DEFAULT_DEPTH)
   * @returns {Promise<Object>} Analysis object with moves and evaluations
   * @throws {Error} If engine is not ready or times out
   */
  async getAnalysis(fen, numMoves = 3, depth = ENGINE_CONFIG.DEFAULT_DEPTH) {
    return new Promise((resolve, reject) => {
      const requestId = Date.now() + Math.random();
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(requestId);
        reject(new Error("Engine analysis timeout"));
      }, ENGINE_CONFIG.MOVE_TIMEOUT * 2); // Longer timeout for analysis

      const moves = [];
      let lastEvaluation = null;

      try {
        // Set MultiPV option for multiple variations
        this.sendCommand(`setoption name MultiPV value ${numMoves}`);
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go depth ${depth}`);

        this.messageHandlers.set(requestId, (line) => {
          // Parse info lines for move evaluations
          if (line.startsWith("info") && line.includes("pv")) {
            const analysis = this.parseInfoLine(line);
            if (analysis) {
              // Update or add move to list
              const existingIndex = moves.findIndex(m => m.multipv === analysis.multipv);
              if (existingIndex >= 0) {
                moves[existingIndex] = analysis;
              } else {
                moves.push(analysis);
              }
              
              // Track the last evaluation (for the best move)
              if (analysis.multipv === 1) {
                lastEvaluation = analysis.score;
              }
            }
          }
          
          if (line.startsWith("bestmove")) {
            clearTimeout(timeout);
            this.messageHandlers.delete(requestId);
            
            // Reset MultiPV to 1
            this.sendCommand(`setoption name MultiPV value 1`);
            
            // Sort moves by multipv
            moves.sort((a, b) => a.multipv - b.multipv);
            
            resolve({
              bestMove: line.split(" ")[1],
              evaluation: lastEvaluation,
              moves: moves,
              depth: depth
            });
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        this.messageHandlers.delete(requestId);
        // Reset MultiPV on error
        try {
          this.sendCommand(`setoption name MultiPV value 1`);
        } catch (e) {
          // Ignore
        }
        reject(error);
      }
    });
  }

  /**
   * Parse UCI info line to extract evaluation and move information.
   * @param {string} line - UCI info line
   * @returns {Object|null} Parsed analysis data or null
   * @private
   */
  parseInfoLine(line) {
    const parts = line.split(" ");
    const result = {
      multipv: 1,
      score: null,
      move: null,
      depth: 0
    };

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "multipv" && i + 1 < parts.length) {
        result.multipv = parseInt(parts[i + 1]);
      } else if (parts[i] === "depth" && i + 1 < parts.length) {
        result.depth = parseInt(parts[i + 1]);
      } else if (parts[i] === "score") {
        // Next part is either 'cp' (centipawns) or 'mate' (mate in N)
        if (i + 2 < parts.length) {
          if (parts[i + 1] === "cp") {
            result.score = {
              type: "cp",
              value: parseInt(parts[i + 2])
            };
          } else if (parts[i + 1] === "mate") {
            result.score = {
              type: "mate",
              value: parseInt(parts[i + 2])
            };
          }
        }
      } else if (parts[i] === "pv" && i + 1 < parts.length) {
        // Principal variation - first move is the suggested move
        result.move = parts[i + 1];
      }
    }

    // Only return if we have a move and score
    return (result.move && result.score) ? result : null;
  }

  /**
   * Send a UCI command to the engine.
   * @param {string} cmd - UCI command to send
   * @throws {Error} If engine is not initialized or has crashed
   */
  sendCommand(cmd) {
    if (this.engineCrashed) {
      throw new Error("Chess engine is not running");
    }
    if (!this.engine || !this.engine.sendCommand) {
      throw new Error("Engine not initialized");
    }
    this.engine.sendCommand(cmd);
  }

  /**
   * Check if the engine is ready to accept commands.
   * @returns {boolean} True if engine is ready
   */
  isReady() {
    return this.engineReady && !this.engineCrashed;
  }

  /**
   * Terminate the engine and clean up resources.
   */
  terminate() {
    try {
      if (!this.engineCrashed && this.engine && this.engine.terminate) {
        this.engine.terminate();
      }
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}
