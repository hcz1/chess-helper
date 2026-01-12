import { Chess } from "chess.js";

/**
 * Generates rich, human-readable explanations for chess moves.
 * Uses heuristics to analyze move types, center control, development, and strategy.
 */
export class MoveExplainer {
  // Central squares that are strategically important
  static CENTER_SQUARES = ["e4", "d4", "e5", "d5"];
  static EXTENDED_CENTER = [
    "c3",
    "c4",
    "c5",
    "c6",
    "d3",
    "d6",
    "e3",
    "e6",
    "f3",
    "f4",
    "f5",
    "f6",
  ];

  // Starting squares for minor pieces by color
  static STARTING_SQUARES = {
    w: {
      n: ["b1", "g1"],
      b: ["c1", "f1"],
      r: ["a1", "h1"],
      q: ["d1"],
      k: ["e1"],
    },
    b: {
      n: ["b8", "g8"],
      b: ["c8", "f8"],
      r: ["a8", "h8"],
      q: ["d8"],
      k: ["e8"],
    },
  };

  // Knight move offsets for calculating controlled squares
  static KNIGHT_OFFSETS = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];

  // Bishop/Queen diagonal offsets
  static DIAGONAL_OFFSETS = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  // Rook/Queen straight offsets
  static STRAIGHT_OFFSETS = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  /**
   * Generate a rich explanation for a move.
   * @param {string} uciMove - Move in UCI format (e.g., "g1f3")
   * @param {Chess} game - Chess.js game instance (position before move)
   * @param {Object} score - Optional evaluation score from engine
   * @returns {Object} Explanation object with move, reasons array, and summary
   */
  static explain(uciMove, game, score = null) {
    try {
      const testGame = new Chess(game.fen());
      const move = testGame.move(uciMove, { sloppy: true });

      if (!move) {
        return { move: uciMove, reasons: [], summary: "" };
      }

      const reasons = [];
      const position = game; // Position before the move

      // Analyze various aspects of the move
      this.analyzeMoveType(move, testGame, reasons);
      this.analyzeDevelopment(move, position, reasons);
      this.analyzeCenterControl(move, reasons);
      this.analyzeKingSafety(move, position, testGame, reasons);
      this.analyzeCapture(move, reasons);
      this.analyzeTactics(move, testGame, reasons);
      this.analyzeStrategicOptions(move, position, reasons);
      this.analyzeWhatMoveAvoids(move, position, reasons);

      // Add evaluation context if available
      if (score) {
        this.analyzeEvaluation(score, reasons);
      }

      // Limit to 5 most relevant reasons
      const topReasons = reasons.slice(0, 5);

      return {
        move: move.san,
        uciMove: uciMove,
        reasons: topReasons,
        summary: topReasons.length > 0 ? topReasons[0] : "",
      };
    } catch (error) {
      return { move: uciMove, reasons: [], summary: "" };
    }
  }

  /**
   * Analyze the basic move type (castling, promotion, etc.)
   */
  static analyzeMoveType(move, gameAfter, reasons) {
    // Castling
    if (move.flags.includes("k")) {
      reasons.push("Castles kingside for king safety");
    } else if (move.flags.includes("q")) {
      reasons.push("Castles queenside, connecting the rooks");
    }

    // Promotion
    if (move.promotion) {
      const pieceName = this.getPieceName(move.promotion);
      reasons.push(`Promotes pawn to ${pieceName}`);
    }

    // Check
    if (gameAfter.inCheck()) {
      if (gameAfter.isCheckmate()) {
        reasons.unshift("Delivers checkmate!");
      } else {
        reasons.push("Gives check, forcing a response");
      }
    }
  }

  /**
   * Analyze if this is a developing move.
   */
  static analyzeDevelopment(move, position, reasons) {
    const piece = move.piece;
    const from = move.from;
    const to = move.to;
    const color = move.color;

    // Check if piece is moving from starting square
    const startingSquares = this.STARTING_SQUARES[color][piece];
    if (startingSquares && startingSquares.includes(from)) {
      const pieceName = this.getPieceName(piece);

      // Check if it's going to an active square
      if (piece === "n") {
        if (
          this.CENTER_SQUARES.includes(to) ||
          this.EXTENDED_CENTER.includes(to)
        ) {
          reasons.push(`Develops ${pieceName} to an active central square`);
        } else {
          reasons.push(`Develops ${pieceName} toward the center`);
        }
      } else if (piece === "b") {
        // Bishops are good on long diagonals
        const controlledSquares = this.getControlledSquares("b", to);
        const centerControl = controlledSquares.filter((sq) =>
          this.CENTER_SQUARES.includes(sq)
        );
        if (centerControl.length > 0) {
          reasons.push(`Develops ${pieceName}, controlling central squares`);
        } else {
          reasons.push(`Develops ${pieceName} to an active diagonal`);
        }
      }
    }

    // Check if rooks are being connected or activated
    if (piece === "r") {
      const rank = to[1];
      if ((color === "w" && rank === "7") || (color === "b" && rank === "2")) {
        reasons.push("Places rook on the 7th rank (powerful position)");
      }
      // Check for open file
      if (this.isOpenFile(to, position)) {
        reasons.push("Places rook on an open file");
      }
    }
  }

  /**
   * Analyze center control implications of the move.
   */
  static analyzeCenterControl(move, reasons) {
    const to = move.to;
    const piece = move.piece;

    // Get squares controlled by the piece after the move
    const controlledSquares = this.getControlledSquares(piece, to);
    const centerControl = controlledSquares.filter((sq) =>
      this.CENTER_SQUARES.includes(sq)
    );
    const extendedControl = controlledSquares.filter((sq) =>
      this.EXTENDED_CENTER.includes(sq)
    );

    // Pawn moves to center
    if (piece === "p" && this.CENTER_SQUARES.includes(to)) {
      reasons.push("Occupies the center with a pawn");
    }

    // Knight/Bishop controlling center
    if ((piece === "n" || piece === "b") && centerControl.length >= 2) {
      const squares = centerControl.join(", ");
      reasons.push(`Controls the center (${squares})`);
    } else if ((piece === "n" || piece === "b") && centerControl.length === 1) {
      reasons.push(`Controls central square ${centerControl[0]}`);
    }

    // Piece moves to center
    if (piece !== "p" && this.CENTER_SQUARES.includes(to)) {
      reasons.push("Centralizes the piece for maximum activity");
    }
  }

  /**
   * Analyze king safety implications.
   */
  static analyzeKingSafety(move, positionBefore, positionAfter, reasons) {
    // Already handled castling in analyzeMoveType
    if (move.flags.includes("k") || move.flags.includes("q")) {
      return;
    }

    // Check if move involves the king
    if (move.piece === "k") {
      // Moving king before castling is often bad in opening
      const moveNumber = Math.floor(positionBefore.moveNumber() || 1);
      if (
        moveNumber < 10 &&
        !move.flags.includes("k") &&
        !move.flags.includes("q")
      ) {
        // This is often not ideal but might be necessary
      }
    }
  }

  /**
   * Analyze captures.
   */
  static analyzeCapture(move, reasons) {
    if (move.captured) {
      const capturedPiece = this.getPieceName(move.captured);
      const movingPiece = this.getPieceName(move.piece);

      // Check if it's winning material
      const capturedValue = this.getPieceValue(move.captured);
      const movingValue = this.getPieceValue(move.piece);

      if (capturedValue > movingValue) {
        reasons.push(`Wins material by capturing the ${capturedPiece}`);
      } else if (capturedValue === movingValue) {
        reasons.push(`Trades ${movingPiece} for ${capturedPiece}`);
      } else {
        reasons.push(`Captures ${capturedPiece}`);
      }
    }
  }

  /**
   * Analyze tactical elements (forks, pins, etc.)
   */
  static analyzeTactics(move, gameAfter, reasons) {
    const to = move.to;
    const piece = move.piece;

    // Knight fork detection
    if (piece === "n") {
      const controlledSquares = this.getControlledSquares("n", to);
      const attackedPieces = [];

      for (const sq of controlledSquares) {
        const targetPiece = gameAfter.get(sq);
        if (targetPiece && targetPiece.color !== move.color) {
          if (
            targetPiece.type === "k" ||
            targetPiece.type === "q" ||
            targetPiece.type === "r"
          ) {
            attackedPieces.push(this.getPieceName(targetPiece.type));
          }
        }
      }

      if (attackedPieces.length >= 2) {
        reasons.push(`Forks the ${attackedPieces.join(" and ")}`);
      }
    }
  }

  /**
   * Analyze strategic options the move opens up.
   */
  static analyzeStrategicOptions(move, position, reasons) {
    const piece = move.piece;
    const to = move.to;
    const color = move.color;

    // Pawn moves that open lines for pieces
    if (piece === "p") {
      const file = to[0];
      const rank = parseInt(to[1]);

      // Central pawn moves often allow piece development
      if (file === "e" || file === "d") {
        if ((color === "w" && rank === 4) || (color === "b" && rank === 5)) {
          reasons.push("Opens lines for piece development");
        }
      }

      // Pawn moves that prepare castling
      if (
        file === "g" &&
        ((color === "w" && rank === 3) || (color === "b" && rank === 6))
      ) {
        reasons.push("Prepares fianchetto of the bishop");
      }
    }

    // Knight on f3/c3 or f6/c6 keeps options
    if (piece === "n") {
      if (
        (color === "w" && (to === "f3" || to === "c3")) ||
        (color === "b" && (to === "f6" || to === "c6"))
      ) {
        reasons.push("Keeps options open for pawn advances");
      }
    }
  }

  /**
   * Analyze what common mistakes this move avoids.
   */
  static analyzeWhatMoveAvoids(move, position, reasons) {
    const piece = move.piece;
    const color = move.color;
    const moveNumber = Math.floor(position.moveNumber() || 1);

    // In the opening, certain principles apply
    if (moveNumber <= 10) {
      // Developing minor pieces before queen is good
      if ((piece === "n" || piece === "b") && moveNumber <= 6) {
        // Check if queen hasn't moved yet
        const queenSquare = color === "w" ? "d1" : "d8";
        const queenOnStart = position.get(queenSquare);
        if (queenOnStart && queenOnStart.type === "q") {
          reasons.push("Develops before bringing out the queen early");
        }
      }
    }
  }

  /**
   * Add context based on evaluation.
   */
  static analyzeEvaluation(score, reasons) {
    if (!score) return;

    if (score.type === "mate") {
      if (score.value > 0 && score.value <= 5) {
        reasons.unshift(`Forces mate in ${score.value}`);
      }
    } else if (score.type === "cp") {
      const pawns = Math.abs(score.value) / 100;
      if (pawns >= 3) {
        reasons.push("Maintains a winning advantage");
      } else if (pawns >= 1.5) {
        reasons.push("Keeps a clear advantage");
      }
    }
  }

  /**
   * Get squares controlled by a piece from a given position.
   */
  static getControlledSquares(pieceType, square) {
    const file = square.charCodeAt(0) - 97; // 0-7
    const rank = parseInt(square[1]) - 1; // 0-7
    const squares = [];

    const addSquare = (f, r) => {
      if (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
        squares.push(String.fromCharCode(97 + f) + (r + 1));
      }
    };

    switch (pieceType) {
      case "n":
        for (const [df, dr] of this.KNIGHT_OFFSETS) {
          addSquare(file + df, rank + dr);
        }
        break;
      case "b":
        for (const [df, dr] of this.DIAGONAL_OFFSETS) {
          for (let i = 1; i <= 7; i++) {
            addSquare(file + df * i, rank + dr * i);
          }
        }
        break;
      case "r":
        for (const [df, dr] of this.STRAIGHT_OFFSETS) {
          for (let i = 1; i <= 7; i++) {
            addSquare(file + df * i, rank + dr * i);
          }
        }
        break;
      case "q":
        for (const [df, dr] of [
          ...this.DIAGONAL_OFFSETS,
          ...this.STRAIGHT_OFFSETS,
        ]) {
          for (let i = 1; i <= 7; i++) {
            addSquare(file + df * i, rank + dr * i);
          }
        }
        break;
      case "k":
        for (const [df, dr] of [
          ...this.DIAGONAL_OFFSETS,
          ...this.STRAIGHT_OFFSETS,
        ]) {
          addSquare(file + df, rank + dr);
        }
        break;
      case "p":
        // Pawns control diagonally (simplified - assumes white)
        addSquare(file - 1, rank + 1);
        addSquare(file + 1, rank + 1);
        addSquare(file - 1, rank - 1);
        addSquare(file + 1, rank - 1);
        break;
    }

    return squares;
  }

  /**
   * Check if a file is open (no pawns on it).
   */
  static isOpenFile(square, game) {
    const file = square[0];
    for (let rank = 1; rank <= 8; rank++) {
      const sq = file + rank;
      const piece = game.get(sq);
      if (piece && piece.type === "p") {
        return false;
      }
    }
    return true;
  }

  /**
   * Get human-readable piece name.
   */
  static getPieceName(piece) {
    const names = {
      p: "pawn",
      n: "knight",
      b: "bishop",
      r: "rook",
      q: "queen",
      k: "king",
    };
    return names[piece.toLowerCase()] || "piece";
  }

  /**
   * Get piece value for material calculations.
   */
  static getPieceValue(piece) {
    const values = {
      p: 1,
      n: 3,
      b: 3,
      r: 5,
      q: 9,
      k: 0,
    };
    return values[piece.toLowerCase()] || 0;
  }
}
