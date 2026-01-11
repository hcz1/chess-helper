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
