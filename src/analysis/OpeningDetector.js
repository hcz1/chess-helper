import { Chess } from "chess.js";
import { OPENING_CATALOG } from "./openings/openingCatalog.js";

/**
 * Detects named openings from position signatures.
 */
export class OpeningDetector {
  /**
   * @param {Array<Object>} catalog - Opening catalog entries
   */
  constructor(catalog = OPENING_CATALOG) {
    this.catalog = catalog;
    this.lookup = this.compileCatalog(catalog);
  }

  /**
   * Normalize a FEN into a stable opening key.
   * @param {string} fen - Full FEN
   * @returns {string} piecePlacement|turn|castling
   */
  normalizeFenKey(fen) {
    const [piecePlacement, turn, castling] = (fen || "").trim().split(/\s+/);
    if (!piecePlacement || !turn || !castling) {
      return "";
    }
    return `${piecePlacement}|${turn}|${castling}`;
  }

  /**
   * Build a lookup from normalized FEN keys to candidate openings.
   * Candidates are stored for line prefixes so we can stay in-book as lines progress.
   * @param {Array<Object>} catalog - Opening catalog entries
   * @returns {Map<string, Array<Object>>} Lookup map
   */
  compileCatalog(catalog) {
    const lookup = new Map();

    for (const entry of catalog) {
      const lines = Array.isArray(entry.lines) ? entry.lines : [];
      for (const line of lines) {
        const game = new Chess();

        for (let i = 0; i < line.length; i++) {
          const sanMove = line[i];
          const result = game.move(sanMove, { sloppy: true });

          if (!result) {
            throw new Error(
              `Invalid catalog move '${sanMove}' in '${entry.id}' at ply ${i + 1}`
            );
          }

          const matchedPly = i + 1;
          const key = this.normalizeFenKey(game.fen());
          if (!key) {
            continue;
          }

          const candidate = {
            id: entry.id,
            family: entry.family,
            name: entry.name,
            eco: entry.eco ?? null,
            priority: entry.priority ?? 0,
            maxPly: entry.maxPly ?? line.length,
            detectFromPly: entry.detectFromPly ?? line.length,
            matchedPly,
          };

          const candidates = lookup.get(key) || [];

          // Avoid duplicate candidates from overlapping lines.
          const duplicate = candidates.some(
            (c) => c.id === candidate.id && c.matchedPly === candidate.matchedPly
          );
          if (!duplicate) {
            candidates.push(candidate);
            lookup.set(key, candidates);
          }
        }
      }
    }

    return lookup;
  }

  /**
   * Compute ply from FEN fullmove and side-to-move.
   * @param {string} fen - Full FEN
   * @returns {number} Ply count from game start
   */
  static getPlyFromFen(fen) {
    const parts = (fen || "").trim().split(/\s+/);
    const turn = parts[1];
    const fullmoveRaw = parts[5];
    const fullmove = Number.parseInt(fullmoveRaw, 10);

    if (!turn || Number.isNaN(fullmove) || fullmove < 1) {
      return 0;
    }

    return turn === "b" ? (fullmove - 1) * 2 + 1 : (fullmove - 1) * 2;
  }

  /**
   * Get all opening candidates for the current position and ply.
   * @param {string} fen - Full FEN
   * @param {number} ply - Current ply
   * @returns {Array<Object>} Matching candidates
   */
  getCandidates(fen, ply = OpeningDetector.getPlyFromFen(fen)) {
    const key = this.normalizeFenKey(fen);
    if (!key) {
      return [];
    }

    const candidates = this.lookup.get(key) || [];

    return candidates.filter(
      (candidate) =>
        ply === candidate.matchedPly &&
        ply >= candidate.detectFromPly &&
        ply <= candidate.maxPly
    );
  }

  /**
   * Detect best matching opening for a position.
   * @param {string} fen - Full FEN
   * @param {number} ply - Current ply
   * @returns {Object|null} Best opening match or null
   */
  detect(fen, ply = OpeningDetector.getPlyFromFen(fen)) {
    const candidates = this.getCandidates(fen, ply);
    if (candidates.length === 0) {
      return null;
    }

    const sorted = [...candidates].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      if (b.matchedPly !== a.matchedPly) {
        return b.matchedPly - a.matchedPly;
      }
      return a.id.localeCompare(b.id);
    });

    return sorted[0];
  }
}
