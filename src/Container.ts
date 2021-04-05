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

import { BaseComponent, BaseService, BaseSingleton, MetadataKeys, PendingInjectDefinition, ReferredObjectDefinition, ImportedDefaultExport, ChildrenDefinition } from './types';
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
   * The objects that were implemented in this [[Container]]
   */
  public objects: Collection<string, BaseService | BaseComponent | BaseSingleton>;

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
    this.objects = new Collection();

    if (options?.singletons?.length)
      this.addSingletons(options.singletons!);
  }

  /**
   * Returns the component tree
   */
  get components() {
    return this.objects.filter(o => o.type === 'component') as unknown as BaseComponent[];
  }

  /**
   * Returns the singleton tree
   */
  get singletons() {
    return this.objects.filter(o => o.type === 'singleton') as unknown as BaseSingleton[];
  }

  /**
   * Returns the services tree
   */
  get services() {
    return this.objects.filter(o => o.type === 'service') as unknown as BaseService[];
  }

  /**
   * Verifies the current state of this [[Container]], this initializes all components, services, and singletons.
   *
   * @deprecated This method is deprecated and will be removed in a future release, use [[Container.load]].
   */
  verify() {
    this.emit('debug', 'Application.verify is deprecated and will be removed in a future release.');
    return this.load();
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
        children: [],
        type: 'component',
        name: metadata.name
      });

      this.#references.set(imported.default, metadata.name);

      // Import the children classes if the component has a @FindChildrenIn decorator
      // hacky solution but :shrug:
      const childPath: string | undefined = Reflect.getMetadata(MetadataKeys.FindChildrenIn, imported.default);
      if (childPath !== undefined)
        await Promise.all(utils.readdirSync(childPath).map(c => import(c)));
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
          children: [],
          type: 'service',
          name: metadata.name
        });

        this.#references.set(imported.default, metadata.name);

        // Import the children classes if the component has a @FindChildrenIn decorator
        // hacky solution but :shrug:
        const childPath: string | undefined = Reflect.getMetadata(MetadataKeys.FindChildrenIn, imported.default);
        if (childPath !== undefined)
          await Promise.all(utils.readdirSync(childPath).map(c => import(c)));
      }
    }

    this.emit('debug', 'Adding injections ahead of time...');
    const injections: PendingInjectDefinition[] = Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [];
    for (const injection of injections) this.inject(injection);

    this.emit('debug', `Received ${pending.length} pending components and services.`);
    const sorted = pending.sort((a, b) => a.priority - b.priority);
    for (let i = 0; i < sorted.length; i++) {
      const cls = sorted[i];
      cls._classRef = new cls._classRef();

      this.objects.set(cls.name, cls);
    }

    this.emit('debug', `Registered ${this.objects.size} objects, now initalizing...`);
    for (const obj of this.objects.filter(c => isComponentLike(c) || isServiceLike(c)) as (BaseComponent | BaseService)[]) {
      this.emit('onBeforeInit', obj);
      await obj._classRef.load?.();
      this.emit('onAfterInit', obj);

      const children = ((Reflect.getMetadata(MetadataKeys.LinkParent, global) ?? []) as ChildrenDefinition[]).filter(child =>
        child.parentCls === obj._classRef.constructor
      );

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        this.emit('onBeforeChildInit', obj, child);
        await obj._classRef.onChildLoad?.(child);
        this.emit('onAfterChildInit', obj, child);
      }
    }

    this.emit('debug', 'We are all set. (ㅇㅅㅇ❀) (* ^ ω ^)');
  }

  /**
   * Sets the directory to find components in
   * @deprecated This method is deprecated and will be removed in a future release. Use `componentsDir` when
   * creating this [[Container]]
   *
   * @param dir The directory
   */
  findComponentsIn(dir: string) {
    this.#componentsDir = dir;
    return this;
  }

  /**
   * Sets the directory to find services in
   * @deprecated This method is deprecated and will be removed in a future release. Use `servicesDir` when
   * creating this [[Container]]
   *
   * @param dir The directory
   */
  findServicesIn(dir: string) {
    this.#servicesDir = dir;
    return this;
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

    const obj = this.objects.find(o => isComponentLike(o) || isServiceLike(o) ? o.name === $ref : o.key === $ref);
    if (isComponentLike(obj) || isServiceLike(obj))
      return obj._classRef;
    else if (obj?.type === 'singleton')
      return obj.$ref;
    else
      // Primitives or non-components/services/singletons can be referenced
      throw new SyntaxError('Reference object was not a component, singleton, or service');
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
      $ref: value.constructor !== undefined ? value.constructor : value,
      type: 'singleton',
      key: id
    };

    this.#references.set(singleton.constructor !== undefined ? singleton.constructor : singleton, id);
    this.objects.set(id, s);
  }

  /**
   * Disposes this [[Container]]
   */
  dispose() {
    for (const component of this.components) {
      // Dispose the component itself
      (async() => await component._classRef.dispose?.())();

      // Dispose all component children
      for (const child of component.children)
        (async() => await component._classRef.onChildDispose?.(child))();
    }

    for (const service of this.services) {
      // Dispose the service itself
      (async() => await service._classRef.dispose?.())();

      // Dispose the service's children (if any)
      for (const child of service.children)
        (async() => await service._classRef.onChildDispose?.(child))();
    }

    this.objects.clear();
  }

  /**
   * Applies a component to this [[Container]]
   * @param cls The component to add
   */
  async addComponent(cls: any) {
    const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Component, cls);
    if (metadata === undefined)
      throw new TypeError('Missing @Component decorator (did you construct this class? if so, don\'t)');

    if (metadata.type !== 'component')
      throw new TypeError('[cls] provided was not a @Component decorator');

    const component: BaseComponent = {
      _classRef: cls,
      children: [],
      priority: metadata.priority,
      type: 'component',
      name: metadata.name
    };

    // Import the children classes if the component has a @FindChildrenIn decorator
    // hacky solution but :shrug:
    const childPath: string | undefined = Reflect.getMetadata(MetadataKeys.FindChildrenIn, cls);
    if (childPath !== undefined)
      await Promise.all(utils.readdirSync(childPath).map(c => import(c)));

    const injections: PendingInjectDefinition[] = Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [];
    for (const injection of injections) this.inject(injection);

    component._classRef = new cls();
    this.emit('onBeforeInit', component);
    await component._classRef.load?.();
    this.emit('onAfterInit', component);

    const children = ((Reflect.getMetadata(MetadataKeys.LinkParent, global) ?? []) as ChildrenDefinition[])
      .filter(child => child.parentCls.constructor === cls);

    for (const child of children) {
      const c = new child.childCls();
      c.parent = component._classRef;

      this.emit('onBeforeChildInit', component, c);
      await component._classRef.onChildLoad?.(c);
      this.emit('onAfterChildInit', component, c);
    }

    this.#references.set(component._classRef.constructor, component.name);
    this.objects.set(component.name, component);
  }

  /**
   * Applies a service to this [[Container]]
   * @param cls The component to add
   */
  async addService(cls: any) {
    const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Service, cls);
    if (metadata === undefined)
      throw new TypeError('Missing @Service decorator (did you construct this class? if so, don\'t)');

    if (metadata.type !== 'component')
      throw new TypeError('[cls] provided was not a @Service decorator');

    const service: BaseService = {
      _classRef: cls,
      children: [],
      priority: metadata.priority,
      type: 'component',
      name: metadata.name
    };

    // Import the children classes if the component has a @FindChildrenIn decorator
    // hacky solution but :shrug:
    const childPath: string | undefined = Reflect.getMetadata(MetadataKeys.FindChildrenIn, cls);
    if (childPath !== undefined)
      await Promise.all(utils.readdirSync(childPath).map(c => import(c)));

    const injections: PendingInjectDefinition[] = Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [];
    for (const injection of injections) this.inject(injection);

    service._classRef = new cls();
    this.emit('onBeforeInit', service);
    await service._classRef.load?.();
    this.emit('onAfterInit', service);

    const children = ((Reflect.getMetadata(MetadataKeys.LinkParent, global) ?? []) as ChildrenDefinition[])
      .filter(child => child.parentCls.constructor === cls);

    for (const child of children) {
      const c = new child.childCls();
      c.parent = service._classRef;

      this.emit('onBeforeChildInit', service, c);
      await service._classRef.onChildLoad?.(c);
      this.emit('onAfterChildInit', service, c);
    }

    this.#references.set(service._classRef.constructor, service.name);
    this.objects.set(service.name, service);
  }
}
