import test from "node:test";
import assert from "node:assert/strict";

import { CommandLineParser } from "../src/cli/CommandLineParser.js";

test("CommandLineParser parses global options", () => {
  const p = new CommandLineParser();
  const out = p.parse([
    "node",
    "chess-helper",
    "--depth",
    "12",
    "--color",
    "white",
  ]);

  assert.equal(out.options.depth, 12);
  assert.equal(out.options.color, "w");
  assert.equal(out.isDefaultAction, true);
});

test("CommandLineParser parses analyze subcommand", () => {
  const p = new CommandLineParser();
  const out = p.parse([
    "node",
    "chess-helper",
    "analyze",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "--depth",
    "21",
    "--moves",
    "4",
  ]);

  assert.equal(out.commands.analyze.fen.startsWith("rnbqkbnr"), true);
  assert.equal(out.commands.analyze.depth, 21);
  assert.equal(out.commands.analyze.moves, 4);
  assert.equal(out.isDefaultAction, false);
});

