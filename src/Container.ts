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

import { BaseComponent, BaseService, BaseSingleton, MetadataKeys, PendingInjectDefinition, ReferredObjectDefinition, ImportedDefaultExport } from './types';
import { randomBytes } from 'crypto';
import { Collection } from '@augu/collections';
import * as utils from '@augu/utils';

/**
 * The container events used for the [[Container]].
 */
interface ContainerEvents {
  /**
   * Emitted before we initialize a child to the parent component or service
   *
   * @param cls The component or service
   * @param child The child of the parent, the child has access
   * to the parent with `child.parent`.
   */
  onBeforeChildInit(cls: BaseComponent | BaseService, child: any): void;

  /**
   * Emitted after we initialize a child to the parent component or service
   *
   * @param cls The component or service
   * @param child The child of the parent, the child has access
   * to the parent with `child.parent`.
   */
  onAfterChildInit(cls: BaseService | BaseComponent, child: any): void;

  /**
   * Emitted before we initialize a component or service
   * @param cls The component or service in mind
   */
  onBeforeInit(cls: BaseComponent | BaseService): void;

  /**
   * Emitted after we initialize the component or service
   * @param cls The component or service in mind
   */
  onAfterInit(cls: BaseService | BaseComponent): void;

  /**
   * Emitted when a debug event has happened
   * @param message The message
   */
  debug(message: string): void;
}

/**
 * Represents the container's options
 */
interface ContainerOptions {
  /**
   * The directory to the component tree
   */
  componentsDir?: string;

  /**
   * The directory to the services tree
   */
  servicesDir?: string;

  /**
   * A list of singletons to bulk add
   */
  singletons?: any[];
}

export const isComponentLike = (value: unknown): value is BaseComponent => utils.isObject(value) && (value as BaseComponent).type === 'component';
export const isServiceLike   = (value: unknown): value is BaseService   => utils.isObject(value) && (value as BaseService).type === 'service';

function returnFromExport<T extends object>(value: T): ImportedDefaultExport<T> {
  return value['default'] !== undefined ? value['default'] : value;
}

/**
 * Represents a "container" of components, singletons, and services. This is the main
 * entrypoint to Lilith, this is your creation tool to create your application! **(\*≧∀≦\*)**
 */
export class Container extends utils.EventBus<ContainerEvents> {
  /**
   * The component tree for this [[Container]]
   */
  public components: Collection<string, BaseComponent> = new Collection();

  /**
   * The singleton tree for this [[Container]]
   */
  public singletons: Collection<string, BaseSingleton> = new Collection();

  /**
   * The services tree for this [[Container]]
   */
  public services: Collection<string, BaseService> = new Collection();

  #componentsDir?: string;
  #servicesDir?: string;
  #references: Collection<any, string>;

  /**
   * Represents a "container" of components, singletons, and services. This is the main
   * entrypoint to Lilith, this is your creation tool to create your application! **(\*≧∀≦\*)**
   *
   * @param options Any additional options to use
   */
  constructor(options?: ContainerOptions) {
    super();

    this.#componentsDir = options?.componentsDir;
    this.#servicesDir = options?.servicesDir;
    this.#references = new Collection();

    if (options?.singletons?.length)
      this.addSingletons(options.singletons!);
  }

