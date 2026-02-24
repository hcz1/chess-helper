import test from "node:test";
import assert from "node:assert/strict";

import { CommandParser } from "../src/ui/CommandParser.js";

test("CommandParser recognizes opening command and alias", () => {
  assert.equal(CommandParser.isCommand("opening"), true);
  assert.equal(CommandParser.isCommand("o"), true);

  const parsedOpening = CommandParser.parseCommand("opening");
  const parsedAlias = CommandParser.parseCommand("o");

  assert.equal(parsedOpening.name, "opening");
  assert.equal(parsedAlias.name, "opening");
});

test("CommandParser help includes opening command", () => {
  const help = CommandParser.getCommandHelp();
  assert.match(help, /opening, o\s+- Show opening detection status/);
});
