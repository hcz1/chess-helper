import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";

import { OpeningDetector } from "../src/analysis/OpeningDetector.js";

function playMoves(sanMoves) {
  const game = new Chess();
  for (const move of sanMoves) {
    const result = game.move(move, { sloppy: true });
    assert.ok(result, `Expected move '${move}' to be legal`);
  }
  return game;
}

test("OpeningDetector detects Queen's Gambit after d4 d5 c4", () => {
  const detector = new OpeningDetector();
  const game = playMoves(["d4", "d5", "c4"]);

  const opening = detector.detect(game.fen(), OpeningDetector.getPlyFromFen(game.fen()));

  assert.ok(opening);
  assert.equal(opening.id, "queens-gambit");
});

test("OpeningDetector detects Sicilian Defense after e4 c5", () => {
  const detector = new OpeningDetector();
  const game = playMoves(["e4", "c5"]);

  const opening = detector.detect(game.fen(), OpeningDetector.getPlyFromFen(game.fen()));

  assert.ok(opening);
  assert.equal(opening.id, "sicilian-defense");
});

test("OpeningDetector detects Italian Game after e4 e5 Nf3 Nc6 Bc4", () => {
  const detector = new OpeningDetector();
  const game = playMoves(["e4", "e5", "Nf3", "Nc6", "Bc4"]);

  const opening = detector.detect(game.fen(), OpeningDetector.getPlyFromFen(game.fen()));

  assert.ok(opening);
  assert.equal(opening.id, "italian-game");
});

test("OpeningDetector prefers specific variation over family", () => {
  const detector = new OpeningDetector();
  const game = playMoves([
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
  ]);

  const opening = detector.detect(game.fen(), OpeningDetector.getPlyFromFen(game.fen()));

  assert.ok(opening);
  assert.equal(opening.id, "sicilian-najdorf");
});

test("OpeningDetector rejects matches beyond maxPly", () => {
  const detector = new OpeningDetector([
    {
      id: "short-line",
      family: "Short Line",
      name: "Short Line",
      priority: 10,
      detectFromPly: 2,
      maxPly: 1,
      lines: [["e4", "c5"]],
    },
  ]);
  const game = playMoves(["e4", "c5"]);

  const opening = detector.detect(game.fen(), 2);

  assert.equal(opening, null);
});

test("OpeningDetector tie-break is deterministic by id", () => {
  const detector = new OpeningDetector([
    {
      id: "z-line",
      family: "Tie",
      name: "Line Z",
      priority: 10,
      detectFromPly: 1,
      maxPly: 10,
      lines: [["e4"]],
    },
    {
      id: "a-line",
      family: "Tie",
      name: "Line A",
      priority: 10,
      detectFromPly: 1,
      maxPly: 10,
      lines: [["e4"]],
    },
  ]);
  const game = playMoves(["e4"]);

  const opening = detector.detect(game.fen(), 1);

  assert.ok(opening);
  assert.equal(opening.id, "a-line");
});
