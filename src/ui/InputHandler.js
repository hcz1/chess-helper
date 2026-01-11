import readline from "readline";
import chalk from "chalk";
import { CommandParser } from "./CommandParser.js";

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

    this.closed = false;
    
    // Handle readline close event
    this.rl.on('close', () => {
      this.closed = true;
    });
  }

  /**
   * Ask a question and wait for user input.
   * @param {string} question - Question to display to user
   * @returns {Promise<string>} User's input
   */
  async ask(question) {
    if (this.closed) {
      throw new Error('readline was closed');
    }
    return new Promise((resolve, reject) => {
      this.rl.question(chalk.cyan(question), (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Get the player's color choice.
   * @returns {Promise<string>} 'w' or 'b'
   * @throws {Error} If invalid color is entered
   */
  async getPlayerColor() {
    const colour = (
      await this.ask("Are you playing white or black? (w/b): ")
    ).toLowerCase();

    if (colour !== "w" && colour !== "b") {
      throw new Error("Invalid color choice. Please enter 'w' or 'b'");
    }

    return colour;
  }

  /**
   * Get a move from the user.
   * @param {string} prompt - Prompt to display
   * @param {string} [suggestedMove] - Optional suggested move (used when Enter is pressed)
   * @returns {Promise<string>} User's move input
   */
  async getMove(prompt, suggestedMove = null) {
    const input = await this.ask(prompt);

    // If input is empty and we have a suggested move, use it
    if (input.trim() === "" && suggestedMove) {
      return suggestedMove;
    }

    return input;
  }

  /**
   * Check if input is a command.
   * @param {string} input - User input
   * @returns {boolean} True if input is a command
   */
  isCommand(input) {
    return CommandParser.isCommand(input);
  }

  /**
   * Parse a command from user input.
   * @param {string} input - User input
   * @returns {Object|null} Parsed command object or null
   */
  parseCommand(input) {
    return CommandParser.parseCommand(input);
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
