# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - Phase 3 (January 2026)

### Added
- ASCII board visualization with Unicode chess pieces
- Move history tracking with FEN positions
- Undo/redo functionality
- Enhanced position analysis with evaluation scores
- Multiple move alternatives (top 3 moves)
- Comprehensive command system (board, history, undo, redo, analyze, help, quit)
- Auto-confirm suggested moves (press Enter)
- Material advantage calculation
- Captured pieces display
- PGN export capability

### Changed
- Complete rewrite of game loop to support commands
- Enhanced StockfishEngine with MultiPV support for analysis
- Improved user experience with visual board display

### Technical
- Created `src/ui/BoardRenderer.js` for board visualization
- Created `src/game/GameHistory.js` for history management
- Created `src/ui/CommandParser.js` for command handling
- Created `src/analysis/PositionAnalyzer.js` for position analysis
- Enhanced `src/engine/StockfishEngine.js` with analysis methods

## [2.0.0] - Phase 2 (January 2026)

### Added
- Modular architecture with clear separation of concerns
- Engine module (`src/engine/`)
- Game module (`src/game/`)
- UI module (`src/ui/`)
- Configuration file (`config/default.json`)
- Comprehensive JSDoc documentation
- Enhanced README with architecture overview

### Changed
- Refactored monolithic `index.js` into modular structure
- Extracted engine logic into `StockfishEngine` class
- Extracted game logic into `GameManager` class
- Extracted UI logic into separate formatter classes
- Improved error handling and resource cleanup

### Technical
- Created `src/engine/StockfishEngine.js` (221 lines)
- Created `src/engine/EngineConfig.js` (30 lines)
- Created `src/game/GameManager.js` (133 lines)
- Created `src/game/MoveValidator.js` (43 lines)
- Created `src/ui/InputHandler.js` (56 lines)
- Created `src/ui/OutputFormatter.js` (98 lines)
- Refactored `src/index.js` (151 lines, down from 332)

## [1.0.0] - Phase 1 (January 2026)

### Added
- Core chess game functionality
- Stockfish engine integration (WASM)
- Move suggestions from Stockfish
- Turn order logic for both white and black
- Game-over detection (checkmate, stalemate, draws)
- Invalid move handling with helpful error messages
- Graceful shutdown (Ctrl+C, quit command)
- Engine initialization with proper waiting
- Message handler system for concurrent requests

### Fixed
- Engine initialization race condition
- Message handler race condition (Map-based handlers)
- Turn order logic for black pieces
- Resource cleanup on exit

### Technical
- Initial implementation with Stockfish WASM integration
- Proper async/await patterns
- Error handling with try-catch blocks
- Signal handlers for graceful shutdown
- Timeout handling for engine responses

## Pre-Release

### Development Phases
- **Phase 1**: Core functionality and engine integration
- **Phase 2**: Modular architecture refactoring
- **Phase 3**: Core features (board, history, analysis, commands)

### Future Plans (Phase 4+)
- PGN import/export
- Multiple game modes (training, puzzle, analysis)
- Opening book integration
- Statistics tracking
- Persistent game storage
- Enhanced UI with colors
- Comprehensive test suite

---

For detailed implementation reports, see:
- [Phase 1 Improvements](PHASE1_IMPROVEMENTS.md)
- [Phase 2 Completion](PHASE2_COMPLETION.md)
- [Phase 3 Completion](PHASE3_COMPLETION.md)
- [Phase 3 Summary](PHASE3_SUMMARY.md)
