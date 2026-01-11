import { StockfishEngine } from "./engine/StockfishEngine.js";
import { GameManager } from "./game/GameManager.js";
import { MoveValidator } from "./game/MoveValidator.js";
import { InputHandler } from "./ui/InputHandler.js";
import { OutputFormatter } from "./ui/OutputFormatter.js";

/**
 * Main game loop - handles turn-by-turn gameplay.
 * @param {GameManager} game - Game manager instance
 * @param {StockfishEngine} engine - Chess engine instance
 * @param {InputHandler} input - Input handler instance
 */
async function gameLoop(game, engine, input) {
  while (!game.isGameOver()) {
    if (game.isPlayerTurn()) {
      // Player's turn - get suggestion and move
      let suggestedMove;
      try {
        suggestedMove = await engine.getBestMove(game.getFEN());
      } catch (error) {
        OutputFormatter.suggestionWarning(error.message);
        suggestedMove = "N/A";
      }

      const myMove = await input.getMove(`Your move (suggested: ${suggestedMove}): `);

      if (myMove.toLowerCase() === "quit") {
        OutputFormatter.goodbye();
        return;
      }

      // Validate and apply player's move
      try {
        const result = game.makeMove(myMove);
        OutputFormatter.move(game.getPlayerColorName(), MoveValidator.formatMove(result), true);
      } catch (error) {
        OutputFormatter.invalidMove();
        continue;
      }

      // Check if game is over after player's move
      if (game.isGameOver()) {
        const gameOverInfo = game.getGameOverReason();
        OutputFormatter.gameOver(gameOverInfo);
        return;
      }
      
      OutputFormatter.emptyLine();
    } else {
      // Opponent's turn
      const opponentMove = await input.getMove(`${game.getOpponentColorName()}'s move: `);

      if (opponentMove.toLowerCase() === "quit") {
        OutputFormatter.goodbye();
        return;
      }

      // Validate and apply opponent's move
      try {
        const result = game.makeMove(opponentMove);
        OutputFormatter.move(game.getOpponentColorName(), MoveValidator.formatMove(result), false);
      } catch (error) {
        OutputFormatter.invalidMove();
        continue;
      }

      // Check if game is over after opponent's move
      if (game.isGameOver()) {
        const gameOverInfo = game.getGameOverReason();
        OutputFormatter.gameOver(gameOverInfo);
        return;
      }

      // Show if player is in check
      if (game.isInCheck()) {
        OutputFormatter.checkWarning();
      }
    }
  }
}

/**
 * Clean up resources before exit.
 * @param {StockfishEngine} engine - Engine to terminate
 * @param {InputHandler} input - Input handler to close
 */
function cleanup(engine, input) {
  if (engine) {
    engine.terminate();
  }
  if (input) {
    input.close();
  }
}

/**
 * Main application entry point.
 */
async function main() {
  const engine = new StockfishEngine();
  const input = new InputHandler();

  try {
    // Display welcome message
    OutputFormatter.welcome();
    OutputFormatter.initializing();

    // Initialize and wait for engine
    await engine.initialize();
    await engine.waitForReady();
    OutputFormatter.engineReady();

    // Get player color
    const color = await input.getPlayerColor();
    const game = new GameManager(color);

    // Display game start message
    OutputFormatter.gameStart(game.getPlayerColorName());

    // Run game loop
    await gameLoop(game, engine, input);

    // Clean up
    cleanup(engine, input);
  } catch (error) {
    OutputFormatter.error(error.message);
    cleanup(engine, input);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  OutputFormatter.goodbye();
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

// Start the application
main();
