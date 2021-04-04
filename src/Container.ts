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
   * Emitted when an error occured while initializing a component or service
   * @param cls The component or service
   * @param error The error that occured
   */
  initError(cls: BaseComponent | BaseService, error: any): void;

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

    // Fetch all components
    const componentList = utils.readdirSync(this.#componentsDir);
    if (componentList.length === 0)
      throw new Error('Missing components to initialize');

    // Get and create all components
    const components = componentList.map(file => {
      const ctor: utils.Ctor<BaseComponent> = require(file);
      return ctor.default !== undefined ? new ctor.default() : new ctor();
    }).sort((a, b) => a.priority - b.priority);

    this.emit('debug', `Found ${components.length} components to register`);
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const metadata: ReferredObjectDefinition = Reflect.getMetadata(MetadataKeys.Component, component.constructor);

      if (metadata === undefined)
        continue;

      if (metadata.type !== 'component')
        throw new TypeError(`"Component" ${metadata.name} was not a component`);

      const c: BaseComponent = utils.omitUndefinedOrNull({
        priority: metadata.priority,
        ctor: component.constructor,
        type: 'component',
        name: metadata.name,
        load: component.load?.bind(component),
        dispose: component.dispose?.bind(component)
      });

      this.emit('debug', `Registered component ${c.name}`);

      this.#references.set(component.constructor, metadata.name);
      this.objects.set(c.name, c);
    }

    // Loads all services (if any)
    if (this.#servicesDir !== undefined) {
      const servicesList = utils.readdirSync(this.#servicesDir);
      if (servicesList.length === 0)
        throw new Error('Missing services to initialize');

      const services = servicesList.map((file) => {
        const ctor: utils.Ctor<BaseService> = require(file);
        return ctor.default !== undefined ? new ctor.default() : new ctor();
      }).sort((a, b) => a.priority - b.priority);

      this.emit('debug', `Found ${services.length} servies to register`);
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        const metadata: ReferredObjectDefinition = Reflect.getMetadata(MetadataKeys.Service, service.constructor);

        if (metadata === undefined)
          continue;

        if (metadata.type !== 'service')
          throw new TypeError(`"Service" ${metadata.name} was not a component`);

        const s: BaseService = utils.omitUndefinedOrNull({
          priority: metadata.priority,
          ctor: service.constructor,
          type: 'service',
          name: metadata.name,
          load: service.load?.bind(service),
          dispose: service.dispose?.bind(service)
        });

        this.emit('debug', `Registered service ${s.name}`);

        this.#references.set(service.constructor, metadata.name);
        this.objects.set(s.name, s);
      }
    }

    this.emit('debug', `Now adding pending injections to ${this.objects.size} objects...`);
    const injections: PendingInjectDefinition[] = Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [];
    for (const injection of injections) this.inject(injection);

    this.emit('debug', `Done! Now initializing ${this.objects.size} objects...`);
    for (const obj of this.objects.values()) {
      if (isServiceLike(obj) || isComponentLike(obj)) {
        try {
          this.emit('onBeforeInit', obj);
          await obj.load?.();
          this.emit('onAfterInit', obj);
        } catch(ex) {
          this.emit('initError', obj, ex);
        }
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

    return this.objects.find(o => isComponentLike(o) || isServiceLike(o) ? o.name === $ref : o.key === $ref) as unknown as TReturn;
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
    for (const component of this.components)
      (async() => await component.dispose?.())();

    for (const service of this.services)
      (async() => await service.dispose?.())();

    this.objects.clear();
  }

  /**
   * Applies a component to this [[Container]]
   * @param cls The component to add
   */
  addComponent(cls: any) {
    const metadata: ReferredObjectDefinition = Reflect.getMetadata(MetadataKeys.Component, cls.constructor);
    if (metadata === undefined)
      throw new TypeError('Unable to find component metadata, did you add the @Component decorator?');

    if (metadata.type !== 'component')
      throw new TypeError(`"Component" ${metadata.name} was not a component`);

    const component = utils.omitUndefinedOrNull<BaseComponent>({
      priority: metadata.priority,
      dispose: cls.dispose?.bind(cls),
      type: 'component',
      name: metadata.name,
      ctor: cls.constructor,
      load: cls.load?.bind(cls)
    });

    this.emit('debug', `Registered component ${component.name} programmatically`);
    this.#references.set(cls.constructor, metadata.name);
    this.objects.set(metadata.name, component as any);

    const pending: PendingInjectDefinition[] = (Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [])
      .filter((injection: PendingInjectDefinition) => injection.target.constructor !== undefined ? injection.target.constructor === cls.constructor : injection.target === cls);

    for (const injection of pending) this.inject(injection);
  }

  /**
   * Applies a service to this [[Container]]
   * @param cls The component to add
   */
  addService(cls: any) {
    const metadata: ReferredObjectDefinition = Reflect.getMetadata(MetadataKeys.Service, cls.constructor);
    if (metadata === undefined)
      throw new TypeError('Unable to find component metadata, did you add the @Service decorator?');

    if (metadata.type !== 'service')
      throw new TypeError(`"Service" ${metadata.name} was not a component`);

    const service = utils.omitUndefinedOrNull<BaseComponent>({
      priority: metadata.priority,
      dispose: cls.dispose?.bind(cls),
      type: 'service',
      name: metadata.name,
      ctor: cls.constructor,
      load: cls.load?.bind(cls)
    });

    this.emit('debug', `Registered service ${service.name} programmatically`);
    this.#references.set(cls.constructor, metadata.name);
    this.objects.set(metadata.name, service as any);

    const pending: PendingInjectDefinition[] = (Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [])
      .filter((injection: PendingInjectDefinition) => injection.target.constructor !== undefined ? injection.target.constructor === cls.constructor : injection.target === cls);

    for (const injection of pending) this.inject(injection);
  }
}
