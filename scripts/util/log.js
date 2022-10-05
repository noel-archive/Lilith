/*
 * 🧵 Lilith: Application framework for TypeScript to build robust, and simple services
 * Copyright (c) 2021-2022 Noelware <team@noelware.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// @ts-check

const { colors, styles } = require('leeks.js');
const logSymbols = require('log-symbols');
const { format } = require('util');

/** Represents a factory for constructing loggers. */
class LoggerFactory {
  constructor() {
    /** @type {LogLevelObject} */
    this.levels = {
      success: { color: colors.green, symbol: logSymbols.success },
      error: { color: colors.red, symbol: logSymbols.error },
      info: { color: colors.cyan, symbol: logSymbols.info },
      warn: { color: colors.yellow, symbol: logSymbols.warning }
    };
  }

  /**
   * Returns a new logger for the name specified.
   * @param {string} name The name of the logger.
   * @returns {Logger} The logger object
   */
  get(name) {
    return {
      name,
      success: (...args) =>
        console.log(
          `[${colors.gray(name)}] ${this.levels.success.color(this.levels.success.symbol)} ${this.levels.success.color(
            styles.bold('SUCCESS')
          )} ~> ${format(args[0], ...args.slice(1))}`
        ),

      error: (...args) =>
        console.error(
          `[${colors.gray(name)}] ${this.levels.error.color(this.levels.error.symbol)} ${this.levels.error.color(
            styles.bold('ERROR')
          )} ~> ${format(args[0], ...args.slice(1))}`
        ),

      warn: (...args) =>
        console.error(
          `[${colors.gray(name)}] ${this.levels.warn.color(this.levels.warn.symbol)} ${this.levels.warn.color(
            styles.bold('WARN')
          )} ~> ${format(args[0], ...args.slice(1))}`
        ),

      info: (...args) =>
        console.error(
          `[${colors.gray(name)}] ${this.levels.info.color(this.levels.info.symbol)} ${this.levels.info.color(
            styles.bold('INFO')
          )} ~> ${format(args[0], ...args.slice(1))}`
        )
    };
  }
}

module.exports = new LoggerFactory();

/**
 * @typedef {{ [x in 'info' | 'error' | 'success' | 'warn']: LogLevelInfo; }} LogLevelObject
 * @typedef {object} LogLevelInfo
 * @prop {(t: string) => string} color The color function to use
 * @prop {string} symbol The log symbol to use
 *
 * @typedef {{ [x in 'info' | 'error' | 'success' | 'warn' ]: (...args: any[]) => void; } & { name: string }} Logger
 */
