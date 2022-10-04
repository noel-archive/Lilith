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

import type { LoggerFactory } from '../factory';
import type { LogRecord } from '../types';
import type { Logger } from '../logger';

/**
 * Represents a base implementation of creating your own log backend. This is responsible for:
 * - writing data to a logger,
 * - creating the logger factory,
 * - creating loggers internally.
 */
export abstract class BaseBackend<
  Options extends {} = {},
  LF extends LoggerFactory = LoggerFactory,
  LoggerImpl extends Logger = Logger
> {
  /**
   * Writes and flushes a record to the logger.
   * @param record The record object that is created from the log service.
   */
  abstract write(record: LogRecord<any>): void;

  /**
   * Gets, or creates a logger by the specified path.
   * @param paths The path to use.
   */
  abstract getLogger(...paths: string[]): LoggerImpl;

  /**
   * Returns the logger factory that this backend is responsible for.
   */
  abstract getLoggerFactory(): LF;

  /**
   * Closes and flushes any previous cached log records to the appenders it was configured
   * to use. This should be an idempotent call, so subsequent calls can't prevent this being
   * closed already.
   */
  close() {
    /* do nothing */
  }
}
