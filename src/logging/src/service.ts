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

import { Service, useContainer, type ChildLifecycleEvents } from '@lilith/core';
import { LogLevel, LogLevelInt } from './types';
import type { LoggerFactory } from './factory';
import { BaseBackend } from './backends/base.backend';
import { Logger } from './logger';

export interface LogServiceOptions<B extends BaseBackend> {
  attachDebugToLogger?: boolean;
  backend: B;
  level?: LogLevel | LogLevelInt;
}

// the log service should have a higher priority since the configuration service
// might use it.
@Service({ name: 'lilith:logging', priority: 1000 })
export class LogService<B extends BaseBackend> implements ChildLifecycleEvents {
  private _defaultLevel: number;
  private _factory: LoggerFactory;
  private _backend: B;
  private _options: LogServiceOptions<B>;
  private _logger: Logger;

  constructor(options: LogServiceOptions<B>) {
    this._defaultLevel = (typeof options.level === 'string' ? LogLevel[options.level] : options.level) ?? 40;
    this._factory = options.backend.getLoggerFactory();
    this._backend = options.backend;
    this._options = options;
    this._logger = this._factory.get('root');
  }

  get loggerFactory(): B extends BaseBackend<any, infer LF> ? LF : never {
    return this._factory as unknown as any;
  }

  onLoad() {
    const container = useContainer();

    // It will attach to the root logger!
    if (this._options.attachDebugToLogger !== undefined && this._options.attachDebugToLogger) {
      this._logger.debug('Attaching container event [debug] to root logger!');
      container.on('debug', (message) => this._logger.debug(message));
    }

    // container.on('service:register', (service) => {
    //   container.emit('debug', `Registering @Log decorators for service ${service.$ref.constructor.name}!`);

    //   const injections: LogInjectionMeta[] = Reflect.getMetadata(LogMetaKey, service.$ref.constructor) ?? [];
    //   for (const inject of injections) {
    //     const self = this; // eslint-disable-line
    //     console.log(service.$ref, inject);
    //     Object.defineProperty(service.$ref, inject.property, {
    //       get() {
    //         return self._factory.get(...inject.name);
    //       },

    //       set() {
    //         throw new Error('@Log decorators are not mutable.');
    //       },

    //       configurable: false,
    //       enumerable: true
    //     });
    //   }
    // });
  }

  onDestroy() {
    this._backend.close();
  }

  enabled(level: number) {
    return this._defaultLevel <= level;
  }
}
