/**
 * Formats and displays output to the console.
 * Provides consistent messaging and formatting throughout the application.
 */
export class OutputFormatter {
  /**
   * Display welcome message.
   */
  static welcome() {
    console.log("\n♟ Chess Move Helper\n");
  }

  /**
   * Display engine initialization message.
   */
  static initializing() {
    console.log("⏳ Initializing chess engine...");
  }

  /**
   * Display engine ready message.
   */
  static engineReady() {
    console.log("✅ Engine ready!\n");
  }

  /**
   * Display game start message.
   * @param {string} playerColor - Player's color name ('white' or 'black')
   */
  static gameStart(playerColor) {
    console.log(`\nYou are playing as ${playerColor}. Enter 'quit' to exit.\n`);
  }

  /**
   * Display a move made by a player.
   * @param {string} colorName - Color name ('white' or 'black')
   * @param {string} move - Move in SAN notation
   * @param {boolean} isPlayer - Whether this is the player's move
   */
  static move(colorName, move, isPlayer = false) {
    if (isPlayer) {
      console.log(`You (${colorName}): ${move}`);
    } else {
      console.log(`${colorName}: ${move}\n`);
    }
  }

  /**
   * Display invalid move error.
   */
  static invalidMove() {
    console.log("❌ Invalid move. Please try again.");
    console.log("   Examples: e4, Nf3, e2e4, O-O\n");
  }

  /**
   * Display game over message.
   * @param {Object} gameOverInfo - Game over information
   */
  static gameOver(gameOverInfo) {
    console.log("\n🎮 Game Over!");
    console.log(gameOverInfo.message);
  }

  /**
   * Display check warning.
   */
  static checkWarning() {
    console.log("⚠️  You are in check!\n");
  }

  /**
   * Display goodbye message.
   */
  static goodbye() {
    console.log("\n👋 Thanks for playing!");
  }

  /**
   * Display an error message.
   * @param {string} message - Error message to display
   */
  static error(message) {
    console.error(`\n❌ Fatal error: ${message}`);
  }

  /**
   * Display a warning when move suggestion fails.
   * @param {string} errorMessage - Error message
   */
  static suggestionWarning(errorMessage) {
    console.error(`⚠️  Failed to get move suggestion: ${errorMessage}`);
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
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };

    const board = game.board();
    let output = '  a b c d e f g h\n';
    
    for (let rank = 7; rank >= 0; rank--) {
      output += `${rank + 1} `;
      
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        const squareName = 'abcdefgh'[file] + (rank + 1);
        const isHighlighted = lastMove && (squareName === lastMove.from || squareName === lastMove.to);
        
        if (square) {
          const notation = square.color === 'w' ? square.type.toUpperCase() : square.type.toLowerCase();
          const symbol = PIECE_SYMBOLS[notation] || '?';
          output += isHighlighted ? `[${symbol}]` : `${symbol} `;
        } else {
          output += isHighlighted ? '[·]' : '· ';
        }
      }
      
      output += `${rank + 1}\n`;
    }
    
    output += '  a b c d e f g h\n';
    return output;
  }

  /**
   * Display move history.
   * @param {GameHistory} history - Game history object
   */
  static displayHistory(history) {
    console.log('\n' + history.getFormattedHistory());
  }

  /**
   * Display position analysis.
   * @param {Object} analysis - Analysis object from PositionAnalyzer
   */
  static displayAnalysis(analysis) {
    console.log(`\n📊 Evaluation: ${analysis.formattedEval} (${analysis.assessment})`);
  }

  /**
   * Display top moves with evaluations.
   * @param {Array} topMoves - Array of top moves from PositionAnalyzer
   */
  static displayTopMoves(topMoves) {
    if (!topMoves || topMoves.length === 0) {
      return;
    }

    console.log('\n🎯 Top Moves:');
    for (const move of topMoves) {
      const explanation = move.explanation ? ` - ${move.explanation}` : '';
      console.log(`  ${move.rank}. ${move.move} (${move.formattedEval})${explanation}`);
    }
  }

  /**
   * Display full analysis with top moves.
   * @param {Object} analysis - Analysis object
   * @param {Array} topMoves - Array of top moves
   */
  static displayFullAnalysis(analysis, topMoves) {
    this.displayAnalysis(analysis);
    if (topMoves && topMoves.length > 0) {
      this.displayTopMoves(topMoves);
    }
  }

  /**
   * Display undo confirmation.
   * @param {number} movesUndone - Number of moves undone
   */
  static undoConfirmation(movesUndone = 1) {
    console.log(`\n↩️  Undone ${movesUndone} move${movesUndone > 1 ? 's' : ''}.`);
  }

  /**
   * Display redo confirmation.
   * @param {number} movesRedone - Number of moves redone
   */
  static redoConfirmation(movesRedone = 1) {
    console.log(`\n↪️  Redone ${movesRedone} move${movesRedone > 1 ? 's' : ''}.`);
  }

  /**
   * Display command help.
   * @param {string} helpText - Help text to display
   */
  static displayHelp(helpText) {
    console.log(helpText);
  }

  /**
   * Display a warning message.
   * @param {string} message - Warning message
   */
  static warning(message) {
    console.log(`⚠️  ${message}`);
  }

  /**
   * Display an info message.
   * @param {string} message - Info message
   */
  static info(message) {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Display analyzing message.
   */
  static analyzing() {
    console.log('\n🔍 Analyzing position...');
  }
}
