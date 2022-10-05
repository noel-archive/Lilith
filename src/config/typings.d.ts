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

/*
 * TypeScript declarations for @lilith/{library} v{version}
 *
 * ## Maintainers
 * - Noel <cutie@floofy.dev> (https://floofy.dev)
 *
 * ## Contributors
 * - Noel <cutie@floofy.dev> (https://floofy.dev)
 */

import { ChildLifecycleEvents } from '@lilith/core';
import { Get } from 'type-fest';
import z from 'zod';

declare namespace Config {
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
  export class ConfigService<Config extends {} = {}> implements ChildLifecycleEvents {
    onLoad(): Promise<void>;
    get<Path extends string, Value extends Get<Config, Path>>(path: Path): unknown extends Value ? null : Value;
    set<Path extends string, Value extends Get<Config, Path>>(path: Path, value: Value): Value;
  }

  /**
   * Represents a base class to load the configuration file from, then serialize it
   * to the {@link Config} object.
   */
  export abstract class BaseLoader<Config = {}> {
    /**
     * Deserializes the content provided and returns it as a {@link Config} object.
     * @param contents The contents to deserialize
     */
    abstract deserialize(contents: string): Config;

    /**
     * Serializes the configuration object into a string!
     * @param config The configuration to serialize
     */
    abstract serialize(config: Config): string;
  }

  export class JsonLoader<Config = {}> extends BaseLoader<Config> {
    /**
     * Deserializes the content provided and returns it as a {@link Config} object.
     * @param contents The contents to deserialize
     */
    deserialize(contents: string): Config;

    /**
     * Serializes the configuration object into a string!
     * @param config The configuration to serialize
     */
    serialize(config: Config): string;
  }

  export class YamlLoader<Config = {}> extends BaseLoader<Config> {
    /**
     * Deserializes the content provided and returns it as a {@link Config} object.
     * @param contents The contents to deserialize
     */
    deserialize(contents: string): Config;

    /**
     * Serializes the configuration object into a string!
     * @param config The configuration to serialize
     */
    serialize(config: Config): string;
  }

  export class TomlLoader<Config = {}> extends BaseLoader<Config> {
    /**
     * Deserializes the content provided and returns it as a {@link Config} object.
     * @param contents The contents to deserialize
     */
    deserialize(contents: string): Config;

    /**
     * Serializes the configuration object into a string!
     * @param config The configuration to serialize
     */
    serialize(config: Config): string;
  }
}

export as namespace Config;
export = Config;