  /**
   * Initializes all components, services, and singletons.
   */
  async load() {
    if (this.#componentsDir === undefined)
      throw new Error('This container is missing a component directory since components are crucial to Lilith.');

    const pending: (BaseService | BaseComponent)[] = [];

    // Components
    const componentList = utils.readdirSync(this.#componentsDir, { exclude: ['.js.map'] });
    if (componentList.length === 0)
      throw new Error('Missing components to initialize');

    this.emit('debug', `Registering ${componentList.length} pending components...`);
    for (let i = 0; i < componentList.length; i++) {
      const file = componentList[i];
      const imported: utils.Ctor<any> = await import(file);

      if (imported.default === undefined) {
        this.emit('debug', `Missing default export -> ${file} (skipping)`);
        continue;
      }

      const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Component, imported.default);
      if (metadata === undefined)
        throw new SyntaxError('Missing @Component decorator');

      pending.push({
        _classRef: imported.default,
        priority: metadata.priority,
        children: metadata.children ?? [],
        type: 'component',
        name: metadata.name
      });

      this.#references.set(imported.default, metadata.name);
    }

    if (this.#servicesDir !== undefined) {
      const serviceList = utils.readdirSync(this.#servicesDir, { exclude: ['.js.map'] });
      this.emit('debug', `Registering ${serviceList.length} pending services...`);
      for (let i = 0; i < serviceList.length; i++) {
        const file = serviceList[i];
        const imported: utils.Ctor<any> = require(file);

        if (imported.default === undefined) {
          this.emit('debug', `Missing default export -> ${file} (skipping)`);
          continue;
        }

        const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Service, imported.default);
        if (metadata === undefined)
          throw new SyntaxError('Missing @Service decorator');

        pending.push({
          _classRef: imported.default,
          priority: metadata.priority,
          children: metadata.children ?? [],
          type: 'service',
          name: metadata.name
        });

        this.#references.set(imported.default, metadata.name);
      }
    }

    this.emit('debug', `Received ${pending.length} pending components and services.`);
    const sorted = pending.sort((a, b) => a.priority - b.priority);
    for (let i = 0; i < sorted.length; i++) {
      const cls = sorted[i];
      cls._classRef = new cls._classRef();

      switch (cls.type) {
        case 'component':
          this.components.set(cls.name, cls);
          break;

        case 'service':
          this.services.set(cls.name, cls);
          break;
      }
    }

    this.emit('debug', 'Adding injections ahead of time...');
    this.runInjections();

    this.emit('debug', `Registered ${this.components.size} components and ${this.services.size} services`);
    for (const component of this.components.values()) {
      this.emit('onBeforeInit', component);
      await component._classRef.load?.();
      this.emit('onAfterInit', component);

      let children: any[] = [];
      if (typeof component.children === 'string') {
        const refs = await utils.readdir(component.children);
        children = await Promise.all(refs.map(ref => import(ref)));
      } else if (component.children.length > 0) {
        children = component.children;
      }

      children = children.map(returnFromExport);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const c = new child();
        c.parent = component._classRef;

        this.emit('onBeforeChildInit', component, c);
        await component._classRef.onChildLoad?.(c);
        this.emit('onAfterChildInit', component, c);
      }

      component.children = children;
    }

    for (const service of this.services.values()) {
      this.emit('onBeforeInit', service);
      await service._classRef.load?.();
      this.emit('onAfterInit', service);

      let children: any[] = [];
      if (typeof service.children === 'string') {
        const refs = await utils.readdir(service.children);
        children = await Promise.all(refs.map(ref => import(ref)));
      } else if (service.children.length > 0) {
        children = service.children;
      }

      children = children.map(returnFromExport);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const c = new child();
        c.parent = service._classRef;

        this.emit('onBeforeChildInit', service, c);
        await service._classRef.onChildLoad?.(c);
        this.emit('onAfterChildInit', service, c);
      }

      service.children = children;
    }

