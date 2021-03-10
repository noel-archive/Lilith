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

import type { Component, Service, Singleton } from '..';
import { Collection } from '@augu/collections';

export type ReferenceLike<T> = T extends Component | Service | Singleton
  ? T
  : T extends string
    ? string
    : never;

export type SingletonReturnValue<T> = T extends Singleton<infer P> ? P : T;

/**
 * Represents a storage manager for holding references to singletons, components
 * and services. Use `ReferenceManager.$ref` to retrieve a reference.
 */
export default class ReferenceManager extends Collection<any, string> {
  // (private) List of singletons registered
  private singletons: Collection<string, Singleton<any>> = new Collection();

  // (private) List of the components registered
  private components: Collection<string, Component> = new Collection();

  // (private) List of services registered
  private services:   Collection<string, Service>   = new Collection();

  /**
   * Retrieve the reference of a [Component].
   * @param component The component to look for
   */
  $ref(component: Component): Component;

  /**
   * Retrieve the singleton's value from it's class
   * @param singleton The singleton class to use (use `Application.singleton(<name>)` to get it)
   */
  $ref<T extends Singleton<any>>(singleton: T): SingletonReturnValue<T>;

  /**
   * Retrieve a service from it's service class
   * @param service The service to find
   * @returns The service found or a [TypeError] thrown if not found.
   */
  $ref(service: Service): Service;

  /**
   * Retrieve a reference by it's name
   * @param name The name of the reference
   * @returns The reference value if found or a [TypeError]
   * thrown if not found.
   */
  $ref(name: string): Component | Singleton<any> | Service;

  /**
   * Retrive a reference by it's name or class.
   * @param reference The reference to retrieve from
   * @returns The reference's name or `null` if not found.
   */
  $ref<T extends Component | Service | Singleton<any>>(reference: ReferenceLike<T>) {
    if (typeof reference === 'string') {
      const ref = this.find(name => name === reference);
      if (!ref)
        throw new TypeError(`Reference by name '${reference}' wasn\'t found.`);

      return ref;
    }

    const $ref = this.get(reference);
    if (!$ref)
      throw new TypeError(`Reference by class ${reference} was not found.`);

    return $ref; // return the reference name
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
        this.components.set(name, ref);
        return this;

      case 'singleton':
        this.singletons.set(name, new Singleton(ref));
        break;

      case 'service':
        this.services.set(name, ref);
        break;

      default:
        throw new TypeError(`Expecting literal value "component", "singleton", or "service". Received ${type}.`);
    }

    // add it to this reference tree
    this.set(ref, name);
    return this;
  }
}
