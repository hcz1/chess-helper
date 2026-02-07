import test from "node:test";
import assert from "node:assert/strict";

import { GameHistory } from "../src/game/GameHistory.js";

test("GameHistory undo/redo round-trips FEN history", () => {
  const h = new GameHistory();
  assert.equal(h.canUndo(), false);
  assert.equal(h.canRedo(), false);

  h.addMove({ san: "e4" }, "fen1");
  h.addMove({ san: "e5" }, "fen2");
  h.addMove({ san: "Nf3" }, "fen3");

  assert.equal(h.getMoveCount(), 3);
  assert.equal(h.canUndo(), true);

  assert.equal(h.undo(), "fen2");
  assert.equal(h.undo(), "fen1");
  assert.equal(h.undo(), null); // back to starting position
  assert.equal(h.canUndo(), false);
  assert.equal(h.canRedo(), true);

  assert.equal(h.redo(), "fen1");
  assert.equal(h.redo(), "fen2");
  assert.equal(h.redo(), "fen3");
  assert.equal(h.canRedo(), false);
});

