# Chess Helper CLI - Usage Examples

## Basic Usage

### Start a new game
```bash
chess-helper
```

### Start as a specific color
```bash
chess-helper --color white
chess-helper --color black
# or short form
chess-helper -c w
chess-helper -c b
```

### Start from a specific position (FEN)
```bash
chess-helper --fen "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
```

### Adjust engine strength
```bash
# Weaker (faster)
chess-helper --depth 10

# Stronger (slower)
chess-helper --depth 25
```

### Disable move hints
```bash
chess-helper --no-hints
```

## Analysis Mode

### Analyze a position
```bash
chess-helper analyze "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
```

### Get more alternative moves
```bash
chess-helper analyze "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1" --moves 10
```

### Deep analysis
```bash
chess-helper analyze "8/8/8/4k3/8/8/4K3/8 w - - 0 1" --depth 30
```

## Configuration Management

### View current configuration
```bash
chess-helper config
```

### Update configuration
```bash
chess-helper config-set engine.depth 20
chess-helper config-set display.showHints true
chess-helper config-set ui.useEmojis false
```

### Reset to defaults
```bash
chess-helper config-reset
```

## In-Game Commands

Once the game is running, you can use these commands:

### Display board
```
board
b
```

### View move history
```
history
h
```

### Undo last move
```
undo
u
```

### Redo undone move
```
redo
r
```

### Analyze current position
```
analyze
a
```

### Show help
```
help
?
```

### Quit game
```
quit
q
```

## Common Workflows

### Practice openings as white
```bash
chess-helper --color white --depth 15
```
Then play your opening moves and see engine responses.

### Analyze a game position
If you reach an interesting position, use FEN:
1. Type `board` to see the position
2. Copy the FEN (you might need to add FEN display)
3. Exit and analyze: `chess-helper analyze "YOUR_FEN_HERE"`

### Train endgames
```bash
# Load endgame position
chess-helper --fen "8/8/8/4k3/8/8/4K3/4R3 w - - 0 1"
# Practice the winning technique
```

### Study a specific game
```bash
# Start from a famous position
chess-helper --fen "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
# This is the Italian Game, follow mainline or explore alternatives
```

### Quick position check
```bash
# Just check what's best in a position without playing
chess-helper analyze "YOUR_FEN" --moves 5
```

## Advanced Examples

### Combine multiple options
```bash
chess-helper --color black --depth 20 --fen "starting_position_fen"
```

### Script integration
```bash
#!/bin/bash
# Analyze multiple positions
POSITIONS=(
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2"
)

for fen in "${POSITIONS[@]}"; do
  echo "Analyzing: $fen"
  chess-helper analyze "$fen" --moves 3
  echo ""
done
```

### Automated testing
```bash
# Check if chess-helper is working
if chess-helper --version > /dev/null 2>&1; then
  echo "✓ Chess helper is installed"
else
  echo "✗ Chess helper not found"
fi
```

## Tips & Tricks

### 1. Quick move acceptance
When you see a suggested move you like, just press **Enter** instead of typing it out:
```
Your move (suggested: e4, press Enter to use): [Press Enter]
```

### 2. Use aliases
Add to your `~/.zshrc` or `~/.bashrc`:
```bash
alias chess="chess-helper"
alias chessw="chess-helper --color white"
alias chessb="chess-helper --color black"
alias analyze="chess-helper analyze"
```

Then use:
```bash
chess
chessw
analyze "fen_string"
```

### 3. Default configuration
Set your preferences once:
```bash
chess-helper config-set engine.depth 18
chess-helper config-set display.showHints true
```

### 4. FEN bookmarks
Save interesting positions in a file:
```bash
# positions.txt
Italian Game: rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3
Ruy Lopez: r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3
```

Then analyze:
```bash
# Extract FEN and analyze
cat positions.txt | grep "Italian" | cut -d: -f2 | xargs chess-helper analyze
```

## Troubleshooting Commands

### Check version
```bash
chess-helper --version
```

### Verify installation
```bash
which chess-helper
```

### Test basic functionality
```bash
chess-helper --help
```

### Debug mode (if implemented)
```bash
chess-helper --debug
```

## Moving Notations Supported

The tool accepts multiple chess move formats:

### Standard Algebraic Notation (SAN)
```
e4, e5, Nf3, Nc6, Bb5
```

### Long Algebraic
```
e2e4, e7e5, g1f3, b8c6, f1b5
```

### Captures
```
exd5, Bxf7, Qxd8
```

### Castling
```
O-O (kingside)
O-O-O (queenside)
```

### Promotions
```
e8=Q
e8Q
e7e8q
```

## Environment Variables (if supported in future)

```bash
# Set default depth
export CHESS_HELPER_DEPTH=20

# Disable hints by default
export CHESS_HELPER_NO_HINTS=1

# Run
chess-helper
```

## Getting Help

### In CLI
```bash
chess-helper --help
chess-helper analyze --help
```

### In game
```
help
?
```

### Documentation
```bash
# If published
npm home chess-helper

# Or visit GitHub
open https://github.com/yourusername/chess-helper
```

---

**Enjoy analyzing and improving your chess! ♟️**
