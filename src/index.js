#!/usr/bin/env node

import chalk from "chalk";
import { StockfishEngine } from "./engine/StockfishEngine.js";
import { GameManager } from "./game/GameManager.js";
import { MoveValidator } from "./game/MoveValidator.js";
import { InputHandler } from "./ui/InputHandler.js";
import { OutputFormatter } from "./ui/OutputFormatter.js";
import { CommandParser } from "./ui/CommandParser.js";
import { PositionAnalyzer } from "./analysis/PositionAnalyzer.js";
import { MoveExplainer } from "./analysis/MoveExplainer.js";
import { OpeningDetector } from "./analysis/OpeningDetector.js";
import { CommandLineParser } from "./cli/CommandLineParser.js";
import { ConfigManager } from "./config/ConfigManager.js";
import { OpeningTracker } from "./game/OpeningTracker.js";

let activeEngine = null;
let activeInput = null;

/**
 * Handle special commands during gameplay.
 * @param {Object} command - Parsed command object
 * @param {GameManager} game - Game manager instance
 * @param {StockfishEngine} engine - Chess engine instance
 * @param {ConfigManager} config - Config manager instance
 * @param {Object} appConfig - Application configuration
 * @param {OpeningTracker} openingTracker - Opening tracker instance
 * @returns {Promise<boolean>} True if should continue game, false if should exit
 */
async function handleCommand(
  command,
  game,
  engine,
  config,
  appConfig,
  openingTracker
) {
  switch (command.name) {
    case "board":
      OutputFormatter.displayBoard(game, game.getLastMove());
      break;

    case "history":
      OutputFormatter.displayHistory(game.getHistory());
      break;

    case "undo":
      if (game.canUndo()) {
        game.undo();
        OutputFormatter.undoConfirmation(1);
        OutputFormatter.displayBoard(game, game.getLastMove());
        updateOpeningState(game, appConfig, openingTracker);
      } else {
        OutputFormatter.warning("No moves to undo.");
      }
      break;

    case "redo":
      if (game.canRedo()) {
        game.redo();
        OutputFormatter.redoConfirmation(1);
        OutputFormatter.displayBoard(game, game.getLastMove());
        updateOpeningState(game, appConfig, openingTracker);
      } else {
        OutputFormatter.warning("No moves to redo.");
      }
      break;

    case "analyze":
      try {
        OutputFormatter.analyzing();
        const topMoves = await PositionAnalyzer.getTopMoves(
          engine,
          game.getFEN(),
          3,
          appConfig?.analysis?.analysisDepth ?? appConfig?.engine?.depth
        );
        await OutputFormatter.analysisComplete();
        OutputFormatter.displayTopMoves(topMoves);
      } catch (error) {
        OutputFormatter.stopSpinner();
        OutputFormatter.warning(`Analysis failed: ${error.message}`);
      }
      break;

    case "config":
      OutputFormatter.info(config.getFormattedConfig());
      break;

    case "opening":
      if (openingTracker) {
        OutputFormatter.displayOpeningStatus(openingTracker.getStatus());
      } else {
        OutputFormatter.displayOpeningStatus({ status: "unknown" });
      }
      break;

    case "help":
      OutputFormatter.displayHelp(CommandParser.getCommandHelp());
      break;

    case "quit":
      return false;

    default:
      OutputFormatter.warning("Unknown command.");
  }

  return true;
}

/**
 * Log the engine evaluation for the current position to the console.
 * Respects the display.showEvaluation flag to avoid unwanted analysis.
 * @param {StockfishEngine} engine - Stockfish engine instance
 * @param {GameManager} game - Game manager instance
 * @param {Object} appConfig - Application configuration
 */
async function logEvaluation(engine, game, appConfig) {
  if (!appConfig.display.showEvaluation) {
    return;
  }

  try {
    const depth = appConfig?.engine?.depth;
    const analysis = await engine.getAnalysis(game.getFEN(), 1, depth);
    OutputFormatter.displayMoveEvaluation(analysis.evaluation, analysis.depth);
  } catch (error) {
    OutputFormatter.warning(`Evaluation unavailable: ${error.message}`);
  }
}

/**
 * Update opening tracker and optionally print transition messages.
 * @param {GameManager} game - Game manager instance
 * @param {Object} appConfig - Application configuration
 * @param {OpeningTracker} openingTracker - Opening tracker instance
 */
