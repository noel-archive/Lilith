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

import { ReferenceManager } from './references';
import { Collection } from '@augu/collections';
import { getInjectables } from './decorators';
import { randomBytes } from 'crypto';
import * as utils from '@augu/utils';

import { Component, isComponentLike } from './Component';
import { Service, isServiceLike } from './Service';

interface LilithEvents {
  'component.loaded'(component: Component): void;
  'singleton.loaded'(singleton: any): void;
  'service.loaded'(service: Service): void;
  warn(message: string): void;
}

export type ReferenceLike<T> = T extends Component | Service ? T : never;

type DefaultExport<T> = T extends { default: infer P } ? P : T;
function returnFromExport<T extends object>(value: T): DefaultExport<T> {
  return value['default'] !== undefined ? value['default'] : value;
}

/**
 * Main entrypoint to Lilith. This is where all injectables
 * get referenced and are available in.
 */
export default class Application extends utils.EventBus<LilithEvents> {
  /** List of the singletons available to this Application context. */
  public singletons: Collection<string, any> = new Collection();

  /** List of the components available to this Application context. */
  public components: Collection<string, Component> = new Collection();

  /** List of references available to this Application context. */
  public references: ReferenceManager = new ReferenceManager();

  /** List of the services available to this Application context. */
  public services: Collection<string, Service> = new Collection();

  #componentsDir: string | null = null;
  #singletonsDir: string | null = null;
  #servicesDir: string | null   = null;

  /**
   * Verify the current state of Lilith. If anything that wasn't
   * correctly placed, then a [Error] will throw.
   */
  async verify() {
    if (this.#componentsDir === null && this.#servicesDir === null && this.#singletonsDir === null)
      throw new Error('No components, singletons, or services were able to be loaded.');

    // singletons get loaded first because yes
    if (this.#singletonsDir !== null) {
      const singletonList = utils.readdirSync(this.#singletonsDir);
      for (let i = 0; i < singletonList.length; i++) {
        const _import = await import(singletonList[i]);

        const id = randomBytes(4).toString('hex');
        this.references.addReference(id, _import.constructor !== undefined ? _import.constructor : returnFromExport(_import));
        this.singletons.set(id, _import);
        this.emit('singleton.loaded', _import.constructor !== undefined ? _import.constructor : returnFromExport(_import));
      }
    }

    // components get loaded second
    if (this.#componentsDir !== null) {
      const componentList = await Promise.all<utils.Ctor<Component>>(utils.readdirSync(this.#componentsDir).map(file => import(file)));
      const treeList = await Promise.all<Component>(componentList.map(f => f.default ? new f.default() : new f()));

      if (treeList.some(s => !isComponentLike(s)))
        throw new TypeError(`${treeList.filter(u => !isComponentLike(u)).length} files were not a "Component".`);

      const componentTree = treeList.sort((a, b) =>
        b.priority - a.priority
      );

      for (let i = 0; i < componentTree.length; i++) {
        const component = componentTree[i];

        // If the component's priority is lower than 0 and needs
        // other components or services, just throw a error
        // due to how Lilith performs :shrug:
        const injections = getInjectables(component);
        if (component.priority < 0 && injections.length > 0)
          throw new SyntaxError(`Component "${component.name}"'s priority was set to lower than 0 and requires injections. Make the priority higher than zero.`);

        for (const inject of injections) {
          Object.defineProperty(component, inject.property, {
            get: () => this.$ref(inject.ref),
            set: () => {
              throw new SyntaxError(`Injectable "${inject.property}" is a read-only property.`);
            },

            enumerable: true,
            configurable: true
          });
        }

        await component.load?.();

        this.components.set(component.name, component);
        this.references.addReference(component.name, component.constructor);
        this.emit('component.loaded', component);
      }
    }

    // services get loaded last (may require components or singletons)
    if (this.#servicesDir !== null) {
      const servicesList = utils.readdirSync(this.#servicesDir);
      for (let i = 0; i < servicesList.length; i++) {
        const file = servicesList[i];
        const ctor: utils.Ctor<Service> = await import(file);

        const service = ctor.default !== undefined ? new ctor.default() : new ctor();
        const injections = getInjectables(service);

        // Check if any service is requiring another service(s)

        // why the !isComponentLike condition?
        // Since both services and components have names to each other, it can
        // cause race conditions
        if (injections.some($ref => isServiceLike($ref.ref) && !isComponentLike($ref.ref)))
          throw new TypeError('Services cannot inject other services');

        for (const inject of injections) {
          Object.defineProperty(service, inject.property, {
            get: () => this.$ref(inject.ref),
            set: () => {
              throw new SyntaxError(`Injectable "${inject.property}" is a read-only property.`);
            },

            enumerable: true,
            configurable: true
          });
        }

        await service.load?.();
        this.references.addReference(service.name, service.constructor);
        this.services.set(service.name, service);
        this.emit('service.loaded', service);
      }
    }
  }

  /**
   * Return a reference from the reference tree
   * @param reference The reference to find
   */
  $ref<T extends any>(reference: ReferenceLike<T>): T {
    const ref = this.references.get(reference);
    if (!ref)
      throw new TypeError('reference was not found');

    return (
      this.components.has(ref) ? this.components.get(ref)! :
        this.services.has(ref) ? this.services.get(ref)! :
          this.singletons.has(ref) ? this.singletons.get(ref)! : null
    );
  }

  /**
   * Sets the directory to find components in
   * @param dir The directory
   */
  findComponentsIn(dir: string) {
    this.#componentsDir = dir;
    return this;
  }

  /**
   * Sets the directory to find singletons in
   * @param dir The directory
   */
  findSingletonsIn(dir: string) {
    this.#singletonsDir = dir;
    return this;
  }

  /**
   * Sets the directory to find services in
   * @param dir The directory
   */
  findServicesIn(dir: string) {
    this.#servicesDir = dir;
    return this;
  }

  /**
   * Scope a [singleton] value to this [Application]
   * @param singleton The singleton to add
   */
  addSingleton(singleton: any) {
    const id = randomBytes(4).toString('hex');
    this.references.addReference(id, singleton);
    this.singletons.set(id, singleton);
    this.emit('singleton.loaded', singleton);

    return this;
  }

  /**
   * Dispose this [Application] instance.
   */
  dispose() {
    for (const component of this.components.values())
      component.dispose?.();

    for (const service of this.services.values())
      service.dispose?.();

    this.components.clear();
    this.singletons.clear();
    this.services.clear();
  }
}
