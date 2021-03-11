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

import { Collection, Queue } from '@augu/collections';
import { ReferenceManager } from './references';
import { getInjectables } from './decorators';
import { basename } from 'path';
import * as utils from '@augu/utils';

import { Component, isComponentLike } from './Component';
import { Service, isServiceLike } from './Service';
import Singleton from './Singleton';

interface LilithEvents {
  'component.loaded'(component: Component): void;
  'singleton.loaded'(singleton: Singleton<any>): void;
  'service.loaded'(service: Service): void;
  warn(message: string): void;
}

/**
 * Main entrypoint to Lilith. This is where all injectables
 * get referenced and are available in.
 */
export default class Application extends utils.EventBus<LilithEvents> {
  /** List of the singletons available to this Application context. */
  public singletons: Queue<Singleton<any>> = new Queue();

  /** List of the components available to this Application context. */
  public components: Collection<string, Component> = new Collection();

  /** List of references available to this Application context. */
  public references: ReferenceManager = new ReferenceManager(this);

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
        let filename = basename(singletonList[i]); // since singletons are mostly exports, we'll just use the filename
        const singleton = new Singleton(_import);

        // can be used with ts-node
        const ext = filename.endsWith('.ts') ? '.ts' : '.js';
        filename = basename(singletonList[i], ext);

        this.references.addReference('singleton', filename, _import);
        this.singletons.push(singleton);
        this.emit('singleton.loaded', singleton);
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

        await Promise.resolve(component.load?.());

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

        this.components.set(component.name, component);
        this.references.addReference('component', component.name, component);
        this.emit('component.loaded', component);
      }
    }

    // services get loaded last (may require components or singletons)
    if (this.#servicesDir !== null) {
      const servicesList = utils.readdirSync(this.#servicesDir);
    }
  }
}

// ping pong ur gay owo ice qt
// brooooo :flushed:
// owo
