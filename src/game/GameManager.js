import { Chess } from "chess.js";
import { MoveValidator } from "./MoveValidator.js";
import { GameHistory } from "./GameHistory.js";

/**
 * Manages chess game state and operations.
 * Wraps Chess.js library with additional game management functionality.
 */
export class GameManager {
  /**
   * Create a new game manager.
   * @param {string} playerColor - Player's color ('w' or 'b')
   */
  constructor(playerColor) {
    this.game = new Chess();
    this.playerColor = playerColor;
    this.isPlayingWhite = playerColor === "w";
    this.myColorName = this.isPlayingWhite ? "white" : "black";
    this.opponentColorName = this.isPlayingWhite ? "black" : "white";
    this.history = new GameHistory();
    this.startingFen = this.game.fen();
  }

  /**
   * Check if it's the player's turn.
   * @returns {boolean} True if it's the player's turn
   */
  isPlayerTurn() {
    const currentTurn = this.game.turn();
    return (
      (this.isPlayingWhite && currentTurn === "w") ||
      (!this.isPlayingWhite && currentTurn === "b")
    );
  }

  /**
   * Make a move on the board.
   * @param {string} moveString - Move in various formats
   * @returns {Object} Move result object
   * @throws {Error} If move is invalid
   */
  makeMove(moveString) {
    const moveResult = MoveValidator.validateMove(this.game, moveString);
    
    // Add move to history
    this.history.addMove(moveResult, this.game.fen());
    
    return moveResult;
  }

  /**
   * Check if the game is over.
   * @returns {boolean} True if game is over
   */
  isGameOver() {
    return this.game.isGameOver();
  }

  /**
   * Get detailed reason for game over.
   * @returns {Object} Object with reason and winner information
   */
  getGameOverReason() {
    if (this.game.isCheckmate()) {
      const winner = this.game.turn() === "w" ? "black" : "white";
      return {
        reason: "checkmate",
        message: `${winner} wins by checkmate!`,
        winner,
      };
    } else if (this.game.isStalemate()) {
      return {
        reason: "stalemate",
        message: "Game ended in stalemate.",
        winner: null,
      };
    } else if (this.game.isThreefoldRepetition()) {
      return {
        reason: "threefold",
        message: "Game ended in a draw by threefold repetition.",
        winner: null,
      };
    } else if (this.game.isInsufficientMaterial()) {
      return {
        reason: "insufficient",
        message: "Game ended in a draw by insufficient material.",
        winner: null,
      };
    } else if (this.game.isDraw()) {
      return {
        reason: "draw",
        message: "Game ended in a draw.",
        winner: null,
      };
    }
    return {
      reason: "unknown",
      message: "Game over.",
      winner: null,
    };
  }

  /**
   * Get the current turn color.
   * @returns {string} 'w' for white, 'b' for black
   */
  getCurrentTurn() {
    return this.game.turn();
  }

  /**
   * Get the current position as FEN string.
   * @returns {string} FEN string of current position
   */
  getFEN() {
    return this.game.fen();
  }

  /**
   * Check if the current player is in check.
   * @returns {boolean} True if in check
   */
  isInCheck() {
    return this.game.inCheck();
  }

  /**
   * Get the player's color name.
   * @returns {string} 'white' or 'black'
   */
  getPlayerColorName() {
    return this.myColorName;
  }

  /**
   * Get the opponent's color name.
   * @returns {string} 'white' or 'black'
   */
  getOpponentColorName() {
    return this.opponentColorName;
  }

  /**
   * Undo the last move.
   * @returns {boolean} True if undo was successful
   */
  undo() {
    const previousFen = this.history.undo();
    
    if (previousFen === null) {
      // No more moves to undo, reset to starting position
      if (this.history.currentIndex === -1 && this.history.getMoveCount() > 0) {
        this.game.load(this.startingFen);
        return true;
      }
      return false;
    }
    
    this.game.load(previousFen);
    return true;
  }

  /**
   * Redo a previously undone move.
   * @returns {boolean} True if redo was successful
   */
  redo() {
    const nextFen = this.history.redo();
    
    if (nextFen === null) {
      return false;
    }
    
    this.game.load(nextFen);
    return true;
  }

  /**
   * Check if undo is available.
   * @returns {boolean} True if can undo
   */
  canUndo() {
    return this.history.canUndo();
  }

  /**
   * Check if redo is available.
   * @returns {boolean} True if can redo
   */
  canRedo() {
    return this.history.canRedo();
  }

  /**
   * Get the move history.
   * @returns {GameHistory} History object
   */
  getHistory() {
    return this.history;
  }

  /**
   * Get the last move made.
   * @returns {Object|null} Last move object or null
   */
  getLastMove() {
    return this.history.getLastMove();
  }

  /**
   * Get the chess.js game instance.
   * @returns {Chess} The underlying chess.js instance
   */
  getGame() {
    return this.game;
  }
}
