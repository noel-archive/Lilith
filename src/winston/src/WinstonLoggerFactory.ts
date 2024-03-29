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

import { LoggerFactory, LogLevelInt } from '@lilith/logging';
import { WinstonBackend } from './WinstonBackend';
import { WinstonLogger } from './WinstonLogger';
import { createLogger } from 'winston';

export class WinstonLoggerFactory implements LoggerFactory {
  private _loggers: Map<string, Logger> = new Map();
  private _seperator: string = '.';

  constructor(private readonly backend: WinstonBackend) {}

  get seperator() {
    return this._seperator;
  }

  set seperator(value: string) {
    this._seperator = value;
  }

  get(...paths: string[]) {
    const name = paths.join(this._seperator);
    if (this._loggers.has(name)) return this._loggers.get(name)!;

    const logger = new WinstonLogger(
      name,
      createLogger({
        transports: this.backend.options.transports,
        format: this.backend.options.format,
        level: LogLevelInt[this.backend.defaultLevel],
        defaultMeta: {
          name
        }
      })
    );

    this._loggers.set(name, logger);
    return logger;
  }
}
