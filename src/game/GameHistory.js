import { table } from 'table';
import chalk from 'chalk';

/**
 * Tracks game move history and provides undo/redo functionality.
 * Stores moves with their corresponding FEN positions for navigation.
 */
export class GameHistory {
  constructor() {
    this.moves = []; // Array of move objects
    this.fens = []; // Array of FEN strings corresponding to positions
    this.currentIndex = -1; // Current position in history (-1 = starting position)
  }

  /**
   * Add a move to the history.
   * @param {Object} move - Chess.js move object with san, from, to, etc.
   * @param {string} fen - FEN string after the move
   */
  addMove(move, fen) {
    // If we're not at the end of history, remove future moves
    if (this.currentIndex < this.moves.length - 1) {
      this.moves = this.moves.slice(0, this.currentIndex + 1);
      this.fens = this.fens.slice(0, this.currentIndex + 1);
    }
    
    this.moves.push(move);
    this.fens.push(fen);
    this.currentIndex++;
  }

  /**
   * Undo the last move.
   * @returns {string|null} FEN string of previous position, or null if can't undo
   */
  undo() {
    if (!this.canUndo()) {
      return null;
    }
    
    this.currentIndex--;
    
    // Return the FEN of the previous position
    // If currentIndex is -1, return null (caller should reset to starting position)
    return this.currentIndex >= 0 ? this.fens[this.currentIndex] : null;
  }

  /**
   * Redo a previously undone move.
   * @returns {string|null} FEN string after redo, or null if can't redo
   */
  redo() {
    if (!this.canRedo()) {
      return null;
    }
    
    this.currentIndex++;
    return this.fens[this.currentIndex];
  }

  /**
   * Check if undo is possible.
   * @returns {boolean} True if can undo
   */
  canUndo() {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible.
   * @returns {boolean} True if can redo
   */
  canRedo() {
    return this.currentIndex < this.moves.length - 1;
  }

  /**
   * Get the move history formatted for display.
   * @returns {Array} Array of move pairs with move numbers
   */
  getMoveHistory() {
    const history = [];
    
    for (let i = 0; i < this.moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = this.moves[i];
      const blackMove = this.moves[i + 1];
      
      history.push({
        number: moveNumber,
        white: whiteMove ? whiteMove.san : '',
        black: blackMove ? blackMove.san : '',
        isCurrentWhite: i === this.currentIndex,
        isCurrentBlack: i + 1 === this.currentIndex
      });
    }
    
    return history;
  }

  /**
   * Get formatted move history as a string.
   * @returns {string} Formatted move history
   */
  getFormattedHistory() {
    const history = this.getMoveHistory();
    
    if (history.length === 0) {
      return 'No moves yet.';
    }
    
    // Prepare table data
    const data = [
      [chalk.bold('Move #'), chalk.bold('White'), chalk.bold('Black')]
    ];
    
    for (const entry of history) {
      const moveNum = chalk.dim(entry.number.toString());
      const whiteMove = entry.white 
        ? (entry.isCurrentWhite ? chalk.cyan.bold('► ' + entry.white) : entry.white)
        : '';
      const blackMove = entry.black 
        ? (entry.isCurrentBlack ? chalk.cyan.bold('► ' + entry.black) : entry.black)
        : '';
      
      data.push([moveNum, whiteMove, blackMove]);
    }
    
    // Configure table
    const config = {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼'
      },
      columns: {
        0: { alignment: 'right', width: 8 },
        1: { alignment: 'left', width: 12 },
        2: { alignment: 'left', width: 12 }
      }
    };
    
    return 'Move History:\n' + table(data, config);
  }

  /**
   * Get all moves in SAN notation.
   * @returns {Array<string>} Array of moves in SAN notation
   */
  getAllMoves() {
    return this.moves.map(move => move.san);
  }

  /**
   * Get the last move.
   * @returns {Object|null} Last move object or null if no moves
   */
  getLastMove() {
    if (this.currentIndex >= 0 && this.currentIndex < this.moves.length) {
      return this.moves[this.currentIndex];
    }
    return null;
  }

  /**
   * Export game to PGN format.
   * @param {Object} metadata - Game metadata (White, Black, Event, etc.)
   * @returns {string} PGN formatted string
   */
  toPGN(metadata = {}) {
    let pgn = '';
    
    // Add metadata tags
    const defaultMetadata = {
      Event: '?',
      Site: '?',
      Date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      Round: '?',
      White: '?',
      Black: '?',
      Result: '*'
    };
    
    const meta = { ...defaultMetadata, ...metadata };
    
    for (const [key, value] of Object.entries(meta)) {
      pgn += `[${key} "${value}"]\n`;
    }
    
    pgn += '\n';
    
    // Add moves
    const history = this.getMoveHistory();
    for (const entry of history) {
      pgn += `${entry.number}. ${entry.white}`;
      if (entry.black) {
        pgn += ` ${entry.black} `;
      }
    }
    
    pgn += meta.Result;
    
    return pgn;
  }

  /**
   * Clear all history.
   */
  clear() {
    this.moves = [];
    this.fens = [];
    this.currentIndex = -1;
  }

  /**
   * Get the total number of moves.
   * @returns {number} Total move count
   */
  getMoveCount() {
    return this.moves.length;
  }

  /**
   * Check if history is empty.
   * @returns {boolean} True if no moves in history
   */
  isEmpty() {
    return this.moves.length === 0;
  }
}
