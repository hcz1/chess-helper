# Architecture Documentation

## System Architecture

The application follows a modular architecture with clear separation of concerns:

```
chess-helper/
├── src/
│   ├── analysis/
│   │   └── PositionAnalyzer.js     # Position analysis and evaluation
│   ├── cli/
│   │   └── CommandLineParser.js    # CLI argument parsing
│   ├── config/
│   │   └── ConfigManager.js         # Configuration management
│   ├── engine/
│   │   ├── StockfishEngine.js      # Engine wrapper and UCI communication
│   │   └── EngineConfig.js         # Engine configuration constants
│   ├── game/
│   │   ├── GameManager.js          # Game state management
│   │   ├── GameHistory.js          # Move history and undo/redo
│   │   └── MoveValidator.js        # Move validation and formatting
│   ├── ui/
│   │   ├── BoardRenderer.js        # ASCII board visualization
│   │   ├── CommandParser.js        # Command parsing and handling
│   │   ├── InputHandler.js         # User input handling
│   │   └── OutputFormatter.js     # Console output formatting
│   └── index.js                     # Main entry point
├── config/
│   └── default.json                # Configuration settings
└── package.json
```

## Components

### PositionAnalyzer (Phase 3)
Analyzes chess positions:
- Evaluation score extraction
- Multiple move alternatives
- Position assessment (winning/equal/losing)
- Move explanations

### BoardRenderer (Phase 3)
Visualizes the chess board:
- Unicode piece rendering
- Last move highlighting
- Captured pieces display
- Material advantage calculation

### GameHistory (Phase 3)
Tracks game history:
- Move recording with FEN positions
- Undo/redo functionality
- PGN export
- Formatted history display

### CommandParser (Phase 3)
Parses user commands:
- Command recognition and validation
- Alias support (b for board, h for history, etc.)
- Help system

### CommandLineParser (CLI Integration)
Handles CLI arguments:
- Commander.js integration
- Command-line flag parsing
- Subcommand support (analyze, config)

### ConfigManager (CLI Integration)
Manages persistent configuration:
- User preference storage
- Configuration validation
- Default value management

### StockfishEngine
Manages the Stockfish chess engine lifecycle:
- WASM module initialization
- UCI protocol communication
- Move analysis and suggestions
- Multi-move analysis with MultiPV
- Evaluation score extraction

### GameManager
Handles game state and operations:
- Chess.js wrapper for game logic
- Turn tracking and validation
- Game-over detection
- Position management (FEN)
- History integration

### MoveValidator
Validates and formats chess moves:
- Multiple move format support
- Move validation
- Error message generation

### InputHandler
Manages user input:
- Readline interface
- Input prompting and collection
- Command parsing integration
- Auto-confirm for suggested moves

### OutputFormatter
Formats console output:
- Consistent messaging
- Board display
- History display
- Analysis display
- Game status display
- Error formatting

## Component Interactions

```
User Input → InputHandler → CommandParser
                ↓
         GameManager ← GameHistory
                ↓
         StockfishEngine → PositionAnalyzer
                ↓
         OutputFormatter → BoardRenderer
                ↓
         Console Display
```

## Data Flow

### Game Loop Flow
1. User provides input (move or command)
2. InputHandler processes input
3. CommandParser checks if it's a command
4. If command: execute command handler
5. If move: GameManager validates and applies move
6. GameHistory records the move
7. StockfishEngine calculates next move suggestion
8. OutputFormatter displays updated board
9. Loop continues until game over

### Analysis Flow
1. User requests analysis (via command or CLI)
2. PositionAnalyzer requests analysis from StockfishEngine
3. StockfishEngine uses MultiPV to get multiple moves
4. PositionAnalyzer extracts evaluations and formats results
5. OutputFormatter displays analysis in formatted table

## Design Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Modularity**: Components can be tested and modified independently
3. **Error Handling**: All async operations wrapped in try-catch blocks
4. **Resource Management**: Proper cleanup in finally blocks
5. **Configuration**: Externalized configuration for easy customization

## Extension Points

The architecture supports easy extension:

1. **New game modes**: Extend GameManager or create new mode classes
2. **Enhanced UI**: Add methods to OutputFormatter for new display features
3. **Engine options**: Modify EngineConfig.js for different engine settings
4. **Analysis features**: Extend StockfishEngine with new UCI commands
5. **Command system**: Add new commands via CommandParser

## Dependencies

- `chess.js` - Chess game logic and move validation
- `stockfish` - Stockfish chess engine (WASM)
- `node:readline` - Built-in Node.js module for CLI input
- `chalk` - Terminal colors and styling
- `boxen` - Boxed messages
- `table` - Formatted tables
- `ora` - Loading spinners
- `commander` - CLI argument parsing
- `conf` - Configuration management

## Performance Considerations

- Engine initialization: ~500-1000ms (WASM loading)
- Move suggestions (depth 15): 5-30 seconds depending on position complexity
- Board rendering: Instant
- Move history tracking: Negligible overhead
- Analysis with 3 moves: 5-15 seconds (depth 15)

## Future Enhancements

Planned architectural improvements:
- Plugin system for custom commands
- Event-driven architecture for game state changes
- Caching layer for position analysis
- WebSocket support for remote analysis
- Database integration for game storage
