import chalk from "chalk";
import boxen from "boxen";
import { table } from "table";
import ora from "ora";

/**
 * Color scheme for consistent styling throughout the application.
 */
const COLORS = {
  primary: chalk.cyan,
  success: chalk.green,
  error: chalk.red.bold,
  warning: chalk.yellow,
  info: chalk.blue,
  highlight: chalk.magenta,
  dim: chalk.gray,
  player: chalk.green.bold,
  opponent: chalk.blue.bold,
  whitePiece: chalk.white,
  blackPiece: chalk.gray,
  coordinates: chalk.dim,
  checkWarning: chalk.red.bold,
  suggestion: chalk.cyan,
  command: chalk.dim,
};

/**
 * Formats and displays output to the console.
 * Provides consistent messaging and formatting throughout the application.
 */
export class OutputFormatter {
  static spinner = null;

  /**
   * Create a boxed message with consistent styling.
   * @param {string} content - Content to display in box
   * @param {Object} options - Boxen options
   * @returns {string} Boxed message
   * @private
   */
  static createBox(content, options = {}) {
    const defaultOptions = {
      padding: 1,
      margin: 0,
      borderStyle: "round",
      borderColor: "cyan",
    };
    return boxen(content, { ...defaultOptions, ...options });
  }

  /**
   * Start a spinner with the given text.
   * @param {string} text - Text to display with spinner
   * @returns {Object} Spinner instance
   */
  static startSpinner(text) {
    this.spinner = ora({
      text: text,
      color: "cyan",
      spinner: "dots",
      discardStdin: false, // Don't discard stdin to preserve readline
      hideCursor: true,
    }).start();
    return this.spinner;
  }