function updateOpeningState(game, appConfig, openingTracker) {
  if (!openingTracker) {
    return;
  }

  const fen = game.getFEN();
  const ply = OpeningDetector.getPlyFromFen(fen);
  const openingEvent = openingTracker.update(fen, ply);

  if (!appConfig?.display?.showOpening) {
    return;
  }

  if (openingEvent.event === "detected" || openingEvent.event === "refined") {
    OutputFormatter.displayOpeningDetected(openingEvent);
  } else if (openingEvent.event === "left_line") {
    OutputFormatter.displayOutOfBook(openingEvent.lastKnownOpening);
  }
}

/**
 * Main game loop - handles turn-by-turn gameplay.
 * @param {GameManager} game - Game manager instance
 * @param {StockfishEngine} engine - Chess engine instance
 * @param {InputHandler} input - Input handler instance
 * @param {ConfigManager} config - Config manager instance
 * @param {Object} appConfig - Application configuration
 * @param {OpeningTracker} openingTracker - Opening tracker instance
 */
async function gameLoop(game, engine, input, config, appConfig, openingTracker) {
  // Display initial board
  OutputFormatter.displayBoard(game, null);

  while (!game.isGameOver()) {
    if (game.isPlayerTurn()) {
      // Player's turn - get suggestion and move
      let suggestedMove;
      let explanation = null;
      if (appConfig.display.showHints) {
        try {
          suggestedMove = await engine.getBestMove(
            game.getFEN(),
            appConfig?.engine?.depth
          );

          // Get rich explanation for the suggested move
          explanation = MoveExplainer.explain(suggestedMove, game.getGame());

          // Display the suggestion with explanation
          if (suggestedMove && explanation && explanation.reasons.length > 0) {
            OutputFormatter.displaySuggestedMove(
              explanation.move || suggestedMove,
              null,
              explanation.reasons
            );
          }
        } catch (error) {
          OutputFormatter.suggestionWarning(error.message);
          suggestedMove = null;
        }
      }

      const prompt = suggestedMove
        ? `Your move (press Enter to use ${
            explanation?.move || suggestedMove
          }): `
        : `Your move: `;

      const myMove = await input.getMove(prompt, suggestedMove);

      // Check for commands
      if (input.isCommand(myMove)) {
        const command = input.parseCommand(myMove);
        const shouldContinue = await handleCommand(
          command,
          game,
          engine,
          config,
          appConfig,
          openingTracker
        );
        if (!shouldContinue) {
          OutputFormatter.goodbye();
          return;
        }
        continue;
      }

      // Validate and apply player's move
      try {
        const result = game.makeMove(myMove);
        OutputFormatter.move(
          game.getPlayerColorName(),
          MoveValidator.formatMove(result),
          true
        );
      } catch (error) {
        OutputFormatter.invalidMove();
        continue;
      }

      // Display board after player's move
      OutputFormatter.displayBoard(game, game.getLastMove());
      updateOpeningState(game, appConfig, openingTracker);

      const gameOverAfterPlayerMove = game.isGameOver();

      if (!gameOverAfterPlayerMove) {
        await logEvaluation(engine, game, appConfig);
      }

      // Check if game is over after player's move
      if (gameOverAfterPlayerMove) {
        const gameOverInfo = game.getGameOverReason();
        OutputFormatter.gameOver(gameOverInfo);
        return;
      }

      OutputFormatter.emptyLine();
    } else {
      // Opponent's turn
      const opponentMove = await input.getMove(
        `${game.getOpponentColorName()}'s move: `
      );

      // Check for commands (opponent can also use commands)
      if (input.isCommand(opponentMove)) {
        const command = input.parseCommand(opponentMove);
        const shouldContinue = await handleCommand(
          command,
          game,
          engine,
          config,
          appConfig,
          openingTracker
        );
        if (!shouldContinue) {
          OutputFormatter.goodbye();
          return;
        }
        continue;
      }

      // Validate and apply opponent's move
      try {
        const result = game.makeMove(opponentMove);
        OutputFormatter.move(
          game.getOpponentColorName(),
          MoveValidator.formatMove(result),
          false
        );
      } catch (error) {
        OutputFormatter.invalidMove();
        continue;
      }

      // Display board after opponent's move
      OutputFormatter.displayBoard(game, game.getLastMove());
      updateOpeningState(game, appConfig, openingTracker);

      const gameOverAfterOpponentMove = game.isGameOver();

      if (!gameOverAfterOpponentMove) {
        await logEvaluation(engine, game, appConfig);
      }

      // Check if game is over after opponent's move
      if (gameOverAfterOpponentMove) {
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

function cleanupActive() {
  try {
    OutputFormatter.stopSpinner();
  } catch (e) {
    // ignore
  }
  cleanup(activeEngine, activeInput);
  activeEngine = null;
  activeInput = null;
}

/**
 * Main application entry point.
 */
async function main() {
  // Parse command-line arguments
  const cliParser = new CommandLineParser();
  const { options, commands } = cliParser.parse();

  // Initialize configuration manager
  const configManager = new ConfigManager();
  const appConfig = configManager.mergeWithCliOptions(options);

  // Disable ANSI colors globally when requested (CLI/config).
  // chalk's level is writable and affects all chalk usages in the process.
  if (appConfig?.display?.colors === false) {
    chalk.level = 0;
  }

  // Handle config commands
  if (commands.config) {
    if (commands.config.action === "show") {
      console.log(configManager.getFormattedConfig());
    } else if (commands.config.action === "set") {
      try {
        configManager.set(commands.config.key, commands.config.value);
        console.log(`✓ Set ${commands.config.key} = ${commands.config.value}`);
      } catch (error) {
        console.error(`✗ Error: ${error.message}`);
        process.exit(1);
      }
    } else if (commands.config.action === "reset") {
      configManager.reset();
      console.log("✓ Configuration reset to defaults");
    }
    return;
  }

  // Handle analyze command
  if (commands.analyze) {
    const openingDetector = new OpeningDetector();
    const engine = new StockfishEngine({
      ...appConfig.engine,
      depth: commands.analyze.depth ?? appConfig.engine.depth,
    });
    activeEngine = engine;
    try {
      OutputFormatter.welcome();
      OutputFormatter.initializing();
      await engine.initialize();
      await engine.waitForReady();
      OutputFormatter.engineReady();

      const opening = openingDetector.detect(
        commands.analyze.fen,
        OpeningDetector.getPlyFromFen(commands.analyze.fen)
      );
      if (opening) {
        OutputFormatter.displayOpeningStatus({
          status: "known",
          currentOpening: opening,
          lastKnownOpening: opening,
        });
      }

      OutputFormatter.analyzing();
      const topMoves = await PositionAnalyzer.getTopMoves(
        engine,
        commands.analyze.fen,
        commands.analyze.moves || 5,
        commands.analyze.depth ?? appConfig.engine.depth
      );
      OutputFormatter.analysisComplete();
      OutputFormatter.displayTopMoves(topMoves);

      cleanupActive();
    } catch (error) {
      OutputFormatter.stopSpinner();
      OutputFormatter.error(error.message);
      cleanupActive();
      process.exit(1);
    }
    return;
  }

  // Normal game mode
  const engine = new StockfishEngine(appConfig.engine);
  let input = null;
  activeEngine = engine;

  try {
    // Display welcome message
    OutputFormatter.welcome();
    OutputFormatter.initializing();

    // Initialize and wait for engine
    await engine.initialize();
    await engine.waitForReady();
    OutputFormatter.engineReady();

    // Create input handler AFTER spinner is done
    input = new InputHandler();
    activeInput = input;

    // Get player color (from CLI/config, or startup menu)
    let color = appConfig.game.defaultColor;
    if (!color) {
      const startup = await input.getStartupAction();
      if (startup.action === "quit") {
        OutputFormatter.goodbye();
        cleanupActive();
        return;
      }
      color = startup.color;
    }

    const game = new GameManager(color);
    const openingTracker = new OpeningTracker();

    // Load FEN if provided
    if (appConfig.game.startFen) {
      try {
        game.loadFEN(appConfig.game.startFen);
        OutputFormatter.info(`Loaded position from FEN`);
      } catch (error) {
        OutputFormatter.warning(`Failed to load FEN: ${error.message}`);
      }
    }

    // Display game start message
    OutputFormatter.gameStart(game.getPlayerColorName());
    updateOpeningState(game, appConfig, openingTracker);

    // Run game loop
    await gameLoop(
      game,
      engine,
      input,
      configManager,
      appConfig,
      openingTracker
    );

    // Clean up
    cleanupActive();
  } catch (error) {
    OutputFormatter.stopSpinner();
    OutputFormatter.error(error.message);
    cleanupActive();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  OutputFormatter.goodbye();
  cleanupActive();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanupActive();
  process.exit(0);
});

// Start the application
main();
