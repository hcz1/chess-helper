# ♟ Chess Move Helper

A command-line chess assistant powered by Stockfish that helps you analyze positions and suggests the best moves during your games.

## Features

- **Move Suggestions**: Get the best move recommendations from Stockfish engine
- **Multiple Move Formats**: Supports algebraic notation (e4, Nf3), long algebraic (e2e4), and more
- **Game State Tracking**: Automatically detects checkmate, stalemate, draws, and other game-ending conditions
- **Turn Management**: Correctly handles turn order for both white and black pieces
- **Error Handling**: Robust error handling with helpful error messages
- **Graceful Shutdown**: Clean resource management and process termination

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd chess-helper
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm start
```

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
Your move (suggested: e2e4):
```

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

- **quit**: Exit the game at any time
- **Ctrl+C**: Gracefully terminate the application

### Example Game Session

```
♟ Chess Move Helper

⏳ Initializing chess engine...
✅ Engine ready!

Are you playing white or black? (w/b): w

You are playing as white. Enter 'quit' to exit.

Your move (suggested: e2e4): e4
You (white): e4

black's move: e5
black: e5

Your move (suggested: Nf3): Nf3
You (white): Nf3

black's move: Nc6
black: Nc6

...
```

## Architecture

The application follows a modular architecture with clear separation of concerns:

```
chess-helper/
├── src/
│   ├── engine/
│   │   ├── StockfishEngine.js      # Engine wrapper and UCI communication
│   │   └── EngineConfig.js         # Engine configuration constants
│   ├── game/
│   │   ├── GameManager.js          # Game state management
│   │   └── MoveValidator.js        # Move validation and formatting
│   ├── ui/
│   │   ├── InputHandler.js         # User input handling
│   │   └── OutputFormatter.js      # Console output formatting
│   └── index.js                     # Main entry point
├── config/
│   └── default.json                # Configuration settings
└── package.json
```

### Components

#### StockfishEngine
Manages the Stockfish chess engine lifecycle:
- WASM module initialization
- UCI protocol communication
- Move analysis and suggestions
- Engine process management

#### GameManager
Handles game state and operations:
- Chess.js wrapper for game logic
- Turn tracking and validation
- Game-over detection
- Position management (FEN)

#### MoveValidator
Validates and formats chess moves:
- Multiple move format support
- Move validation
- Error message generation

#### InputHandler
Manages user input:
- Readline interface
- Input prompting and collection
- Special command handling

#### OutputFormatter
Formats console output:
- Consistent messaging
- Game status display
- Error formatting

## Configuration

Edit `config/default.json` to customize settings:

```json
{
  "engine": {
    "depth": 15,              // Search depth (higher = stronger, slower)
    "initTimeout": 10000,     // Engine initialization timeout (ms)
    "moveTimeout": 30000      // Move calculation timeout (ms)
  },
  "game": {
    "showSuggestions": true,  // Show move suggestions
    "validateMoves": true     // Validate moves before applying
  },
  "ui": {
    "showExamples": true,     // Show examples in error messages
    "useEmojis": true         // Use emoji in output
  }
}
```

## Development

### Project Structure

- **src/engine/**: Chess engine management
- **src/game/**: Game logic and state management
- **src/ui/**: User interface and I/O handling
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

## Future Enhancements

Planned features for future releases:

- **Phase 3**: Board visualization, move history, undo/redo
- **Phase 4**: PGN import/export, analysis mode, opening book
- **Testing**: Comprehensive test suite
- **UI**: Colored output with chalk

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

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the architecture documentation

---

**Enjoy your chess games! ♟**