    this.emit('debug', 'We are all set. (ㅇㅅㅇ❀) (* ^ ω ^)');
  }

  /**
   * Runs all injections for all components and services
   */
  runInjections() {
    const injections: PendingInjectDefinition[] = Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [];
    for (const injection of injections) this.inject(injection);
  }

  /**
   * Returns a reference from the component, singleton, or service tree
   * @param ref The reference to find
   * @typeparam Ref The reference by class (it'll return `typeof <ref>`, use the second generic to return the class)
   * @typeparam TReturn The return value
   */
  $ref<Ref extends any, TReturn extends any = any>(ref: Ref): TReturn {
    const $ref = this.#references.get(ref);
    if ($ref === undefined)
      throw new TypeError('Reference was not found');

    if (this.components.has($ref))
      return this.components.get($ref)!._classRef;
    else if (this.services.has($ref))
      return this.services.get($ref)!._classRef;
    else if (this.singletons.has($ref))
      return this.singletons.get($ref)!.$ref;
    else
      throw new SyntaxError(`Referenced object with ${$ref} was not found`);
  }

  /**
   * Injects all pending references to the target class
   * @param pending The pending injections
   */
  inject(pending: PendingInjectDefinition) {
    const reference = this.$ref(pending.$ref);
    Object.defineProperty(pending.target, pending.prop, {
      get() {
        return reference;
      },
      set() {
        throw new SyntaxError('References cannot mutate new state');
      },

      enumerable: true,
      configurable: true
    });
  }

  /**
   * Bulk-add a list of singletons
   * @param singletons The singletons to add
   */
  addSingletons(singletons: any[]) {
    for (let i = 0; i < singletons.length; i++)
      this.addSingleton(singletons[i]);
  }

  /**
   * Registers a singleton to this [[Container]]
   * @param singleton The singleton to register
   */
  addSingleton(singleton: any) {
    const id = randomBytes(4).toString('hex');
    const value = returnFromExport(singleton);

    const s: BaseSingleton = {
      $ref: value,
      type: 'singleton',
      key: id
    };

    this.#references.set(singleton.constructor !== undefined ? singleton.constructor : singleton, id);
    this.singletons.set(id, s);
  }

  /**
   * Disposes this [[Container]]
   */
  dispose() {
    for (const component of this.components.values()) {
      // Dispose the component itself
      (async() => await component._classRef.dispose?.())();

      // Dispose all component children
      for (const child of component.children)
        (async() => await component._classRef.onChildDispose?.(child))();
    }

    for (const service of this.services.values()) {
      // Dispose the service itself
      (async() => await service._classRef.dispose?.())();

      // Dispose the service's children (if any)
      for (const child of service.children)
        (async() => await service._classRef.onChildDispose?.(child))();
    }

    this.components.clear();
    this.singletons.clear();
    this.services.clear();
  }

  /**
   * Applies a component to this [[Container]]
   * @param cls The component to add
   */
  async addComponent(cls: any) {
    const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Component, cls);
    if (metadata === undefined)
      throw new TypeError('Missing @Component decorator (did you construct this class? if so, don\'t)');

    const component: BaseComponent = {
      _classRef: cls,
      children: [],
      priority: metadata.priority,
      type: 'component',
      name: metadata.name
    };

    this.runInjections();

    component._classRef = new cls();
    this.emit('onBeforeInit', component);
    await component._classRef.load?.();
    this.emit('onAfterInit', component);

    let children: any[] = [];
    if (typeof component.children === 'string') {
      const refs = await utils.readdir(component.children);
      children = await Promise.all(refs.map(ref => import(ref)));
    } else if (component.children.length > 0) {
      children = component.children;
    }

    children = children.map(returnFromExport);
    for (const child of children) {
      const c = new child.childCls();
      c.parent = component._classRef;

      this.emit('onBeforeChildInit', component, c);
      await component._classRef.onChildLoad?.(c);
      this.emit('onAfterChildInit', component, c);
    }

    component.children = children;
    this.#references.set(component._classRef.constructor, component.name);
    this.components.set(component.name, component);
  }

  /**
   * Applies a service to this [[Container]]
   * @param cls The component to add
   */
  async addService(cls: any) {
    const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Service, cls);
    if (metadata === undefined)
      throw new TypeError('Missing @Service decorator (did you construct this class? if so, don\'t)');

    const service: BaseService = {
      _classRef: cls,
      children: [],
      priority: metadata.priority,
      type: 'service',
      name: metadata.name
    };

    this.runInjections();

    service._classRef = new cls();
    this.emit('onBeforeInit', service);
    await service._classRef.load?.();
    this.emit('onAfterInit', service);

    let children: any[] = [];
    if (typeof service.children === 'string') {
      const refs = await utils.readdir(service.children);
      children = await Promise.all(refs.map(ref => import(ref)));
    } else if (service.children.length > 0) {
      children = service.children;
    }

    children = children.map(returnFromExport);
    for (const child of children) {
      const c = new child.childCls();
      c.parent = service._classRef;

      this.emit('onBeforeChildInit', service, c);
      await service._classRef.onChildLoad?.(c);
      this.emit('onAfterChildInit', service, c);
    }

    service.children = children;
    this.#references.set(service._classRef.constructor, service.name);
    this.services.set(service.name, service);
  }
}
