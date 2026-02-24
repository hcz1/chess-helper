import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";

import { OpeningDetector } from "../src/analysis/OpeningDetector.js";
import { OpeningTracker } from "../src/game/OpeningTracker.js";

function applyMove(game, tracker, san) {
  const result = game.move(san, { sloppy: true });
  assert.ok(result, `Expected move '${san}' to be legal`);
  return tracker.update(game.fen(), OpeningDetector.getPlyFromFen(game.fen()));
}

test("OpeningTracker emits detected when moving from unknown to known", () => {
  const game = new Chess();
  const tracker = new OpeningTracker();

  tracker.update(game.fen(), OpeningDetector.getPlyFromFen(game.fen()));
  applyMove(game, tracker, "e4");
  const event = applyMove(game, tracker, "c5");

  assert.equal(event.event, "detected");
  assert.equal(event.status, "known");
  assert.equal(event.currentOpening.id, "sicilian-defense");
});

test("OpeningTracker emits refined when line becomes more specific", () => {
  const game = new Chess();
  const tracker = new OpeningTracker();

  applyMove(game, tracker, "e4");
  applyMove(game, tracker, "c5");
  applyMove(game, tracker, "Nf3");
  applyMove(game, tracker, "d6");
  applyMove(game, tracker, "d4");
  applyMove(game, tracker, "cxd4");
  const event = applyMove(game, tracker, "Nxd4");

  assert.equal(event.event, "refined");
  assert.equal(event.currentOpening.id, "sicilian-open");
});

test("OpeningTracker emits left_line when leaving mapped line", () => {
  const game = new Chess();
  const tracker = new OpeningTracker();

  applyMove(game, tracker, "e4");
  applyMove(game, tracker, "e5");
  applyMove(game, tracker, "Nf3");
  applyMove(game, tracker, "Nc6");
  applyMove(game, tracker, "Bc4");
  applyMove(game, tracker, "Nf6");

  // Deviates from the mapped Two Knights continuation (d4 ...).
  const event = applyMove(game, tracker, "d3");

  assert.equal(event.event, "left_line");
  assert.equal(event.status, "out_of_book");
  assert.equal(event.lastKnownOpening.id, "italian-two-knights");
});

test("OpeningTracker supports re-detection after undo and leaving line again", () => {
  const game = new Chess();
  const tracker = new OpeningTracker();

  const najdorfLine = [
    "e4",
    "c5",
    "Nf3",
    "d6",
    "d4",
    "cxd4",
    "Nxd4",
    "Nf6",
    "Nc3",
    "a6",
  ];

  for (const move of najdorfLine) {
    applyMove(game, tracker, move);
  }

  const left = applyMove(game, tracker, "h3");
  assert.equal(left.event, "left_line");
  assert.equal(left.status, "out_of_book");

  game.undo();
  const redetected = tracker.update(
    game.fen(),
    OpeningDetector.getPlyFromFen(game.fen())
  );
  assert.equal(redetected.event, "detected");
  assert.equal(redetected.currentOpening.id, "sicilian-najdorf");

  const leftAgain = applyMove(game, tracker, "h3");
  assert.equal(leftAgain.event, "left_line");
  assert.equal(leftAgain.status, "out_of_book");
});
