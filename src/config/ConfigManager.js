import Conf from 'conf';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Default configuration schema.
 */
const DEFAULT_CONFIG = {
  engine: {
    depth: 15,
    timeout: 5000,
    threads: 1,
  },
  display: {
    colors: true,
    unicode: true,
    showHints: true,
    showEvaluation: true,
    showCaptured: true,
    showMaterial: true,
    theme: 'default',
  },
  game: {
    defaultColor: null,
    autoSave: false,
    saveDirectory: './games',
  },
};

/**
 * Manages application configuration using the conf library.
 * Provides persistent storage of user preferences.
 */
export class ConfigManager {
  constructor() {
    this.config = new Conf({
      projectName: 'chess-helper',
      defaults: DEFAULT_CONFIG,
    });
  }

  /**
   * Get a configuration value.
   * @param {string} key - Configuration key (supports dot notation)
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Configuration value
   */
  get(key, defaultValue = undefined) {
    return this.config.get(key, defaultValue);
  }

  /**
   * Set a configuration value.
   * @param {string} key - Configuration key (supports dot notation)
   * @param {*} value - Value to set
   */
  set(key, value) {
    // Validate and convert value based on key
    const validatedValue = this.validateValue(key, value);
    this.config.set(key, validatedValue);
  }

  /**
   * Check if a configuration key exists.
   * @param {string} key - Configuration key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.config.has(key);
  }

  /**
   * Delete a configuration key.
   * @param {string} key - Configuration key
   */
  delete(key) {
    this.config.delete(key);
  }

  /**
   * Reset configuration to defaults.
   */
  reset() {
    this.config.clear();
    // Re-initialize with defaults
    Object.entries(DEFAULT_CONFIG).forEach(([key, value]) => {
      this.config.set(key, value);
    });
  }

  /**
   * Get all configuration as an object.
   * @returns {Object} All configuration
   */
  getAll() {
    return this.config.store;
  }

  /**
   * Get the configuration file path.
   * @returns {string} Path to configuration file
   */
  getPath() {
    return this.config.path;
  }

  /**
   * Merge configuration with command-line options.
   * CLI options take precedence over stored config.
   * @param {Object} cliOptions - Command-line options
   * @returns {Object} Merged configuration
   */
  mergeWithCliOptions(cliOptions) {
    const config = {
      engine: {
        depth: cliOptions.depth ?? this.get('engine.depth'),
        timeout: this.get('engine.timeout'),
        threads: this.get('engine.threads'),
      },
      display: {
        colors: cliOptions.noColor ? false : this.get('display.colors'),
        unicode: this.get('display.unicode'),
        showHints: cliOptions.hints ?? this.get('display.showHints'),
        showEvaluation: this.get('display.showEvaluation'),
        showCaptured: this.get('display.showCaptured'),
        showMaterial: this.get('display.showMaterial'),
        theme: this.get('display.theme'),
      },
      game: {
        defaultColor: cliOptions.color ?? this.get('game.defaultColor'),
        autoSave: this.get('game.autoSave'),
        saveDirectory: this.get('game.saveDirectory'),
        startFen: cliOptions.fen ?? null,
      },
      debug: cliOptions.debug ?? false,
    };

    return config;
  }

  /**
   * Validate and convert a configuration value.
   * @param {string} key - Configuration key
   * @param {*} value - Value to validate
   * @returns {*} Validated value
   * @throws {Error} If value is invalid
   * @private
   */
  validateValue(key, value) {
    // Engine depth validation
    if (key === 'engine.depth') {
      const depth = parseInt(value);
      if (isNaN(depth) || depth < 1 || depth > 30) {
        throw new Error('Engine depth must be between 1 and 30');
      }
      return depth;
    }

    // Engine timeout validation
    if (key === 'engine.timeout') {
      const timeout = parseInt(value);
      if (isNaN(timeout) || timeout < 100) {
        throw new Error('Engine timeout must be at least 100ms');
      }
      return timeout;
    }

    // Engine threads validation
    if (key === 'engine.threads') {
      const threads = parseInt(value);
      if (isNaN(threads) || threads < 1 || threads > 16) {
        throw new Error('Engine threads must be between 1 and 16');
      }
      return threads;
    }

    // Boolean validations
    if (key.startsWith('display.') || key === 'game.autoSave') {
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      throw new Error(`${key} must be true or false`);
    }

    // Color validation
    if (key === 'game.defaultColor') {
      if (value === null || value === 'null') return null;
      const normalized = value.toLowerCase();
      if (normalized === 'w' || normalized === 'white') return 'w';
      if (normalized === 'b' || normalized === 'black') return 'b';
      throw new Error('Default color must be w, white, b, black, or null');
    }

    // Default: return value as-is
    return value;
  }

  /**
   * Get a formatted string of all configuration.
   * @returns {string} Formatted configuration
   */
  getFormattedConfig() {
    const config = this.getAll();
    let output = 'Current Configuration:\n\n';

    const formatSection = (title, obj, prefix = '') => {
      output += `${title}:\n`;
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          formatSection(`  ${key}`, value, fullKey);
        } else {
          output += `  ${fullKey}: ${value}\n`;
        }
      }
      output += '\n';
    };

    formatSection('Engine', config.engine, 'engine');
    formatSection('Display', config.display, 'display');
    formatSection('Game', config.game, 'game');

    output += `\nConfig file: ${this.getPath()}\n`;

    return output;
  }
}
