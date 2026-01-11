/**
 * Validates and formats chess moves.
 * Provides helper functions for move validation and error messaging.
 */
export class MoveValidator {
  /**
   * Validate and apply a move to the game.
   * @param {Chess} game - Chess.js game instance
   * @param {string} moveString - Move in various formats (e.g., "e4", "e2e4", "Nf3")
   * @returns {Object} Move result object from Chess.js
   * @throws {Error} If move is invalid
   */
  static validateMove(game, moveString) {
    try {
      // Use sloppy mode to accept various move formats
      const result = game.move(moveString, { sloppy: true });
      if (!result) {
        throw new Error("Invalid move");
      }
      return result;
    } catch (error) {
      throw new Error(`Invalid move: ${moveString}`);
    }
  }

  /**
   * Format a move result for display.
   * @param {Object} moveResult - Move result from Chess.js
   * @returns {string} Formatted move in SAN notation
   */
  static formatMove(moveResult) {
    return moveResult.san;
  }

  /**
   * Get a helpful error message for invalid moves.
   * @returns {string} Error message with examples
   */
  static getErrorMessage() {
    return "❌ Invalid move. Please try again.\n   Examples: e4, Nf3, e2e4, O-O\n";
  }
}
