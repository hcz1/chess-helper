import { Chess } from "chess.js";
import readline from "readline";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const game = new Chess();

// Initialize Stockfish engine
const enginePath = join(
  __dirname,
  "node_modules",
  "stockfish",
  "src",
  "stockfish.js"
);
const engineProcess = spawn("node", [enginePath], { stdio: "pipe" });

let engineReady = false;
let messageHandler = null;

engineProcess.stdout.on("data", (data) => {
  const output = data.toString().trim();
  const lines = output.split("\n");

  for (const line of lines) {
    if (line === "uciok") {
      engineReady = true;
    }
    if (messageHandler) {
      messageHandler(line);
    }
  }
});

engineProcess.stderr.on("data", (data) => {
  console.error("Engine error:", data.toString());
});

function sendCommand(cmd) {
  engineProcess.stdin.write(cmd + "\n");
}

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function getBestMove(fen) {
  return new Promise((resolve) => {
    sendCommand("uci");
    sendCommand(`position fen ${fen}`);
    sendCommand("go depth 15");

    messageHandler = (line) => {
      if (line.startsWith("bestmove")) {
        const bestMove = line.split(" ")[1];
        messageHandler = null;
        resolve(bestMove);
      }
    };
  });
}

(async function main() {
  console.log("\n♟ Chess Move Helper\n");

  const colour = (
    await ask("Are you playing white or black? (w/b): ")
  ).toLowerCase();

  if (colour !== "w" && colour !== "b") {
    console.log("❌ Please enter 'w' or 'b'");
    rl.close();
    engineProcess.kill();
    return;
  }

  const myColor = colour === "w" ? "white" : "black";
  const opponentColor = colour === "w" ? "black" : "white";

  console.log(`\nYou are playing as ${myColor}. Enter 'quit' to exit.\n`);

  // Game loop
  while (!game.isGameOver()) {
    // Calculate and show best move suggestion
    const suggestedMove = await getBestMove(game.fen());

    // Get your move
    const myMove = await ask(`Your move (suggested: ${suggestedMove}): `);

    if (myMove.toLowerCase() === "quit") {
      console.log("\n👋 Thanks for playing!");
      break;
    }

    // Validate and apply your move
    try {
      const result = game.move(myMove, { sloppy: true });
      console.log(`You (${myColor}): ${result.san}`);
    } catch {
      console.log("❌ Invalid move. Please try again.\n");
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
      }
      break;
    }

    // Get opponent's move
    const opponentMove = await ask(`${opponentColor}'s move: `);

    if (opponentMove.toLowerCase() === "quit") {
      console.log("\n👋 Thanks for playing!");
      break;
    }

    // Validate and apply opponent's move
    try {
      const result = game.move(opponentMove, { sloppy: true });
      console.log(`${opponentColor}: ${result.san}\n`);
    } catch {
      console.log("❌ Invalid move. Please try again.\n");
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
      }
      break;
    }

    // Show if in check
    if (game.inCheck()) {
      console.log(`⚠️  You are in check!\n`);
    }
  }

  rl.close();
  engineProcess.kill();
})();
