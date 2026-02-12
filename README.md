# chess-helper ♟

A local command-line chess assistant powered by Stockfish (WASM).

You play through a position by entering moves for both sides, and chess-helper will suggest strong continuations and evaluations along the way.

## Fair Play

Using an engine during online/rated games is cheating. Use this for analysis, training, and casual/offline games.

## Highlights

- Interactive CLI game loop (play White or Black)
- Suggested best move on your turn (press Enter to accept)
- Undo/redo and move history
- Analyze any position from FEN (`chess-helper analyze "..."`)
- Persistent per-user configuration (`chess-helper config-set ...`)

## Requirements

- Node.js `>= 20`

## Installation

### Install from npm

```bash
npm install -g chess-helper
chess-helper --version
```

If npm doesn't have the package yet (for example a 404), install from source instead.

### Install from source (development)

```bash
git clone https://github.com/hcz1/chess-helper.git
cd chess-helper
npm install
npm link
chess-helper
```

### Run from the repo (no global install)

```bash
npm start
```

### Update

```bash
npm update -g chess-helper
```

If you installed from source:

```bash
git pull
npm install
```

### Uninstall

```bash
npm uninstall -g chess-helper
```

If you installed from source with `npm link`:

```bash
npm unlink -g chess-helper
```

## Usage

### Start an interactive game

```bash
chess-helper
```

If you don't pass `--color`, you'll get a short startup menu to choose White/Black.

On your turn you'll see a suggested move. Press Enter to accept it, or type a move yourself.

### Start as a specific color

```bash
chess-helper --color white
chess-helper --color black

# short form
chess-helper -c w
chess-helper -c b
```

### Start from a FEN position

```bash
chess-helper --fen "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
```

### Adjust strength vs speed

```bash
chess-helper --depth 10   # faster/weaker
chess-helper --depth 20   # slower/stronger
```

### Disable move suggestions

```bash
chess-helper --no-hints
```

## Analyze a Position (Non-Interactive)

Analyze a FEN and print the top moves:

```bash
chess-helper analyze "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
```

Control depth and number of lines:

```bash
chess-helper analyze "FEN_STRING" --depth 25 --moves 5
```

## In-Game Commands

Type these at any move prompt:

- `board` / `b`: show the board
- `history` / `h`: show move history
- `undo` / `u`: undo the last move (both sides)
- `redo` / `r`: redo an undone move
- `analyze` / `a`: analyze the current position (top moves table)
- `config`: print the current configuration and config file path
- `help` / `?`: show help
- `quit` / `q`: exit

## Move Input

Common accepted formats include:

- SAN: `e4`, `Nf3`, `O-O`, `Qxd5`
- Long algebraic: `e2e4`, `g1f3`
- Promotions: `e8=Q`

## Configuration

chess-helper stores settings per-user (so you can set them once and forget them).

Show current config (and where it's stored):

```bash
chess-helper config
```

Set a value:

```bash
chess-helper config-set engine.depth 18
chess-helper config-set display.showHints false
```

Reset to defaults:

```bash
chess-helper config-reset
```

Defaults live in `config/default.json` (shipped with the package). For the full list of keys, run `chess-helper config`.

## Troubleshooting

### `command not found: chess-helper`

- If you installed from npm globally, make sure npm's global bin directory is on your `PATH`.
- Find it with `npm bin -g`.

### Permission errors installing globally (EACCES)

Prefer configuring npm's global prefix instead of using `sudo`. See npm's docs for `fixing npm permissions`.

### Engine initialization timeout / very slow analysis

- Verify Node is `>= 20`: `node --version`
- Reduce depth: `chess-helper --depth 10`

## Development

```bash
npm install
npm test
npm start
```

## Documentation

- `EXAMPLES.md` (workflows and CLI examples)
- `docs/README.md` (developer docs index)
- `docs/development/ARCHITECTURE.md`
- `docs/history/CHANGELOG.md`

## Contributing

PRs and issues are welcome.

## License

ISC (see `LICENSE`).

## Support

- GitHub issues: [hcz1/chess-helper/issues](https://github.com/hcz1/chess-helper/issues)
- X: @hczdev
