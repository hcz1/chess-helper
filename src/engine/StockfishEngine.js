import { readlinkSync, readdirSync, readFileSync } from "fs";
import { join, dirname, extname, basename as pathBasename } from "path";
import { fileURLToPath } from "url";
import { ENGINE_CONFIG } from "./EngineConfig.js";

/**
 * Manages the Stockfish chess engine lifecycle and communication.
 * Handles WASM initialization, UCI protocol, and move analysis.
 */
export class StockfishEngine {
  /**
   * @param {Object} [options]
   * @param {number} [options.depth]
   * @param {number} [options.initTimeout]
   * @param {number} [options.moveTimeout]
   * @param {number} [options.threads]
   * @param {number} [options.hashSize]
   */
  constructor(options = {}) {
    this.engine = null;
    this.engineReady = false;
    this.engineCrashed = false;
    this.messageHandlers = new Map();

    // Serialize all "go" searches; UCI output isn't request-scoped.
    this._queue = Promise.resolve();

    this._uciOk = false;
    this._optionsApplied = false;

    this.config = {
      depth: Number.isFinite(options.depth)
        ? options.depth
        : ENGINE_CONFIG.DEFAULT_DEPTH,
      initTimeout: Number.isFinite(options.initTimeout)
        ? options.initTimeout
        : ENGINE_CONFIG.INIT_TIMEOUT,
      moveTimeout: Number.isFinite(options.moveTimeout)
        ? options.moveTimeout
        : ENGINE_CONFIG.MOVE_TIMEOUT,
      threads: Number.isFinite(options.threads)
        ? options.threads
        : ENGINE_CONFIG.UCI_OPTIONS.Threads,
      hashSize: Number.isFinite(options.hashSize)
        ? options.hashSize
        : ENGINE_CONFIG.UCI_OPTIONS.Hash,
    };
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
        if (line === "uciok") this._uciOk = true;
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
   * Wait for the engine to be ready:
   * 1) uci -> uciok
   * 2) setoption (Threads/Hash)
   * 3) isready -> readyok
   * @returns {Promise<void>}
   * @throws {Error} If engine initialization times out or crashes
   */
  async waitForReady() {
    return new Promise((resolve, reject) => {
      if (this.engineCrashed) {
        reject(new Error("Engine crashed during initialization"));
        return;
      }

      const handlerId = `init-${Date.now()}-${Math.random()}`;
      let settled = false;

      const cleanup = () => {
        this.messageHandlers.delete(handlerId);
        clearTimeout(timeout);
      };

      const settle = (fn) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn();
      };

      const timeout = setTimeout(() => {
        settle(() => reject(new Error("Engine initialization timeout")));
      }, this.config.initTimeout);

      this.messageHandlers.set(handlerId, (line) => {
        if (this.engineCrashed) {
          settle(() => reject(new Error("Engine crashed during initialization")));
          return;
        }

        if (line === "uciok") {
          try {
            this._applyUciOptions();
            this.sendCommand("isready");
          } catch (e) {
            settle(() => reject(e));
          }
          return;
        }

        if (line === "readyok") {
          this.engineReady = true;
          settle(() => resolve());
        }
      });

      // Initialize the engine with UCI protocol
      try {
        this.sendCommand("uci");
      } catch (e) {
        settle(() => reject(e));
      }
    });
  }

  _applyUciOptions() {
    if (this._optionsApplied) return;
    this._optionsApplied = true;

    // These options are supported by Stockfish and improve speed.
    if (Number.isFinite(this.config.threads)) {
      this.sendCommand(`setoption name Threads value ${this.config.threads}`);
    }
    if (Number.isFinite(this.config.hashSize)) {
      this.sendCommand(`setoption name Hash value ${this.config.hashSize}`);
    }
  }

  _enqueue(taskFn) {
    const run = async () => {
      if (this.engineCrashed) throw new Error("Chess engine is not running");
      if (!this.engine) throw new Error("Engine not initialized");
      if (!this.engineReady) throw new Error("Engine not ready");
      return taskFn();
    };

    const p = this._queue.then(run, run);
    this._queue = p.catch(() => {});
    return p;
  }

  /**
   * Get the best move for a given position.
   * @param {string} fen - FEN string of the position
   * @param {number} [depth] - Search depth (defaults to ENGINE_CONFIG.DEFAULT_DEPTH)
   * @returns {Promise<string>} Best move in UCI format (e.g., "e2e4")
   * @throws {Error} If engine is not ready or times out
   */
  async getBestMove(fen, depth = this.config.depth) {
    return this._enqueue(
      () =>
        new Promise((resolve, reject) => {
          const requestId = `bestmove-${Date.now()}-${Math.random()}`;
          let settled = false;
          let timedOut = false;
          let drainTimer = null;

          const cleanup = () => {
            this.messageHandlers.delete(requestId);
            clearTimeout(timeout);
            if (drainTimer) clearTimeout(drainTimer);
          };

          const settle = (fn) => {
            if (settled) return;
            settled = true;
            cleanup();
            fn();
          };

          const timeout = setTimeout(() => {
            timedOut = true;
            try {
              this.sendCommand("stop");
            } catch (e) {
              // ignore
            }
            // If we can't get a bestmove after stop, assume engine is wedged.
            drainTimer = setTimeout(() => {
              this.engineCrashed = true;
              try {
                this.terminate();
              } catch (e) {
                // ignore
              }
              settle(() => reject(new Error("Engine response timeout")));
            }, 2000);
          }, this.config.moveTimeout);

          try {
            this.sendCommand(`position fen ${fen}`);
            this.sendCommand(`go depth ${depth}`);

            this.messageHandlers.set(requestId, (line) => {
              if (!line.startsWith("bestmove")) return;
              const bestMove = line.split(" ")[1];
              if (timedOut) {
                settle(() => reject(new Error("Engine response timeout")));
              } else {
                settle(() => resolve(bestMove));
              }
            });
          } catch (error) {
            settle(() => reject(error));
          }
        })
    );
  }

  /**
   * Get detailed analysis with evaluation and multiple move options.
   * @param {string} fen - FEN string of the position
   * @param {number} [numMoves=3] - Number of top moves to analyze
   * @param {number} [depth] - Search depth (defaults to ENGINE_CONFIG.DEFAULT_DEPTH)
   * @returns {Promise<Object>} Analysis object with moves and evaluations
   * @throws {Error} If engine is not ready or times out
   */
  async getAnalysis(fen, numMoves = 3, depth = this.config.depth) {
    return this._enqueue(
      () =>
        new Promise((resolve, reject) => {
          const requestId = `analysis-${Date.now()}-${Math.random()}`;
          let settled = false;
          let timedOut = false;
          let drainTimer = null;

          const moves = [];
          let lastEvaluation = null;

          const resetMultiPv = () => {
            try {
              this.sendCommand("setoption name MultiPV value 1");
            } catch (e) {
              // ignore
            }
          };

          const cleanup = () => {
            this.messageHandlers.delete(requestId);
            clearTimeout(timeout);
            if (drainTimer) clearTimeout(drainTimer);
            resetMultiPv();
          };

          const settle = (fn) => {
            if (settled) return;
            settled = true;
            cleanup();
            fn();
          };

          const timeout = setTimeout(() => {
            timedOut = true;
            try {
              this.sendCommand("stop");
            } catch (e) {
              // ignore
            }
            drainTimer = setTimeout(() => {
              this.engineCrashed = true;
              try {
                this.terminate();
              } catch (e) {
                // ignore
              }
              settle(() => reject(new Error("Engine analysis timeout")));
            }, 2000);
          }, this.config.moveTimeout * 2);

          try {
            this.sendCommand(`setoption name MultiPV value ${numMoves}`);
            this.sendCommand(`position fen ${fen}`);
            this.sendCommand(`go depth ${depth}`);

            this.messageHandlers.set(requestId, (line) => {
              if (line.startsWith("info") && line.includes("pv")) {
                const analysis = this.parseInfoLine(line);
                if (analysis) {
                  const existingIndex = moves.findIndex(
                    (m) => m.multipv === analysis.multipv
                  );
                  if (existingIndex >= 0) {
                    moves[existingIndex] = analysis;
                  } else {
                    moves.push(analysis);
                  }

                  if (analysis.multipv === 1) {
                    lastEvaluation = analysis.score;
                  }
                }
                return;
              }

              if (!line.startsWith("bestmove")) return;
              const bestMove = line.split(" ")[1];

              // Sort moves by multipv
              moves.sort((a, b) => a.multipv - b.multipv);

              if (timedOut) {
                settle(() => reject(new Error("Engine analysis timeout")));
              } else {
                settle(() =>
                  resolve({
                    bestMove,
                    evaluation: lastEvaluation,
                    moves,
                    depth,
                  })
                );
              }
            });
          } catch (error) {
            settle(() => reject(error));
          }
        })
    );
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
