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

import { ChildLifecycleEvents } from '@lilith/core';
import { Constructor } from 'type-fest';

/*
 * TypeScript declarations for @lilith/{library} v{version}
 *
 * ## Maintainers
 * - Noel <cutie@floofy.dev> (https://floofy.dev)
 *
 * ## Contributors
 * - Noel <cutie@floofy.dev> (https://floofy.dev)
 */

declare namespace Logging {
  /** Represents the log levels as strings. Use {@link LogLevelInt} to get the number representing this level. */
  export type LogLevel = 'info' | 'error' | 'fatal' | 'warn' | 'debug' | 'trace';

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
  export const LogLevel: { [x in LogLevel]: LogLevelInt };
  export const LogLevelInt: { [x in LogLevelInt]: LogLevel };

  /**
   * Represents a logger that can be used to log anything. You can create a logger in the following ways:
   *
   * - (1) By using the `@Log` annotation,
   * - (2) By using the **LoggerFactory#get** method.
   *
   * Using this interface is not recommended, but it's public API!
   */
  export interface Logger
    extends Record<'info' | 'debug' | 'error' | 'fatal' | 'trace' | 'warn', (...messages: unknown[]) => void> {
    /** Returns the name of the logger */
    name: string;
  }

  export type BaseBackendOptions<O = {}> = _BaseBackendOptions & O;

  export interface _BaseBackendOptions {
    defaultLevel?: LogLevel | LogLevelInt;
  }

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

  /**
   * Represents a base implementation of creating your own log backend. This is responsible for:
   * - writing data to a logger,
   * - creating the logger factory,
   * - creating loggers internally.
   */
  export abstract class BaseBackend<Options extends {} = {}, LF extends LoggerFactory = LoggerFactory> {
    constructor(options: BaseBackendOptions<Options>);

    public options: Options;

    /**
     * Returns the default level for this {@link BaseBackend backend} to use when
     * writing to loggers.
     */
    public defaultLevel: LogLevelInt;

    /**
     * Returns the logger factory that this backend is responsible for.
     */
    abstract getLoggerFactory(): LF;
  }

  /** Type-alias to infer the options object from a {@link BaseBackend} class. */
  export type InferBackendOptions<B> = B extends BaseBackend<infer Options, any> ? Options : never;
  export interface LogServiceOptions<B extends BaseBackend> {
    backend: {
      class: Constructor<B, [InferBackendOptions<B> | undefined]>;
      options?: InferBackendOptions<B>;
    };

    attachDebugToLogger?: boolean;
    level?: LogLevel | LogLevelInt;
  }

  /**
   * Represents the service to construct loggers, or to initialize logging into your Lilith
   * container. You will need a {@link BaseBackend backend} to use this service since this library
   * doesn't provide a default backend system.
   *
   * #### Available Backends
   * - [@lilith/logging-winston](https://npm.im/@lilith/logging-winston)
   *
   * @example
   * ```ts
   * import { Service, Inject, createLilith } from '@lilith/core';
   * import { WinstonBackend } from '@lilith/logging-winston';
   * import { LogService } from '@lilith/logging';
   *
   * (@)Service
   * class MyService {
   *   (@)Inject
   *   private readonly logging!: LogService<WinstonBackend>;
   *
   *   onLoad() {
   *     const logger = this.logging.loggerFactory.get('myservice');
   *     logger.info('Log!');
   *   }
   * }
   *
   * const container = createLilith({
   *   services: [MyService, new LogService({
   *     backend: { class: new WinstonBackend(), options: { {winston backend options} } }
   *   })]
   * });
   *
   * container.start();
   * ```
   */
  export class LogService<B extends BaseBackend> implements ChildLifecycleEvents {
    /**
     * @param options The options for creating this {@link LogService}.
     */
    constructor(options: LogServiceOptions<B>);

    /**
     * Returns the factory to construct loggers.
     */
    get loggerFactory(): B extends BaseBackend<any, infer LF> ? LF : never;

    /**
     * @inheritDoc ChildLifecycleEvents.onDestroy
     */
    onLoad(): void;

    /**
     * @inheritDoc ChildLifecycleEvents.onDestroy
     */
    onDestroy(): void;
  }
}

export as namespace Logging;
export = Logging;
