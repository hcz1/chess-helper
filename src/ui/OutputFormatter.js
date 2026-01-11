/**
 * Formats and displays output to the console.
 * Provides consistent messaging and formatting throughout the application.
 */
export class OutputFormatter {
  /**
   * Display welcome message.
   */
  static welcome() {
    console.log("\n♟ Chess Move Helper\n");
  }

  /**
   * Display engine initialization message.
   */
  static initializing() {
    console.log("⏳ Initializing chess engine...");
  }

  /**
   * Display engine ready message.
   */
  static engineReady() {
    console.log("✅ Engine ready!\n");
  }

  /**
   * Display game start message.
   * @param {string} playerColor - Player's color name ('white' or 'black')
   */
  static gameStart(playerColor) {
    console.log(`\nYou are playing as ${playerColor}. Enter 'quit' to exit.\n`);
  }

  /**
   * Display a move made by a player.
   * @param {string} colorName - Color name ('white' or 'black')
   * @param {string} move - Move in SAN notation
   * @param {boolean} isPlayer - Whether this is the player's move
   */
  static move(colorName, move, isPlayer = false) {
    if (isPlayer) {
      console.log(`You (${colorName}): ${move}`);
    } else {
      console.log(`${colorName}: ${move}\n`);
    }
  }

  /**
   * Display invalid move error.
   */
  static invalidMove() {
    console.log("❌ Invalid move. Please try again.");
    console.log("   Examples: e4, Nf3, e2e4, O-O\n");
  }

  /**
   * Display game over message.
   * @param {Object} gameOverInfo - Game over information
   */
  static gameOver(gameOverInfo) {
    console.log("\n🎮 Game Over!");
    console.log(gameOverInfo.message);
  }

  /**
   * Display check warning.
   */
  static checkWarning() {
    console.log("⚠️  You are in check!\n");
  }

  /**
   * Display goodbye message.
   */
  static goodbye() {
    console.log("\n👋 Thanks for playing!");
  }

  /**
   * Display an error message.
   * @param {string} message - Error message to display
   */
  static error(message) {
    console.error(`\n❌ Fatal error: ${message}`);
  }

  /**
   * Display a warning when move suggestion fails.
   * @param {string} errorMessage - Error message
   */
  static suggestionWarning(errorMessage) {
    console.error(`⚠️  Failed to get move suggestion: ${errorMessage}`);
  }

  /**
   * Display an empty line for readability.
   */
  static emptyLine() {
    console.log();
  }
}