  /**
   * Update the spinner text.
   * @param {string} text - New text to display
   */
  static updateSpinner(text) {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  /**
   * Complete the spinner with success.
   * @param {string} text - Success message
   */
  static succeedSpinner(text) {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
      // Small delay to let terminal settle after spinner
      return new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  /**
   * Complete the spinner with failure.
   * @param {string} text - Failure message
   */
  static failSpinner(text) {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  /**
   * Stop the spinner without success or failure.
   */
  static stopSpinner() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Execute an async function with a spinner.
   * @param {string} text - Spinner text
   * @param {Function} asyncFn - Async function to execute
   * @returns {Promise} Result of async function
   */
  static async withSpinner(text, asyncFn) {
    const spinner = this.startSpinner(text);
    try {
      const result = await asyncFn();
      this.succeedSpinner(text);
      return result;
    } catch (error) {
      this.failSpinner(`${text} - Failed`);
      throw error;
    }
  }

  /**
   * Display welcome message.
   */
  static welcome() {
    const welcomeText = COLORS.primary.bold("♟  Chess Move Helper");
    const subtitle = chalk.dim("Powered by Stockfish");
    const box = this.createBox(`${welcomeText}\n${subtitle}`, {
      borderStyle: "double",
      padding: 1,
      margin: 1,
      borderColor: "cyan",
      textAlignment: "center",
    });
    console.log(box);
  }

  /**
   * Display engine initialization message.
   */
  static initializing() {
    this.startSpinner("Initializing Stockfish engine...");
  }

  /**
   * Display engine ready message.
   */
  static engineReady() {
    this.succeedSpinner("Engine ready!");
    console.log();
  }

  /**
   * Display game start message.
   * @param {string} playerColor - Player's color name ('white' or 'black')
   */
  static gameStart(playerColor) {
    const coloredPlayerColor =
      playerColor === "white"
        ? COLORS.whitePiece(playerColor)
        : COLORS.blackPiece(playerColor);
    console.log(
      `\nYou are playing as ${coloredPlayerColor}. Enter ${COLORS.command(
        "'quit'"
      )} to exit.\n`
    );
  }

  /**
   * Display a move made by a player.
   * @param {string} colorName - Color name ('white' or 'black')
   * @param {string} move - Move in SAN notation
   * @param {boolean} isPlayer - Whether this is the player's move
   */
  static move(colorName, move, isPlayer = false) {
    const coloredMove = COLORS.highlight(move);
    if (isPlayer) {
      console.log(COLORS.player(`You (${colorName}): `) + coloredMove);
    } else {
      console.log(COLORS.opponent(`${colorName}: `) + coloredMove + "\n");
    }
  }

  /**
   * Display invalid move error.
   */
  static invalidMove() {
    console.log(COLORS.error("❌ Invalid move. Please try again."));
    console.log(COLORS.dim("   Examples: e4, Nf3, e2e4, O-O") + "\n");
  }

  /**
   * Display game over message.
   * @param {Object} gameOverInfo - Game over information
   */
  static gameOver(gameOverInfo) {
    const title = COLORS.primary.bold("🎮 Game Over!");
    const message = COLORS.info(gameOverInfo.message);
    const box = this.createBox(`${title}\n\n${message}`, {
      borderStyle: "bold",
      padding: 1,
      margin: 1,
      borderColor: "yellow",
      textAlignment: "center",
    });
    console.log(box);
  }

  /**
   * Display check warning.
   */
  static checkWarning() {
    console.log(COLORS.checkWarning("⚠️  You are in check!") + "\n");
  }

  /**
   * Display goodbye message.
   */
  static goodbye() {
    console.log("\n" + COLORS.primary("👋 Thanks for playing!"));
  }

  /**
   * Display an error message.
   * @param {string} message - Error message to display
   */
  static error(message) {
    const box = this.createBox(COLORS.error(`❌ Fatal Error\n\n${message}`), {
      borderStyle: "double",
      padding: 1,
      margin: 1,
      borderColor: "red",
      textAlignment: "center",
    });
    console.error(box);
  }

  /**
   * Display a warning when move suggestion fails.
   * @param {string} errorMessage - Error message
   */
  static suggestionWarning(errorMessage) {
    console.error(
      COLORS.warning(`⚠️  Failed to get move suggestion: ${errorMessage}`)
    );
  }

  /**
   * Display an empty line for readability.
   */
  static emptyLine() {
    console.log();
  }

  /**
   * Display the chess board.
   * @param {Object} game - Chess.js game instance or GameManager
   * @param {Object} lastMove - Last move object
   * @param {boolean} showInfo - Whether to show captured pieces and material
   */
  static displayBoard(game, lastMove = null, showInfo = true) {
    // Import BoardRenderer dynamically to avoid circular dependencies
    const actualGame = game.getGame ? game.getGame() : game;

    // We'll use a simple inline board renderer for now
    // This will be replaced when we integrate BoardRenderer properly
    console.log("\n" + this.renderSimpleBoard(actualGame, lastMove, showInfo));
  }

  /**
   * Simple board renderer (used internally).
   * @param {Object} game - Chess.js game instance
   * @param {Object} lastMove - Last move object
   * @param {boolean} showInfo - Whether to show additional info
   * @returns {string} Board string
   * @private
   */
  static renderSimpleBoard(game, lastMove, showInfo) {
    const PIECE_SYMBOLS = {
      K: "♚",
      Q: "♛",
      R: "♜",
      B: "♝",
      N: "♞",
      P: "♟", // White pieces (uppercase)
      k: "♔",
      q: "♕",
      r: "♖",
      b: "♗",
      n: "♘",
      p: "♙", // Black pieces (lowercase)
    };

    const board = game.board();
    let output = COLORS.coordinates("  a b c d e f g h") + "\n";

    // Chess.js board array: board[0] = rank 8, board[7] = rank 1
    for (let rank = 7; rank >= 0; rank--) {
      const displayRank = rank + 1;
      const boardIndex = 7 - rank; // Invert: rank 8 (display) = board[0], rank 1 (display) = board[7]
      output += COLORS.coordinates(`${displayRank} `);

      for (let file = 0; file < 8; file++) {
        const square = board[boardIndex][file];
        const squareName = "abcdefgh"[file] + displayRank;
        const isHighlighted =
          lastMove &&
          (squareName === lastMove.from || squareName === lastMove.to);

        if (square) {
          const notation =
            square.color === "w"
              ? square.type.toUpperCase()
              : square.type.toLowerCase();
          const symbol = PIECE_SYMBOLS[notation] || "?";
          const coloredSymbol =
            square.color === "w"
              ? COLORS.whitePiece(symbol)
              : COLORS.blackPiece(symbol);
          output += isHighlighted
            ? chalk.bgYellow(coloredSymbol) + " "
            : coloredSymbol + " ";
        } else {
          const dot = "·";
          output += isHighlighted
            ? chalk.bgYellow(dot) + " "
            : COLORS.dim(dot) + " ";
        }
      }

      output += COLORS.coordinates(`${displayRank}`) + "\n";
    }

    output += COLORS.coordinates("  a b c d e f g h") + "\n";
    return output;
  }

  /**
   * Display move history.
   * @param {GameHistory} history - Game history object
   */
  static displayHistory(history) {
    console.log("\n" + COLORS.info(history.getFormattedHistory()));
  }

  /**
   * Format a Stockfish evaluation object into a human-readable string.
   * Falls back to 0.00 when a score is missing.
   * @param {{type: string, value: number}|null} score - Evaluation score
   * @returns {string} Formatted evaluation
   */
  static formatEvaluation(score) {
    if (!score) {
      return "0.00";
    }

    if (score.type === "mate") {
      const mateIn = score.value;
      return mateIn > 0 ? `Mate in ${mateIn}` : `Mated in ${Math.abs(mateIn)}`;
    }

    const pawns = score.value / 100;
    const sign = pawns >= 0 ? "+" : "";
    return `${sign}${pawns.toFixed(2)}`;
  }

  /**
   * Display a concise evaluation line for the current position.
   * @param {{type: string, value: number}|null} score - Evaluation score
   * @param {number} depth - Search depth used
   */
  static displayMoveEvaluation(score, depth) {
    const formattedEval = this.formatEvaluation(score);
    const scoreValue = score ? score.value : 0;
    const evalColor =
      scoreValue > 0
        ? COLORS.success
        : scoreValue < 0
        ? COLORS.error
        : COLORS.info;
    const depthText = depth ? ` ${COLORS.dim(`(depth ${depth})`)}` : "";
    console.log(
      `${COLORS.info("📈 Evaluation:")} ${evalColor(formattedEval)}${depthText}`
    );
  }

  /**
   * Display position analysis.
   * @param {Object} analysis - Analysis object from PositionAnalyzer
   */
  static displayAnalysis(analysis) {
    const evalColor =
      analysis.score > 0
        ? COLORS.success
        : analysis.score < 0
        ? COLORS.error
        : COLORS.info;
    console.log(
      `\n${COLORS.info("📊 Evaluation:")} ${evalColor(
        analysis.formattedEval
      )} ${COLORS.dim("(" + analysis.assessment + ")")}`
    );
  }

  /**
   * Display top moves with evaluations.
   * @param {Array} topMoves - Array of top moves from PositionAnalyzer
   */
  static displayTopMoves(topMoves) {
    if (!topMoves || topMoves.length === 0) {
      return;
    }

    console.log("\n" + COLORS.info("🎯 Top Moves:"));

    // Prepare table data
    const data = [
      [
        chalk.bold("Rank"),
        chalk.bold("Move"),
        chalk.bold("Evaluation"),
        chalk.bold("Notes"),
      ],
    ];

    for (const move of topMoves) {
      const rank = COLORS.dim(move.rank.toString());
      const moveText = COLORS.highlight(move.move);
      const evalColor =
        move.score > 0
          ? COLORS.success
          : move.score < 0
          ? COLORS.error
          : COLORS.info;
      const evaluation = evalColor(move.formattedEval);
      const notes = move.explanation ? COLORS.dim(move.explanation) : "";

      data.push([rank, moveText, evaluation, notes]);
    }

    // Configure table
    const config = {
      border: {
        topBody: "─",
        topJoin: "┬",
        topLeft: "┌",
        topRight: "┐",
        bottomBody: "─",
        bottomJoin: "┴",
        bottomLeft: "└",
        bottomRight: "┘",
        bodyLeft: "│",
        bodyRight: "│",
        bodyJoin: "│",
        joinBody: "─",
        joinLeft: "├",
        joinRight: "┤",
        joinJoin: "┼",
      },
      columns: {
        0: { alignment: "center", width: 6 },
        1: { alignment: "left", width: 10 },
        2: { alignment: "center", width: 14 },
        3: { alignment: "left", width: 30 },
      },
    };

    console.log(table(data, config));
  }

  /**
   * Display full analysis with top moves.
   * @param {Object} analysis - Analysis object
   * @param {Array} topMoves - Array of top moves
   */
  static displayFullAnalysis(analysis, topMoves) {
    // Display evaluation
    this.displayAnalysis(analysis);

    // Display top moves in table format
    if (topMoves && topMoves.length > 0) {
      this.displayTopMoves(topMoves);
    }
  }

  /**
   * Display undo confirmation.
   * @param {number} movesUndone - Number of moves undone
   */
  static undoConfirmation(movesUndone = 1) {
    console.log(
      "\n" +
        COLORS.info(
          `↩️  Undone ${movesUndone} move${movesUndone > 1 ? "s" : ""}.`
        )
    );
  }

  /**
   * Display redo confirmation.
   * @param {number} movesRedone - Number of moves redone
   */
  static redoConfirmation(movesRedone = 1) {
    console.log(
      "\n" +
        COLORS.info(
          `↪️  Redone ${movesRedone} move${movesRedone > 1 ? "s" : ""}.`
        )
    );
  }

  /**
   * Display command help.
   * @param {string} helpText - Help text to display
   */
  static displayHelp(helpText) {
    const box = this.createBox(helpText, {
      borderStyle: "round",
      padding: 1,
      margin: 1,
      borderColor: "blue",
      title: "Help",
      titleAlignment: "center",
    });
    console.log(box);
  }

  /**
   * Display a warning message.
   * @param {string} message - Warning message
   */
  static warning(message) {
    console.log(COLORS.warning(`⚠️  ${message}`));
  }

  /**
   * Display an info message.
   * @param {string} message - Info message
   */
  static info(message) {
    console.log(COLORS.info(`ℹ️  ${message}`));
  }

  /**
   * Display analyzing message.
   */
  static analyzing() {
    console.log(); // Empty line before spinner
    this.startSpinner("Analyzing position...");
  }

  /**
   * Display analysis complete message.
   */
  static analysisComplete() {
    this.succeedSpinner("Analysis complete!");
  }
}
