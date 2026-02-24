/**
 * Parses and handles special commands during gameplay.
 * Commands allow users to control game flow and display information.
 */
export class CommandParser {
  /**
   * Map of command aliases to canonical command names.
   */
  static COMMANDS = {
    'board': 'board',
    'b': 'board',
    'opening': 'opening',
    'o': 'opening',
    'history': 'history',
    'h': 'history',
    'undo': 'undo',
    'u': 'undo',
    'redo': 'redo',
    'r': 'redo',
    'analyze': 'analyze',
    'a': 'analyze',
    'help': 'help',
    '?': 'help',
    'config': 'config',
    'quit': 'quit',
    'q': 'quit'
  };

  /**
   * Check if input is a command.
   * @param {string} input - User input
   * @returns {boolean} True if input is a command
   */
  static isCommand(input) {
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    const trimmed = input.trim().toLowerCase();
    return trimmed in this.COMMANDS;
  }

  /**
   * Parse a command string.
   * @param {string} input - User input
   * @returns {Object} Command object with name and arguments
   */
  static parseCommand(input) {
    const trimmed = input.trim().toLowerCase();
    const parts = trimmed.split(/\s+/);
    const commandAlias = parts[0];
    const args = parts.slice(1);
    
    const commandName = this.COMMANDS[commandAlias];
    
    if (!commandName) {
      return null;
    }
    
    return {
      name: commandName,
      alias: commandAlias,
      args: args
    };
  }

  /**
   * Get help text for all commands.
   * @returns {string} Formatted help text
   */
  static getCommandHelp() {
    return `
Available Commands:
  board, b       - Display the current board position
  opening, o     - Show opening detection status
  history, h     - Show move history
  undo, u        - Undo the last move (both sides)
  redo, r        - Redo a previously undone move
  analyze, a     - Deep analysis of current position
  config         - Show current configuration
  help, ?        - Show this help message
  quit, q        - Exit the game

Move Input:
  - Enter moves in standard notation (e.g., e4, Nf3, O-O)
  - Press Enter without typing to use the suggested move
  - Type 'quit' to exit at any time
`;
  }

  /**
   * Get a short description for a command.
   * @param {string} commandName - Canonical command name
   * @returns {string} Command description
   */
  static getCommandDescription(commandName) {
    const descriptions = {
      'board': 'Display the current board position',
      'opening': 'Show opening detection status',
      'history': 'Show move history',
      'undo': 'Undo the last move',
      'redo': 'Redo a previously undone move',
      'analyze': 'Analyze the current position',
      'config': 'Show current configuration',
      'help': 'Show available commands',
      'quit': 'Exit the game'
    };
    
    return descriptions[commandName] || 'Unknown command';
  }

  /**
   * Validate if a command can be executed in the current context.
   * @param {string} commandName - Canonical command name
   * @param {Object} context - Game context (game, history, etc.)
   * @returns {Object} Validation result with valid flag and message
   */
  static validateCommand(commandName, context) {
    switch (commandName) {
      case 'undo':
        if (!context.canUndo) {
          return { valid: false, message: 'No moves to undo.' };
        }
        break;
      
      case 'redo':
        if (!context.canRedo) {
          return { valid: false, message: 'No moves to redo.' };
        }
        break;
      
      case 'history':
        if (context.isEmpty) {
          return { valid: false, message: 'No moves yet.' };
        }
        break;
    }
    
    return { valid: true };
  }
}
