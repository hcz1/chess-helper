import { Chess } from "chess.js";
import { MoveValidator } from "./MoveValidator.js";

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
    return MoveValidator.validateMove(this.game, moveString);
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
}
