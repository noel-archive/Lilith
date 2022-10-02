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

import { ChildLifecycleEvents, Service, useContainer } from '@lilith/core';
import type { BaseLoader } from './loaders';
import { existsSync } from 'fs';
import { get, set } from 'dot-prop';
import { readFile } from 'fs/promises';
import { isObject } from '@noelware/utils';
import type { Get } from 'type-fest';
import type z from 'zod';

export interface ConfigServiceOptions<
  Config,
  Schema extends z.ZodObject<Record<string, any>> = z.ZodObject<Record<string, any>>
> {
  schema?: Schema;
  loader: BaseLoader<Config>;
  file: string;
}

/**
 * Represents a service to load a configuration file with a specific loader and you can
 * use variables from the container to inject from this service.
 *
 * ## Example
 * ```ts
 * import { Inject, Service, createLilith } from '@lilith/core';
 * import { ConfigService, YamlLoader } from '@lilith/config';
 *
 * interface Config {
 *   beeps: true
 * }
 *
 * (@)Service({ name: 'my service' })
 * class MyService {
 *   (@)Inject private readonly config!: ConfigService<Config>;
 *
 *   onLoad() {
 *     this.config.get('beeps');
 *     // => boolean
 *   }
 * }
 *
 * const container = createLilith<Config>({
 *     singletons: [MySingleton],
 *     services: [
 *         new ConfigService<Config>({ loader: new YamlLoader(), file: './my/file/path.yaml' })
 *     ]
 * });
 *
 * container.start();
 * ```
 */
@Service({ name: 'lilith:config', priority: 100 })
export class ConfigService<Config extends {} = {}> implements ChildLifecycleEvents {
  private readonly _schema?: z.ZodObject<Record<string, any>>;
  private readonly _loader: BaseLoader<Config>;
  private readonly _path: string;
  private _config: Config = null!;

  constructor({ schema, loader, file }: ConfigServiceOptions<Config>) {
    this._schema = schema;
    this._loader = loader;
    this._path = file;
  }

  async onLoad() {
    // Check if the file exists
    if (!existsSync(this._path)) throw new Error(`Path [${this._path}] doesn't exist!`);

    // Now, let's see if we can load it from the loader
    const contents = await readFile(this._path, 'utf-8');
    this._config = this._loader.deserialize(contents);

    // Check if Zod is installed
    if (this._schema !== undefined) {
      const isAvailable = (() => {
        try {
          require('zod');
          return true;
        } catch {
          return false;
        }
      })();

      if (!isAvailable) throw new Error('Schema was provided but `zod` was not installed?');
      await this._schema!.safeParseAsync(this._config);
    }

    const recurse = <T extends {} = {}>(obj: T, current?: string) => {
      const results: Record<string, any> = {};
      for (const key in obj) {
        const value = obj[key];
        const newKey = current ? `${current}.${key}` : key;
        if (value && isObject(value)) {
          recurse(value, newKey);
        } else {
          results[newKey] = value;
        }
      }

      return results;
    };

    const results = recurse(this._config);
    const container = useContainer<Config>();
    for (const [key, value] of Object.entries(results)) {
      container.addVariable(key as unknown as any, value);
    }
  }

  get<Path extends string, Value extends Get<Config, Path>>(path: Path): unknown extends Value ? null : Value {
    const result = get(this._config, path);
    if (result === undefined) return null as any;

    return result as any;
  }

  set<Path extends string, Value extends Get<Config, Path>>(path: Path, value: Value): Value {
    set(this._config, path, value);
    return this.get(path)!;
  }
}
