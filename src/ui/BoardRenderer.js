import chalk from 'chalk';

/**
 * Renders ASCII chess board with Unicode pieces.
 * Provides visual representation of the current game state.
 */
export class BoardRenderer {
  /**
   * Map of chess.js piece notation to Unicode symbols.
   * Uppercase = white pieces, Lowercase = black pieces
   */
  static PIECE_SYMBOLS = {
    'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟',  // White pieces (uppercase)
    'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙'   // Black pieces (lowercase)
  };

  /**
   * Material values for pieces (in pawns).
   */
  static PIECE_VALUES = {
    'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
  };

  /**
   * Render the chess board with current position.
   * @param {Object} game - Chess.js game instance
   * @param {Object} lastMove - Last move object with 'from' and 'to' properties
   * @param {'w'|'b'} orientation - Board orientation ('w' = white at bottom, 'b' = black at bottom)
   * @returns {string} Formatted board string
   */
  static renderBoard(game, lastMove = null, orientation = 'w') {
    const board = game.board();
    let output = '\n';
    
    const isBlackPerspective = orientation === 'b';
    const files = isBlackPerspective ? 'hgfedcba' : 'abcdefgh';
    const rankOrder = isBlackPerspective ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];

    // Brighter, higher-contrast highlight (selected/last-move squares).
    const HIGHLIGHT_CELL = chalk.bgHex('#ffd60a').black.bold;

    // Column labels
    output += chalk.dim(`  ${files.split('').join(' ')}`) + '\n';

    // Render ranks in the chosen orientation
    // Chess.js board array: board[0] = rank 8, board[7] = rank 1
    for (const rankNumber of rankOrder) {
      const boardRankIndex = 8 - rankNumber; // rank 8 -> 0, rank 1 -> 7
      output += chalk.dim(`${rankNumber} `);

      for (const fileLetter of files) {
        const boardFileIndex = 'abcdefgh'.indexOf(fileLetter);
        const square = board[boardRankIndex][boardFileIndex];
        const squareName = fileLetter + rankNumber;
        const isHighlighted = this.isSquareHighlighted(squareName, lastMove);

        if (square) {
          const symbol = this.getPieceSymbol(square);
          const coloredSymbol = square.color === 'w' ? chalk.white(symbol) : chalk.gray(symbol);
          output += isHighlighted ? HIGHLIGHT_CELL(symbol + ' ') : coloredSymbol + ' ';
        } else {
          const dot = '·';
          output += isHighlighted ? HIGHLIGHT_CELL(dot + ' ') : chalk.dim(dot) + ' ';
        }
      }

      output += chalk.dim(`${rankNumber}`) + '\n';
    }

    // Column labels again
    output += chalk.dim(`  ${files.split('').join(' ')}`) + '\n';
    
    return output;
  }

  /**
   * Render board with additional game information.
   * @param {Object} game - Chess.js game instance
   * @param {Object} lastMove - Last move object
   * @param {boolean} showCaptured - Whether to show captured pieces
   * @param {boolean} showMaterial - Whether to show material advantage
   * @param {'w'|'b'} orientation - Board orientation ('w' = white at bottom, 'b' = black at bottom)
   * @returns {string} Complete board display with info
   */
  static renderBoardWithInfo(
    game,
    lastMove = null,
    showCaptured = true,
    showMaterial = true,
    orientation = 'w'
  ) {
    let output = this.renderBoard(game, lastMove, orientation);
    
    if (showCaptured) {
      const captured = this.getCapturedPieces(game);
      if (captured.white.length > 0 || captured.black.length > 0) {
        output += '\n' + chalk.dim('Captured pieces:') + '\n';
        if (captured.white.length > 0) {
          output += chalk.dim('  White: ') + chalk.red(captured.white.join(' ')) + '\n';
        }
        if (captured.black.length > 0) {
          output += chalk.dim('  Black: ') + chalk.red(captured.black.join(' ')) + '\n';
        }
      }
    }
    
    if (showMaterial) {
      const advantage = this.getMaterialAdvantage(game);
      if (advantage !== 0) {
        const color = advantage > 0 ? 'White' : 'Black';
        const value = Math.abs(advantage);
        const colorFn = advantage > 0 ? chalk.green : chalk.red;
        output += '\n' + chalk.dim('Material: ') + colorFn(`${color} +${value}`) + '\n';
      }
    }
    
    return output;
  }

  /**
   * Get Unicode symbol for a piece.
   * @param {Object} piece - Chess.js piece object with type and color
   * @returns {string} Unicode chess symbol
   */
  static getPieceSymbol(piece) {
    const notation = piece.color === 'w' 
      ? piece.type.toUpperCase() 
      : piece.type.toLowerCase();
    return this.PIECE_SYMBOLS[notation] || '?';
  }

  /**
   * Convert file and rank to square name.
   * @param {number} file - File index (0-7)
   * @param {number} rank - Rank number (1-8)
   * @returns {string} Square name (e.g., 'e4')
   */
  static getSquareName(file, rank) {
    const files = 'abcdefgh';
    return files[file] + rank;
  }

  /**
   * Check if a square should be highlighted.
   * @param {string} square - Square name
   * @param {Object} lastMove - Last move object
   * @returns {boolean} True if square should be highlighted
   */
  static isSquareHighlighted(square, lastMove) {
    if (!lastMove) return false;
    return square === lastMove.from || square === lastMove.to;
  }

  /**
   * Get captured pieces for both sides.
   * @param {Object} game - Chess.js game instance
   * @returns {Object} Object with white and black captured piece arrays
   */
  static getCapturedPieces(game) {
    const startingPieces = {
      'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1, 'k': 1
    };
    
    const currentPieces = { white: {}, black: {} };
    const board = game.board();
    
    // Count current pieces
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square) {
          const color = square.color === 'w' ? 'white' : 'black';
          const type = square.type;
          currentPieces[color][type] = (currentPieces[color][type] || 0) + 1;
        }
      }
    }
    
    // Calculate captured pieces
    const captured = { white: [], black: [] };
    
    for (const [type, count] of Object.entries(startingPieces)) {
      const whiteMissing = count - (currentPieces.white[type] || 0);
      const blackMissing = count - (currentPieces.black[type] || 0);
      
      // White pieces captured by black
      for (let i = 0; i < whiteMissing; i++) {
        captured.white.push(this.PIECE_SYMBOLS[type.toUpperCase()]);
      }
      
      // Black pieces captured by white
      for (let i = 0; i < blackMissing; i++) {
        captured.black.push(this.PIECE_SYMBOLS[type.toLowerCase()]);
      }
    }
    
    return captured;
  }

  /**
   * Calculate material advantage.
   * @param {Object} game - Chess.js game instance
   * @returns {number} Material advantage (positive = white ahead, negative = black ahead)
   */
  static getMaterialAdvantage(game) {
    const board = game.board();
    let whiteMaterial = 0;
    let blackMaterial = 0;
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square) {
          const value = this.PIECE_VALUES[square.type] || 0;
          if (square.color === 'w') {
            whiteMaterial += value;
          } else {
            blackMaterial += value;
          }
        }
      }
    }
    
    return whiteMaterial - blackMaterial;
  }
}
