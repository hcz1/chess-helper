import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parses command-line arguments using Commander.
 * Provides options and subcommands for the chess helper application.
 */
export class CommandLineParser {
  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  /**
   * Set up the commander program with options and commands.
   * @private
   */
  setupProgram() {
    const parseInteger = (value) => Number.parseInt(value, 10);

    // Read package.json for version
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf-8')
    );

    this.program
      .name('chess-helper')
      .description('A command-line chess assistant powered by Stockfish')
      .version(packageJson.version)
      .allowUnknownOption(false)
      .allowExcessArguments(false);

    // Add global options
    this.program
      .option('-d, --depth <number>', 'Engine search depth', parseInteger, 15)
      .option('-c, --color <color>', 'Player color (w/white or b/black)')
      .option('-f, --fen <string>', 'Start from FEN position')
      .option('--no-hints', 'Disable move suggestions')
      .option('--debug', 'Enable debug logging')
      .option('--no-color', 'Disable colored output')
      .action(() => {
        // Default action when no command is specified
        this.defaultAction = true;
      });

    // Add analyze subcommand
    this.program
      .command('analyze <fen>')
      .description('Analyze a chess position from FEN notation')
      .option('-d, --depth <number>', 'Analysis depth', parseInteger, 20)
      .option('-m, --moves <number>', 'Number of top moves to show', parseInteger, 5)
      .action((fen, options) => {
        this.analyzeCommand = { fen, ...options };
      });

    // Add config subcommand
    this.program
      .command('config')
      .description('Show current configuration')
      .action(() => {
        this.configCommand = { action: 'show' };
      });

    this.program
      .command('config-set <key> <value>')
      .description('Set a configuration value')
      .action((key, value) => {
        this.configCommand = { action: 'set', key, value };
      });

    this.program
      .command('config-reset')
      .description('Reset configuration to defaults')
      .action(() => {
        this.configCommand = { action: 'reset' };
      });

    // Add help subcommand
    this.program
      .command('help')
      .description('Display help information')
      .action(() => {
        this.program.help();
      });
  }

  /**
   * Parse command-line arguments.
   * @param {Array<string>} args - Command-line arguments (defaults to process.argv)
   * @returns {Object} Parsed options and commands
   */
  parse(args = process.argv) {
    this.program.parse(args);
    const options = this.program.opts();

    const fromCli = (key) => this.program.getOptionValueSource(key) === 'cli';

    // Commander can route `--depth` to the parent program when the flag comes
    // after the <fen> positional argument. If analyze depth is still at its
    // default, treat a non-default global depth as the intended analyze depth.
    if (
      this.analyzeCommand &&
      typeof this.analyzeCommand.depth === 'number' &&
      this.analyzeCommand.depth === 20 &&
      typeof options.depth === 'number' &&
      options.depth !== 15
    ) {
      this.analyzeCommand.depth = options.depth;
    }

    return {
      options: {
        // Only treat option values as overrides when explicitly supplied.
        // This allows persisted config values to take effect.
        depth: fromCli('depth') ? options.depth : undefined,

        // `--color <side>` (player color) currently collides with `--no-color`
        // (output colors). We keep backwards compatible behavior by treating
        // string values as player color and boolean false as `--no-color`.
        color:
          fromCli('color') && typeof options.color === 'string'
            ? this.normalizeColor(options.color)
            : null,

        fen: fromCli('fen') ? options.fen : undefined,
        hints: fromCli('hints') ? options.hints : undefined,
        debug: fromCli('debug') ? options.debug : undefined,
        noColor: fromCli('color') && options.color === false ? true : undefined,
      },
      commands: {
        analyze: this.analyzeCommand,
        config: this.configCommand,
      },
      isDefaultAction: this.defaultAction || (!this.analyzeCommand && !this.configCommand),
    };
  }

  /**
   * Normalize color input to 'w' or 'b'.
   * @param {string} color - Color input
   * @returns {string|null} Normalized color or null
   * @private
   */
  normalizeColor(color) {
    if (!color) return null;
    
    const normalized = color.toLowerCase();
    if (normalized === 'w' || normalized === 'white') return 'w';
    if (normalized === 'b' || normalized === 'black') return 'b';
    
    return null;
  }

  /**
   * Get the program instance for advanced usage.
   * @returns {Command} Commander program instance
   */
  getProgram() {
    return this.program;
  }

  /**
   * Display help information.
   */
  showHelp() {
    this.program.help();
  }
}
