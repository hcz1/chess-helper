import { OpeningDetector } from "../analysis/OpeningDetector.js";

/**
 * Tracks opening detection transitions during game progression.
 */
export class OpeningTracker {
  /**
   * @param {OpeningDetector} detector - Opening detector
   */
  constructor(detector = new OpeningDetector()) {
    this.detector = detector;
    this.currentOpening = null;
    this.lastKnownOpening = null;
    this.lastAnnouncementKey = null;
    this.status = "unknown";
  }

  /**
   * Update tracker from current position.
   * @param {string} fen - Current full FEN
   * @param {number} ply - Current ply
   * @returns {Object} Transition event payload
   */
  update(fen, ply = OpeningDetector.getPlyFromFen(fen)) {
    const detected = this.detector.detect(fen, ply);

    let event = "unchanged";

    if (detected) {
      if (!this.currentOpening) {
        event = "detected";
      } else if (this.currentOpening.id !== detected.id) {
        event = "refined";
      }

      this.currentOpening = detected;
      this.lastKnownOpening = detected;
      this.status = "known";
    } else if (this.currentOpening) {
      this.lastKnownOpening = this.currentOpening;
      this.currentOpening = null;
      this.status = "out_of_book";
      event = "left_line";
    } else if (this.status !== "out_of_book") {
      this.status = "unknown";
    }

    if (event !== "unchanged") {
      const openingId = this.currentOpening?.id || this.lastKnownOpening?.id || "none";
      this.lastAnnouncementKey = `${event}:${openingId}:${ply}`;
    }

    return {
      event,
      status: this.status,
      opening: this.currentOpening,
      currentOpening: this.currentOpening,
      lastKnownOpening: this.lastKnownOpening,
      lastAnnouncementKey: this.lastAnnouncementKey,
      ply,
    };
  }

  /**
   * Get current opening status for command output.
   * @returns {Object} Status payload
   */
  getStatus() {
    return {
      status: this.status,
      currentOpening: this.currentOpening,
      lastKnownOpening: this.lastKnownOpening,
      lastAnnouncementKey: this.lastAnnouncementKey,
    };
  }
}
