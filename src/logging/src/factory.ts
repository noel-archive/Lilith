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

import { Logger } from './logger';

/**
 * Represents a factory for constructing loggers! You should probably use the `LogFactory`
 * class to use this interface.
 */
export interface LoggerFactory {
  /**
   * Returns this factory's log seperator, which can be changed at runtime.
   */
  get seperator(): string;

  /**
   * Sets the factory's log seperator, and update every logger's name to use that
   * seperator. If this was changed while logs were committed, only new flushed logs
   * will use the seperator.
   *
   * @param value The seperator to use.
   */
  set seperator(value: string);

  /**
   * Returns a logger by the given paths. All paths that are given use `.` as the seperator! You can
   * configure the seperator using `LogFactory.seperator = ';'` at runtime if you wish.
   *
   * @param paths The paths that are conjuctioned with the factory's seperator.
   * @example
   * ```ts
   * import { LogFactory } from '@lilith/logging';
   *
   * LogFactory.get('a', 'log', 'name');
   * // => Logger { name: 'a.log.name' }
   * ```
   */
  get(...paths: string[]): Logger;
}
