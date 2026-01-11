import readline from "readline";

/**
 * Handles user input via readline interface.
 * Manages prompting and input collection from the user.
 */
export class InputHandler {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Ask a question and wait for user input.
   * @param {string} question - Question to display to user
   * @returns {Promise<string>} User's input
   */
  async ask(question) {
    return new Promise((resolve) => this.rl.question(question, resolve));
  }

  /**
   * Get the player's color choice.
   * @returns {Promise<string>} 'w' or 'b'
   * @throws {Error} If invalid color is entered
   */
  async getPlayerColor() {
    const colour = (await this.ask("Are you playing white or black? (w/b): ")).toLowerCase();
    
    if (colour !== "w" && colour !== "b") {
      throw new Error("Invalid color choice. Please enter 'w' or 'b'");
    }
    
    return colour;
  }

  /**
   * Get a move from the user.
   * @param {string} prompt - Prompt to display
   * @returns {Promise<string>} User's move input
   */
  async getMove(prompt) {
    return await this.ask(prompt);
  }

  /**
   * Close the readline interface and clean up.
   */
  close() {
    try {
      this.rl.close();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}
