/**
 * Copyright (c) 2021 August
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

import { Singleton, Application } from '..';
import { Collection } from '@augu/collections';

export type SingletonReturnValue<T> = T extends Singleton<infer P> ? P : T;

/**
 * Represents a storage manager for holding references to singletons, components
 * and services. Use `ReferenceManager.$ref` to retrieve a reference.
 */
export default class ReferenceManager extends Collection<any, string> {
  #app: Application;

  constructor(app: Application) {
    super();

    this.#app = app;
  }

  /**
   * Adds a reference to this [ReferenceManager]
   * @param type The type of reference to add
   * @param name The reference's name
   * @param ref The reference value to place
   */
  addReference(type: 'component' | 'singleton' | 'service', name: string, ref: any) {
    switch (type) {
      case 'component':
        this.#app.components.set(name, ref);
        return this;

      case 'singleton':
        this.#app.singletons.set(name, new Singleton(ref));
        break;

      case 'service':
        this.#app.services.set(name, ref);
        break;

      default:
        throw new TypeError(`Expecting literal value "component", "singleton", or "service". Received ${type}.`);
    }

    // add it to this reference tree
    this.set(ref, name);
    return this;
  }
}
