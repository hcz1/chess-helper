import { StockfishEngine } from "./engine/StockfishEngine.js";
import { GameManager } from "./game/GameManager.js";
import { MoveValidator } from "./game/MoveValidator.js";
import { InputHandler } from "./ui/InputHandler.js";
import { OutputFormatter } from "./ui/OutputFormatter.js";
import { CommandParser } from "./ui/CommandParser.js";
import { PositionAnalyzer } from "./analysis/PositionAnalyzer.js";

/**
 * Handle special commands during gameplay.
 * @param {Object} command - Parsed command object
 * @param {GameManager} game - Game manager instance
 * @param {StockfishEngine} engine - Chess engine instance
 * @returns {Promise<boolean>} True if should continue game, false if should exit
 */
async function handleCommand(command, game, engine) {
  switch (command.name) {
    case 'board':
      OutputFormatter.displayBoard(game, game.getLastMove());
      break;
    
    case 'history':
      OutputFormatter.displayHistory(game.getHistory());
      break;
    
    case 'undo':
      if (game.canUndo()) {
        game.undo();
        OutputFormatter.undoConfirmation(1);
        OutputFormatter.displayBoard(game, game.getLastMove());
      } else {
        OutputFormatter.warning('No moves to undo.');
      }
      break;
    
    case 'redo':
      if (game.canRedo()) {
        game.redo();
        OutputFormatter.redoConfirmation(1);
        OutputFormatter.displayBoard(game, game.getLastMove());
      } else {
        OutputFormatter.warning('No moves to redo.');
      }
      break;
    
    case 'analyze':
      try {
        OutputFormatter.analyzing();
        const topMoves = await PositionAnalyzer.getTopMoves(engine, game.getFEN(), 3);
        OutputFormatter.displayTopMoves(topMoves);
      } catch (error) {
        OutputFormatter.warning(`Analysis failed: ${error.message}`);
      }
      break;
    
    case 'help':
      OutputFormatter.displayHelp(CommandParser.getCommandHelp());
      break;
    
    case 'quit':
      return false;
    
    default:
      OutputFormatter.warning('Unknown command.');
  }
  
  return true;
}

/**
 * Main game loop - handles turn-by-turn gameplay.
 * @param {GameManager} game - Game manager instance
 * @param {StockfishEngine} engine - Chess engine instance
 * @param {InputHandler} input - Input handler instance
 */
async function gameLoop(game, engine, input) {
  // Display initial board
  OutputFormatter.displayBoard(game, null);
  
  while (!game.isGameOver()) {
    if (game.isPlayerTurn()) {
      // Player's turn - get suggestion and move
      let suggestedMove;
      try {
        suggestedMove = await engine.getBestMove(game.getFEN());
      } catch (error) {
        OutputFormatter.suggestionWarning(error.message);
        suggestedMove = null;
      }

      const prompt = suggestedMove 
        ? `Your move (suggested: ${suggestedMove}, press Enter to use): `
        : `Your move: `;
      
      const myMove = await input.getMove(prompt, suggestedMove);

      // Check for commands
      if (input.isCommand(myMove)) {
        const command = input.parseCommand(myMove);
        const shouldContinue = await handleCommand(command, game, engine);
        if (!shouldContinue) {
          OutputFormatter.goodbye();
          return;
        }
        continue;
      }

      // Validate and apply player's move
      try {
        const result = game.makeMove(myMove);
        OutputFormatter.move(game.getPlayerColorName(), MoveValidator.formatMove(result), true);
      } catch (error) {
        OutputFormatter.invalidMove();
        continue;
      }

      // Display board after player's move
      OutputFormatter.displayBoard(game, game.getLastMove());

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

      // Check for commands (opponent can also use commands)
      if (input.isCommand(opponentMove)) {
        const command = input.parseCommand(opponentMove);
        const shouldContinue = await handleCommand(command, game, engine);
        if (!shouldContinue) {
          OutputFormatter.goodbye();
          return;
        }
        continue;
      }

      // Validate and apply opponent's move
      try {
        const result = game.makeMove(opponentMove);
        OutputFormatter.move(game.getOpponentColorName(), MoveValidator.formatMove(result), false);
      } catch (error) {
        OutputFormatter.invalidMove();
        continue;
      }

      // Display board after opponent's move
      OutputFormatter.displayBoard(game, game.getLastMove());

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
