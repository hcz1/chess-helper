import test from "node:test";
import assert from "node:assert/strict";

import { Chess } from "chess.js";
import { MoveValidator } from "../src/game/MoveValidator.js";

test("MoveValidator.validateMove applies legal moves", () => {
  const game = new Chess();
  const result = MoveValidator.validateMove(game, "e4");
  assert.equal(result.san, "e4");
  assert.equal(game.turn(), "b");
});

test("MoveValidator.validateMove rejects illegal moves", () => {
  const game = new Chess();
  assert.throws(() => MoveValidator.validateMove(game, "e5"), /Invalid move/);
});

