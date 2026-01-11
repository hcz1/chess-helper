# ♟ Chess Move Helper

A command-line chess assistant powered by Stockfish that helps you analyze positions and suggests the best moves during your games.

## Features

### Core Features (Phase 3 ✨ NEW!)
- **ASCII Board Visualization**: Beautiful Unicode chess board with piece symbols (♔♕♖♗♘♙)
- **Move History**: Complete game history with undo/redo functionality
- **Position Analysis**: Deep analysis with evaluation scores and top move alternatives
- **Command System**: Rich set of commands for game navigation and analysis
- **Auto-Confirm Moves**: Press Enter to quickly accept suggested moves

### Engine Features
- **Move Suggestions**: Get the best move recommendations from Stockfish 17.1
- **Multiple Move Formats**: Supports algebraic notation (e4, Nf3), long algebraic (e2e4), and more
- **Evaluation Scores**: See position evaluations in centipawns or mate sequences
- **Multi-Move Analysis**: View top 3 moves with explanations

### Game Features
- **Game State Tracking**: Automatically detects checkmate, stalemate, draws, and other game-ending conditions
- **Turn Management**: Correctly handles turn order for both white and black pieces
- **Material Tracking**: See captured pieces and material advantage
- **Error Handling**: Robust error handling with helpful error messages
- **Graceful Shutdown**: Clean resource management and process termination

## Installation

### Quick Install (Recommended)

Install globally via npm (once published):

```bash
npm install -g chess-helper
```

Then run from anywhere:

```bash
chess-helper
```

### Install from Source

1. Clone the repository:
```bash
git clone <repository-url>
cd chess-helper
```

2. Install dependencies:
```bash
npm install
```

3. Link globally (makes `chess-helper` command available everywhere):
```bash
npm link
```

4. Run from anywhere:
```bash
chess-helper
```

### Run without Installing

```bash
npm start          # From project directory
# or
npx chess-helper   # From anywhere (requires npm package)
```

For detailed installation instructions and troubleshooting, see [INSTALLATION.md](INSTALLATION.md).

## Usage

### Starting a Game

Run the application:
```bash
npm start
```

You'll be prompted to choose your color:
```
♟ Chess Move Helper

⏳ Initializing chess engine...
✅ Engine ready!

Are you playing white or black? (w/b):
```

Enter `w` for white or `b` for black.

### Making Moves

The application will prompt you for moves based on whose turn it is:

**Your Turn:**
```
Your move (suggested: e4, press Enter to use):
```

Simply press **Enter** to use the suggested move, or type your own move.

**Opponent's Turn:**
```
black's move:
```

### Move Formats

The application accepts multiple move formats:

- **Standard Algebraic Notation (SAN)**: `e4`, `Nf3`, `O-O`, `Qxd5`
- **Long Algebraic**: `e2e4`, `g1f3`
- **Captures**: `exd5`, `Nxf6`
- **Castling**: `O-O` (kingside), `O-O-O` (queenside)

### Commands

During gameplay, you can use these commands:

- **board** or **b**: Display the current board position
- **history** or **h**: Show complete move history
- **undo** or **u**: Undo the last move (both sides)
- **redo** or **r**: Redo a previously undone move
- **analyze** or **a**: Get deep analysis with top 3 moves
- **help** or **?**: Show all available commands
- **quit** or **q**: Exit the game
- **Ctrl+C**: Gracefully terminate the application

### Example Game Session

```
♟ Chess Move Helper

⏳ Initializing chess engine...
✅ Engine ready!

Are you playing white or black? (w/b): w

You are playing as white. Enter 'quit' to exit.

  a b c d e f g h
8 ♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜
7 ♟ ♟ ♟ ♟ ♟ ♟ ♟ ♟
6 · · · · · · · ·
5 · · · · · · · ·
4 · · · · · · · ·
3 · · · · · · · ·
2 ♙ ♙ ♙ ♙ ♙ ♙ ♙ ♙
1 ♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖

Your move (suggested: e4, press Enter to use): [Press Enter]
You (white): e4

  a b c d e f g h
8 ♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜
7 ♟ ♟ ♟ ♟ ♟ ♟ ♟ ♟
6 · · · · · · · ·
5 · · · · · · · ·
4 · · · · [♙] · · ·
3 · · · · · · · ·
2 ♙ ♙ ♙ ♙ · ♙ ♙ ♙
1 ♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖

Black's move: e5
Black: e5

Your move (suggested: Nf3, press Enter to use): analyze

🔍 Analyzing position...

🎯 Top Moves:
  1. Nf3 (+0.45) - Develops knight
  2. Bc4 (+0.38) - Develops bishop
  3. Nc3 (+0.35) - Develops knight

Your move (suggested: Nf3, press Enter to use): [Press Enter]
You (white): Nf3

...
```

## Architecture

The application follows a modular architecture with clear separation of concerns. For detailed architecture documentation, see [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md).

### Quick Overview

```
chess-helper/
├── src/
│   ├── analysis/          # Position analysis
│   ├── cli/               # CLI argument parsing
│   ├── config/            # Configuration management
│   ├── engine/            # Chess engine integration
│   ├── game/              # Game logic and state
│   ├── ui/                # User interface components
│   └── index.js           # Main entry point
├── config/                # Configuration files
└── docs/                  # Documentation
```

### Key Components

- **PositionAnalyzer** - Position analysis and evaluation
- **BoardRenderer** - ASCII board visualization
- **GameHistory** - Move history tracking with undo/redo
- **CommandParser** - Command system for game navigation
- **StockfishEngine** - Chess engine wrapper and UCI communication
- **GameManager** - Game state management
- **InputHandler** - User input processing
- **OutputFormatter** - Console output formatting

