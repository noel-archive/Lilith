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
import type { Constructor } from 'type-fest';
import { BaseBackend } from './backends/base.backend';
import { Logger } from './logger';
import { LogInjectionMeta, LogMetaKey } from './decorators/Log';

export type InferBackendOptions<B> = B extends BaseBackend<infer Options, any, any> ? Options : never;

export interface LogServiceOptions<B extends BaseBackend> {
  backend: {
    class: Constructor<B, [InferBackendOptions<B> | undefined]>;
    options?: InferBackendOptions<B>;
  };

  attachDebugToLogger?: boolean;
  level?: LogLevel | LogLevelInt;
}

// the log service should have a higher priority since the configuration service
// might use it.
@Service({ name: 'lilith:logging', priority: 1000 })
export class LogService<B extends BaseBackend> implements Omit<Logger, 'name'>, ChildLifecycleEvents {
  private _defaultLevel: number;
  private _factory: LoggerFactory;
  private _backend: B;
  private _options: LogServiceOptions<B>;
  private _logger: Logger;

  public info!: (...messages: unknown[]) => void;
  public warn!: (...messages: unknown[]) => void;
  public trace!: (...messages: unknown[]) => void;
  public debug!: (...messages: unknown[]) => void;
  public fatal!: (...messages: unknown[]) => void;
  public error!: (...messages: unknown[]) => void;

  // 'info' | 'debug' | 'error' | 'fatal' | 'trace' | 'warning'

  constructor(options: LogServiceOptions<B>) {
    const backend = new options.backend.class(
      options.backend.options !== undefined ? options.backend.options : undefined
    );

    this._defaultLevel = (typeof options.level === 'string' ? LogLevel[options.level] : options.level) ?? 40;
    this._factory = backend.getLoggerFactory();
    this._backend = backend;
    this._options = options;
    this._logger = this._factory.get('root');

    // The log service will use the root logger. You should use `LoggerFactory#get` or
    // the @Log annotation.
    for (const level of Object.keys(LogLevel)) {
      this[level.toLowerCase()] = function (this: LogService<B>, ...messages: unknown[]) {
        if (this.enabled(LogLevel[level])) return this._log.call(this, ...messages);
      };
    }
  }

  onLoad() {
    const container = useContainer();

    // It will attach to the root logger!
    if (this._options.attachDebugToLogger !== undefined && this._options.attachDebugToLogger) {
      container.on('debug', (message) => this.debug(message));
    }

    container.on('service:register', (service) => {
      container.emit('debug', `Registering @Log decorators for service ${service.constructor.name}!`);

      const injections: LogInjectionMeta[] = Reflect.getMetadata(LogMetaKey, service.constructor);
      for (const inject of injections) {
        Object.defineProperty(service, inject.property, {
          value: this._factory.get(...inject.name),
          configurable: false,
          enumerable: true,
          writable: false
        });
      }
    });
  }

  onDestroy() {
    this._backend.close();
  }

  enabled(level: number) {
    return this._defaultLevel <= level;
  }

  private _log(...messages: unknown[]) {
    return null;
  }
}
