import Conf from 'conf';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load default configuration from config/default.json
 * Falls back to built-in defaults if file not found.
 */
function loadDefaultConfig() {
  // Path to config/default.json (relative to project root)
  const configPath = join(__dirname, '../../config/default.json');
  
  // Built-in fallback defaults
  const fallbackDefaults = {
    engine: {
      depth: 15,
      initTimeout: 10000,
      moveTimeout: 30000,
      threads: 1,
      hashSize: 128,
    },
    display: {
      colors: true,
      unicode: true,
      showBoardAfterMove: true,
      showMoveHistory: false,
      showAnalysis: false,
      showCapturedPieces: true,
      showMaterialAdvantage: true,
      showHints: true,
      showEvaluation: true,
      theme: 'default',
    },
    game: {
      defaultColor: null,
      autoSave: false,
      saveDirectory: './games',
      showSuggestions: true,
      validateMoves: true,
    },
    ui: {
      showExamples: true,
      useEmojis: true,
    },
    analysis: {
      showTopMoves: 3,
      analysisDepth: 15,
      showEvaluation: true,
    },
  };

  try {
    if (existsSync(configPath)) {
      const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      // Deep merge file config with fallback defaults
      return deepMerge(fallbackDefaults, fileConfig);
    }
  } catch (error) {
    console.warn(`Warning: Could not load config/default.json: ${error.message}`);
  }
  
  return fallbackDefaults;
}

/**
 * Deep merge two objects.
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

const DEFAULT_CONFIG = loadDefaultConfig();

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
        initTimeout: this.get('engine.initTimeout'),
        moveTimeout: this.get('engine.moveTimeout'),
        threads: this.get('engine.threads'),
        hashSize: this.get('engine.hashSize'),
      },
      display: {
        colors: cliOptions.noColor ? false : this.get('display.colors'),
        unicode: this.get('display.unicode'),
        showBoardAfterMove: this.get('display.showBoardAfterMove'),
        showMoveHistory: this.get('display.showMoveHistory'),
        showAnalysis: this.get('display.showAnalysis'),
        showCapturedPieces: this.get('display.showCapturedPieces'),
        showMaterialAdvantage: this.get('display.showMaterialAdvantage'),
        showHints: cliOptions.hints ?? this.get('display.showHints'),
        showEvaluation: this.get('display.showEvaluation'),
        theme: this.get('display.theme'),
      },
      game: {
        defaultColor: cliOptions.color ?? this.get('game.defaultColor'),
        autoSave: this.get('game.autoSave'),
        saveDirectory: this.get('game.saveDirectory'),
        showSuggestions: this.get('game.showSuggestions'),
        validateMoves: this.get('game.validateMoves'),
        startFen: cliOptions.fen ?? null,
      },
      ui: this.get('ui'),
      analysis: this.get('analysis'),
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
    if (key === 'engine.depth' || key === 'analysis.analysisDepth') {
      const depth = parseInt(value);
      if (isNaN(depth) || depth < 1 || depth > 30) {
        throw new Error('Depth must be between 1 and 30');
      }
      return depth;
    }

    // Engine timeout validation
    if (key === 'engine.initTimeout' || key === 'engine.moveTimeout') {
      const timeout = parseInt(value);
      if (isNaN(timeout) || timeout < 100) {
        throw new Error('Timeout must be at least 100ms');
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

    // Engine hash size validation
    if (key === 'engine.hashSize') {
      const hashSize = parseInt(value);
      if (isNaN(hashSize) || hashSize < 1 || hashSize > 4096) {
        throw new Error('Hash size must be between 1 and 4096 MB');
      }
      return hashSize;
    }

    // Analysis top moves validation
    if (key === 'analysis.showTopMoves') {
      const topMoves = parseInt(value);
      if (isNaN(topMoves) || topMoves < 1 || topMoves > 10) {
        throw new Error('Show top moves must be between 1 and 10');
      }
      return topMoves;
    }

    // Boolean validations for display, game, ui, and analysis settings
    const booleanKeys = [
      'display.', 'ui.', 'analysis.showEvaluation',
      'game.autoSave', 'game.showSuggestions', 'game.validateMoves'
    ];
    if (booleanKeys.some(prefix => key.startsWith(prefix) || key === prefix)) {
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
      if (!obj) return;
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
    formatSection('UI', config.ui, 'ui');
    formatSection('Analysis', config.analysis, 'analysis');

    output += `\nUser config file: ${this.getPath()}\n`;
    output += `Default config: config/default.json\n`;

    return output;
  }
}
