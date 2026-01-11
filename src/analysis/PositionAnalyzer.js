import { Chess } from "chess.js";

/**
 * Analyzes chess positions and provides detailed evaluation information.
 * Works with StockfishEngine to provide move suggestions and explanations.
 */
export class PositionAnalyzer {
  /**
   * Analyze a position and get detailed evaluation.
   * @param {StockfishEngine} engine - Stockfish engine instance
   * @param {string} fen - FEN string of position to analyze
   * @param {number} [depth=15] - Analysis depth
   * @returns {Promise<Object>} Analysis result with evaluation and assessment
   */
  static async analyzePosition(engine, fen, depth = 15) {
    try {
      const analysis = await engine.getAnalysis(fen, 1, depth);
      
      return {
        bestMove: analysis.bestMove,
        evaluation: analysis.evaluation,
        formattedEval: this.formatEvaluation(analysis.evaluation),
        assessment: this.getPositionAssessment(analysis.evaluation),
        depth: analysis.depth
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Get top N moves with evaluations.
   * @param {StockfishEngine} engine - Stockfish engine instance
   * @param {string} fen - FEN string of position
   * @param {number} [numMoves=3] - Number of top moves to get
   * @param {number} [depth=15] - Analysis depth
   * @returns {Promise<Array>} Array of moves with evaluations
   */
  static async getTopMoves(engine, fen, numMoves = 3, depth = 15) {
    try {
      const analysis = await engine.getAnalysis(fen, numMoves, depth);
      
      // Create a temporary game to convert UCI moves to SAN
      const game = new Chess(fen);
      
      return analysis.moves.map((move, index) => {
        // Try to convert UCI move to SAN
        let sanMove = move.move;
        try {
          const tempGame = new Chess(fen);
          const result = tempGame.move(move.move, { sloppy: true });
          if (result) {
            sanMove = result.san;
          }
        } catch (e) {
          // Keep UCI format if conversion fails
        }
        
        return {
          rank: index + 1,
          move: sanMove,
          uciMove: move.move,
          evaluation: move.score,
          formattedEval: this.formatEvaluation(move.score),
          explanation: this.explainMove(move.move, game)
        };
      });
    } catch (error) {
      throw new Error(`Failed to get top moves: ${error.message}`);
    }
  }

  /**
   * Format evaluation score for display.
   * @param {Object} score - Score object with type and value
   * @returns {string} Formatted evaluation string
   */
  static formatEvaluation(score) {
    if (!score) {
      return "0.00";
    }

    if (score.type === "mate") {
      const mateIn = score.value;
      return mateIn > 0 ? `Mate in ${mateIn}` : `Mated in ${Math.abs(mateIn)}`;
    }

    // Convert centipawns to pawns
    const pawns = score.value / 100;
    const sign = pawns >= 0 ? "+" : "";
    return `${sign}${pawns.toFixed(2)}`;
  }

  /**
   * Get a textual assessment of the position.
   * @param {Object} score - Score object with type and value
   * @returns {string} Position assessment
   */
  static getPositionAssessment(score) {
    if (!score) {
      return "Equal position";
    }

    if (score.type === "mate") {
      return score.value > 0 
        ? "White has a forced mate" 
        : "Black has a forced mate";
    }

    const centipawns = score.value;

    if (centipawns > 300) {
      return "White is winning";
    } else if (centipawns > 150) {
      return "White is much better";
    } else if (centipawns > 50) {
      return "White is slightly better";
    } else if (centipawns > -50) {
      return "Equal position";
    } else if (centipawns > -150) {
      return "Black is slightly better";
    } else if (centipawns > -300) {
      return "Black is much better";
    } else {
      return "Black is winning";
    }
  }

  /**
   * Provide a basic explanation for a move.
   * @param {string} uciMove - Move in UCI format (e.g., "e2e4")
   * @param {Chess} game - Chess.js game instance
   * @returns {string} Move explanation
   */
  static explainMove(uciMove, game) {
    try {
      // Create a copy to test the move
      const testGame = new Chess(game.fen());
      const move = testGame.move(uciMove, { sloppy: true });
      
      if (!move) {
        return "";
      }

      const explanations = [];

      // Check if it's a capture
      if (move.captured) {
        explanations.push(`Captures ${this.getPieceName(move.captured)}`);
      }

      // Check if it gives check
      if (testGame.inCheck()) {
        explanations.push("Check");
      }

      // Check if it's checkmate
      if (testGame.isCheckmate()) {
        explanations.push("Checkmate!");
      }

      // Check if it's castling
      if (move.flags.includes('k')) {
        explanations.push("Kingside castling");
      } else if (move.flags.includes('q')) {
        explanations.push("Queenside castling");
      }

      // Check if it's a promotion
      if (move.promotion) {
        explanations.push(`Promotes to ${this.getPieceName(move.promotion)}`);
      }

      // Generic explanations based on piece type
      if (explanations.length === 0) {
        explanations.push(this.getGenericExplanation(move));
      }

      return explanations.join(", ");
    } catch (error) {
      return "";
    }
  }

  /**
   * Get a generic explanation based on piece type and move.
   * @param {Object} move - Chess.js move object
   * @returns {string} Generic explanation
   * @private
   */
  static getGenericExplanation(move) {
    const piece = move.piece;
    
    switch (piece) {
      case 'p':
        return "Advances pawn";
      case 'n':
        return "Develops knight";
      case 'b':
        return "Develops bishop";
      case 'r':
        return "Activates rook";
      case 'q':
        return "Activates queen";
      case 'k':
        return "Moves king";
      default:
        return "Moves piece";
    }
  }

  /**
   * Get human-readable piece name.
   * @param {string} piece - Piece type (p, n, b, r, q, k)
   * @returns {string} Piece name
   * @private
   */
  static getPieceName(piece) {
    const names = {
      'p': 'pawn',
      'n': 'knight',
      'b': 'bishop',
      'r': 'rook',
      'q': 'queen',
      'k': 'king'
    };
    return names[piece.toLowerCase()] || 'piece';
  }
}
