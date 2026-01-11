import { Chess } from "chess.js";
import readline from "readline";
import { readlinkSync, readdirSync, readFileSync } from "fs";
import { join, dirname, extname, basename as pathBasename } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const game = new Chess();

// Initialize Stockfish engine
let engine = null;
let engineReady = false;
let engineCrashed = false;
const messageHandlers = new Map(); // Use Map to handle multiple concurrent requests

async function initEngine() {
  try {
    const pathToEngine = join(
      __dirname,
      "node_modules",
      "stockfish",
      "src",
      readlinkSync(join(__dirname, "node_modules/stockfish/src/stockfish.js"))
    );

    const ext = extname(pathToEngine);
    const basepath = pathToEngine.slice(0, -ext.length);
    const wasmPath = basepath + ".wasm";
    const basename = pathBasename(basepath);
    const engineDir = dirname(pathToEngine);
    const buffers = [];

    const INIT_ENGINE = (await import(pathToEngine)).default;

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

    const Stockfish = INIT_ENGINE();
    await Stockfish(engineConfig).then(function checkIfReady() {
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
    });

    engine = engineConfig;

    engine.sendCommand = function (cmd) {
      setImmediate(function () {
        engine.ccall("command", null, ["string"], [cmd], {
          async: /^go\b/.test(cmd),
        });
      });
    };

    engine.listener = function (line) {
      if (line === "uciok") {
        engineReady = true;
      }
      // Notify all registered handlers
      for (const handler of messageHandlers.values()) {
        handler(line);
      }
    };

    return engine;
  } catch (error) {
    engineCrashed = true;
    throw new Error(`Failed to initialize engine: ${error.message}`);
  }
}

function cleanup() {
  try {
    rl.close();
  } catch (e) {
    // Ignore errors during cleanup
  }
  try {
    if (!engineCrashed && engine && engine.terminate) {
      engine.terminate();
    }
  } catch (e) {
    // Ignore errors during cleanup
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Thanks for playing!");
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

function sendCommand(cmd) {
  if (engineCrashed) {
    throw new Error("Chess engine is not running");
  }
  if (!engine || !engine.sendCommand) {
    throw new Error("Engine not initialized");
  }
  engine.sendCommand(cmd);
}

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function waitForEngine() {
  await initEngine();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Engine initialization timeout"));
    }, 10000); // 10 second timeout

    // Initialize the engine
    sendCommand("uci");

    const checkReady = setInterval(() => {
      if (engineReady) {
        clearInterval(checkReady);
        clearTimeout(timeout);
        resolve();
      }
      if (engineCrashed) {
        clearInterval(checkReady);
        clearTimeout(timeout);
        reject(new Error("Engine crashed during initialization"));
      }
    }, 100);
  });
}

function getBestMove(fen) {
  return new Promise((resolve, reject) => {
    const requestId = Date.now() + Math.random(); // Unique ID for this request
    const timeout = setTimeout(() => {
      messageHandlers.delete(requestId);
      reject(new Error("Engine response timeout"));
    }, 30000); // 30 second timeout

    try {
      sendCommand(`position fen ${fen}`);
      sendCommand("go depth 15");

      messageHandlers.set(requestId, (line) => {
        if (line.startsWith("bestmove")) {
          const bestMove = line.split(" ")[1];
          clearTimeout(timeout);
          messageHandlers.delete(requestId);
          resolve(bestMove);
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      messageHandlers.delete(requestId);
      reject(error);
    }
  });
}

(async function main() {
  try {
    console.log("\n♟ Chess Move Helper\n");
    console.log("⏳ Initializing chess engine...");

    // Wait for engine to be ready before starting
    await waitForEngine();
    console.log("✅ Engine ready!\n");

    const colour = (
      await ask("Are you playing white or black? (w/b): ")
    ).toLowerCase();

    if (colour !== "w" && colour !== "b") {
      console.log("❌ Please enter 'w' or 'b'");
      cleanup();
      return;
    }

    const myColor = colour === "w" ? "white" : "black";
    const opponentColor = colour === "w" ? "black" : "white";
    const isPlayingWhite = colour === "w";

    console.log(`\nYou are playing as ${myColor}. Enter 'quit' to exit.\n`);

    // Game loop
    while (!game.isGameOver()) {
      const isMyTurn = (isPlayingWhite && game.turn() === "w") || 
                       (!isPlayingWhite && game.turn() === "b");

      if (isMyTurn) {
        // It's your turn - get suggestion and your move
        let suggestedMove;
        try {
          suggestedMove = await getBestMove(game.fen());
        } catch (error) {
          console.error("⚠️  Failed to get move suggestion:", error.message);
          suggestedMove = "N/A";
        }

        const myMove = await ask(`Your move (suggested: ${suggestedMove}): `);

        if (myMove.toLowerCase() === "quit") {
          console.log("\n👋 Thanks for playing!");
          break;
        }

        // Validate and apply your move
        try {
          const result = game.move(myMove, { sloppy: true });
          console.log(`You (${myColor}): ${result.san}`);
        } catch (error) {
          console.log("❌ Invalid move. Please try again.");
          console.log("   Examples: e4, Nf3, e2e4, O-O\n");
          continue;
        }

        // Check if game is over after your move
        if (game.isGameOver()) {
          console.log("\n🎮 Game Over!");
          if (game.isCheckmate()) {
            console.log(`You win by checkmate! 🎉`);
          } else if (game.isDraw()) {
            console.log("Game ended in a draw.");
          } else if (game.isStalemate()) {
            console.log("Game ended in stalemate.");
          } else if (game.isThreefoldRepetition()) {
            console.log("Game ended in a draw by threefold repetition.");
          } else if (game.isInsufficientMaterial()) {
            console.log("Game ended in a draw by insufficient material.");
          }
          break;
        }
        console.log(); // Empty line for readability
      } else {
        // It's opponent's turn
        const opponentMove = await ask(`${opponentColor}'s move: `);

        if (opponentMove.toLowerCase() === "quit") {
          console.log("\n👋 Thanks for playing!");
          break;
        }

        // Validate and apply opponent's move
        try {
          const result = game.move(opponentMove, { sloppy: true });
          console.log(`${opponentColor}: ${result.san}\n`);
        } catch (error) {
          console.log("❌ Invalid move. Please try again.");
          console.log("   Examples: e4, Nf3, e2e4, O-O\n");
          continue;
        }

        // Check if game is over after opponent's move
        if (game.isGameOver()) {
          console.log("🎮 Game Over!");
          if (game.isCheckmate()) {
            console.log(`${opponentColor} wins by checkmate!`);
          } else if (game.isDraw()) {
            console.log("Game ended in a draw.");
          } else if (game.isStalemate()) {
            console.log("Game ended in stalemate.");
          } else if (game.isThreefoldRepetition()) {
            console.log("Game ended in a draw by threefold repetition.");
          } else if (game.isInsufficientMaterial()) {
            console.log("Game ended in a draw by insufficient material.");
          }
          break;
        }

        // Show if in check
        if (game.inCheck()) {
          console.log(`⚠️  You are in check!\n`);
        }
      }
    }

    cleanup();
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    cleanup();
    process.exit(1);
  }
})();
