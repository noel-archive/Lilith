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

/** Represents the log levels as strings. Use {@link LogLevelInt} to get the number representing this level. */
export type LogLevel = 'info' | 'error' | 'fatal' | 'warning' | 'debug' | 'trace';

/**
 * Represents the log level as integers:
 *
 * - 10: fatal
 * - 20: error
 * - 30: warning
 * - 40: info
 * - 50: debug
 * - 60: trace
 */
export type LogLevelInt = 10 | 20 | 30 | 40 | 50 | 60;
export const LogLevel: { [x in LogLevel]: LogLevelInt } = {
  info: 40,
  error: 20,
  fatal: 10,
  warning: 30,
  debug: 40,
  trace: 50
};

export const LogLevelInt: { [x in LogLevelInt]: LogLevel } = {
  10: 'fatal',
  20: 'error',
  30: 'warning',
  40: 'info',
  50: 'debug',
  60: 'trace'
};

/**
 * Represents the record of the log information.
 */
export interface LogRecord<Extra extends {} = { properties: unknown[] }> {
  /** Returns the stacktrace, if used by the `error`, `fatal`, or `trace` log levels. */
  stacktrace?: NodeJS.CallSite[];

  /** Returns the timestamp in nanoseconds. */
  timestamp: bigint;

  /** Returns the worker name (if used by the `cluster` module). Returns undefined if not in a clustered environment. */
  worker?: string;

  /** The log message that was emitted */
  message: string;

  /** The error, if any. */
  error?: Error;

  /** Any extra data that was contained from the log message. */
  extra?: Extra;

  /** The level as the integer representative. Use {@link LogLevelInt} to convert it from int -> string */
  level: LogLevelInt;

  /** The logger's full name */
  name: string;

  /** Object to determine if we are in Node.js, the browser, or a Web Worker */
  is: { node: boolean; browser: boolean; webworker: boolean };
}