See [ARCHITECTURE.md](docs/development/ARCHITECTURE.md) for complete component documentation.

## Configuration

Edit `config/default.json` to customize settings:

```json
{
  "engine": {
    "depth": 15,                    // Search depth (higher = stronger, slower)
    "initTimeout": 10000,           // Engine initialization timeout (ms)
    "moveTimeout": 30000            // Move calculation timeout (ms)
  },
  "game": {
    "showSuggestions": true,        // Show move suggestions
    "validateMoves": true           // Validate moves before applying
  },
  "ui": {
    "showExamples": true,           // Show examples in error messages
    "useEmojis": true               // Use emoji in output
  },
  "display": {
    "showBoardAfterMove": true,     // Auto-display board after moves
    "showMoveHistory": false,       // Auto-show history after moves
    "showAnalysis": false,          // Auto-analyze positions
    "showCapturedPieces": true,     // Show captured pieces
    "showMaterialAdvantage": true   // Show material count
  },
  "analysis": {
    "showTopMoves": 3,              // Number of alternative moves
    "analysisDepth": 15,            // Analysis search depth
    "showEvaluation": true          // Show evaluation scores
  }
}
```

## Development

### Project Structure

- **src/analysis/**: Position analysis and evaluation
- **src/engine/**: Chess engine management
- **src/game/**: Game logic, state management, and history
- **src/ui/**: User interface, I/O handling, and visualization
- **config/**: Configuration files

### Code Quality

The codebase follows these standards:
- **JSDoc comments** on all public APIs
- **Error handling** with try-catch blocks
- **Resource cleanup** in finally blocks
- **Modular design** with single responsibility principle

### Adding New Features

The modular architecture makes it easy to extend:

1. **New game modes**: Extend `GameManager` or create new game mode classes
2. **Enhanced UI**: Add methods to `OutputFormatter` for new display features
3. **Engine options**: Modify `EngineConfig.js` for different engine settings
4. **Analysis features**: Extend `StockfishEngine` with new UCI commands

## Troubleshooting

### Engine Initialization Timeout

**Problem**: Engine fails to initialize within 10 seconds

**Solutions**:
- Increase `initTimeout` in `config/default.json`
- Check Node.js version (requires 16+)
- Ensure WASM support is enabled

### Invalid Move Errors

**Problem**: Valid moves are rejected

**Solutions**:
- Use standard algebraic notation (e.g., `e4`, `Nf3`)
- Include piece notation for non-pawn moves (e.g., `Nf3` not `f3`)
- For captures, use `x` (e.g., `exd5`)

### Slow Move Suggestions

**Problem**: Engine takes too long to suggest moves

**Solutions**:
- Reduce `depth` in `config/default.json` (try 10-12)
- Reduce `moveTimeout` to fail faster
- Note: Complex positions naturally take longer

### Process Doesn't Exit

**Problem**: Application hangs after game ends

**Solutions**:
- Press Ctrl+C to force exit
- Use `quit` command during game
- Check for open readline interfaces

## Technical Details

### Engine

- **Stockfish 17.1**: World-class chess engine
- **WASM**: WebAssembly for cross-platform compatibility
- **UCI Protocol**: Universal Chess Interface for engine communication

### Dependencies

- `chess.js`: Chess game logic and move validation
- `stockfish`: Stockfish chess engine (WASM)
- `readline`: Built-in Node.js module for CLI input

## Version History

For detailed version history, see [docs/history/CHANGELOG.md](docs/history/CHANGELOG.md).

- **v3.0.0** (Phase 3): Board visualization, move history, undo/redo, position analysis, command system
- **v2.0.0** (Phase 2): Modular architecture refactor
- **v1.0.0** (Phase 1): Core functionality with engine integration

## Future Enhancements

Planned features for Phase 4:

- **PGN Import/Export**: Load and save games in PGN format
- **Multiple Game Modes**: Training mode, puzzle mode, analysis mode
- **Opening Book**: Opening name recognition and theory
- **Statistics Tracking**: Win/loss records, move quality analysis
- **Persistent Storage**: Save and resume games
- **Enhanced UI**: Colored output, better formatting
- **Testing**: Comprehensive test suite

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Follow existing code style and JSDoc conventions
4. Add tests for new features
5. Submit a pull request

## License

ISC

## Acknowledgments

- Stockfish developers for the chess engine
- chess.js for the game logic library
- Node.js community for WASM support

## Documentation

- **[README.md](README.md)** - This file (user guide)
- **[INSTALLATION.md](INSTALLATION.md)** - Installation instructions
- **[EXAMPLES.md](EXAMPLES.md)** - Usage examples and workflows
- **[PUBLISHING.md](PUBLISHING.md)** - Publishing guide
- **[docs/README.md](docs/README.md)** - Complete documentation index

### Developer Documentation
- **[Architecture](docs/development/ARCHITECTURE.md)** - System architecture and design
- **[CLI Setup](docs/development/CLI_SETUP.md)** - CLI setup guide
- **[Testing](docs/development/TEST_INSTRUCTIONS.md)** - Testing instructions

### Project History
- **[Changelog](docs/history/CHANGELOG.md)** - Version history
- **[Phase Reports](docs/history/)** - Phase 1, 2, and 3 completion reports

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the [architecture documentation](docs/development/ARCHITECTURE.md)

---

**Enjoy your chess games! ♟**
