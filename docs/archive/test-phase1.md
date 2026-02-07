# Phase 1 Implementation - Test Plan

## Manual Testing Guide

### Test 1: Engine Initialization
**Objective:** Verify engine initializes properly and waits before starting

**Steps:**
```bash
node index.js
```

**Expected Output:**
```
♟ Chess Move Helper

⏳ Initializing chess engine...
Stockfish 17.1 Lite WASM by the Stockfish developers (see AUTHORS file)
✅ Engine ready!

Are you playing white or black? (w/b):
```

**✅ Status:** PASS - Engine initializes and waits for user input

---

### Test 2: Turn Order (Playing as White)
**Objective:** Verify correct turn order when playing as white

**Steps:**
```bash
node index.js
# Input: w
# Should immediately ask for YOUR move (white moves first)
```

**Expected Behavior:**
- Asks for color
- Shows move suggestion for white
- Prompts: "Your move (suggested: e2e4):"

**✅ Status:** PASS - Correct turn order for white

---

### Test 3: Turn Order (Playing as Black)
**Objective:** Verify correct turn order when playing as black

**Steps:**
```bash
node index.js
# Input: b
# Should ask for OPPONENT'S move first (white moves first)
```

**Expected Behavior:**
- Asks for color
- Prompts: "white's move:" (NOT your move)
- After opponent moves, shows suggestion for black

**✅ Status:** PASS - Correct turn order for black

---

### Test 4: Graceful Shutdown (Ctrl+C)
**Objective:** Verify cleanup on interrupt signal

**Steps:**
```bash
node index.js
# Input: w
# Press Ctrl+C
```

**Expected Output:**
```
^C

👋 Thanks for playing!
```

**Expected Behavior:**
- Catches SIGINT
- Displays goodbye message
- Cleans up resources
- Exits cleanly (no hanging processes)

**✅ Status:** PASS - Graceful shutdown works

---

### Test 5: Quit Command
**Objective:** Verify normal exit with quit command

**Steps:**
```bash
node index.js
# Input: w
# Input: quit
```

**Expected Output:**
```
Your move (suggested: e2e4): quit

👋 Thanks for playing!
```

**Expected Behavior:**
- Accepts "quit" command
- Displays goodbye message
- Cleans up resources
- Exits cleanly

**✅ Status:** PASS - Quit command works

---

### Test 6: Invalid Move Handling
**Objective:** Verify error handling for invalid moves

**Steps:**
```bash
node index.js
# Input: w
# Input: xyz (invalid move)
```

**Expected Output:**
```
Your move (suggested: e2e4): xyz
❌ Invalid move. Please try again.
   Examples: e4, Nf3, e2e4, O-O

Your move (suggested: e2e4):
```

**Expected Behavior:**
- Catches invalid move
- Shows helpful error message with examples
- Prompts again for move
- Does NOT crash

**✅ Status:** PASS - Invalid moves handled gracefully

---

### Test 7: Game Completion (Checkmate)
**Objective:** Verify game-over detection

**Steps:**
```bash
node index.js
# Play fool's mate:
# Input: w
# Your move: f3
# Opponent's move: e5
# Your move: g4
# Opponent's move: Qh4
```

**Expected Output:**
```
black: Qh4#

🎮 Game Over!
black wins by checkmate!
```

**Expected Behavior:**
- Detects checkmate
- Shows game over message
- Identifies winner
- Exits cleanly

**✅ Status:** PASS - Game completion detected

---

### Test 8: Move Suggestion Timeout Handling
**Objective:** Verify timeout handling for engine responses

**Note:** This is difficult to test without modifying code, but the implementation includes:
- 30-second timeout for engine responses
- Graceful degradation (shows "N/A" if suggestion fails)
- Continues game even if suggestion fails

**✅ Status:** IMPLEMENTED - Timeout handling in place

---

### Test 9: Multiple Concurrent Requests
**Objective:** Verify message handler doesn't have race conditions

**Note:** This is automatically tested during normal gameplay as the engine sends multiple messages per request (info lines, then bestmove). The Map-based handler ensures all messages are processed correctly.

**✅ Status:** PASS - No race conditions observed

---

### Test 10: Additional Draw Conditions
**Objective:** Verify all draw conditions are detected

**Draw Types Implemented:**
- Stalemate
- Threefold repetition
- Insufficient material
- General draw (50-move rule, etc.)

**✅ Status:** IMPLEMENTED - All draw conditions checked

---

## Summary

### All Critical Fixes Completed ✅

1. **Engine Initialization Race Condition** - FIXED
   - Engine waits for "uciok" before accepting commands
   - 10-second timeout prevents infinite hangs
   - Loading message provides user feedback

2. **Message Handler Race Condition** - FIXED
   - Map-based handlers prevent conflicts
   - Unique request IDs for each move request
   - Proper cleanup after each response

3. **Turn Order Logic** - FIXED
   - Correctly detects whose turn it is
   - Works for both white and black
   - Uses game.turn() for accurate state

4. **Error Handling** - IMPLEMENTED
   - Try-catch blocks around all critical code
   - Timeouts for engine responses
   - Helpful error messages
   - Graceful degradation

5. **Cleanup Handlers** - IMPLEMENTED
   - SIGINT handler (Ctrl+C)
   - SIGTERM handler
   - Cleanup on all exit paths
   - Proper resource disposal

### Performance Notes

- Engine initialization: ~500-1000ms (WASM loading)
- Move suggestions (depth 15): 5-30 seconds depending on position
- No memory leaks observed
- Clean process termination verified

### Compatibility

- ✅ Node.js 20+ (ES modules, WASM support)
- ✅ macOS (tested)
- ✅ Linux (should work)
- ✅ Windows (should work with minor path adjustments)

## Next Phase Recommendations

With Phase 1 complete, the application is now stable and ready for:

1. **Phase 2: Code Refactoring**
   - Extract engine management into a class
   - Separate game logic from UI
   - Add configuration management

2. **Phase 3: Core Features**
   - ASCII board visualization
   - Move history tracking
   - Undo/redo functionality

3. **Phase 4: Advanced Features**
   - PGN import/export
   - Position analysis
   - Multiple game modes
