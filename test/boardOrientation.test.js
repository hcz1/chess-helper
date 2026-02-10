import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { OutputFormatter } from "../src/ui/OutputFormatter.js";

function stripAnsi(input) {
  // Good enough for Chalk output (CSI sequences).
  return input.replace(/\u001b\[[0-9;]*m/g, "");
}

test("Board renders with white at bottom by default orientation", () => {
  const game = new Chess();
  const rendered = OutputFormatter.renderSimpleBoard(game, null, false, "w");
  const lines = stripAnsi(rendered).trimEnd().split("\n");

  assert.ok(lines[0].includes("a b c d e f g h"));
  assert.ok(lines[1].startsWith("8 "));
  assert.ok(lines[8].startsWith("1 "));
  assert.ok(lines[9].includes("a b c d e f g h"));
});

test("Board renders rotated for black with correct coordinates", () => {
  const game = new Chess();
  const rendered = OutputFormatter.renderSimpleBoard(game, null, false, "b");
  const lines = stripAnsi(rendered).trimEnd().split("\n");

  assert.ok(lines[0].includes("h g f e d c b a"));
  assert.ok(lines[1].startsWith("1 "));
  assert.ok(lines[8].startsWith("8 "));
  assert.ok(lines[9].includes("h g f e d c b a"));
});

