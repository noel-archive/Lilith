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

import {
  BaseComponent,
  BaseService,
  BaseSingleton,
  MetadataKeys,
  PendingInjectDefinition,
  ReferredObjectDefinition,
  PendingSubscription,
} from './types';
import { returnFromExport, isPrimitive } from './utils';
import type { EventEmitterLike } from './api/SharedAPI';
import { ComponentAPI } from './api/ComponentAPI';
import { randomBytes } from 'crypto';
import { ServiceAPI } from './api/ServiceAPI';
import { Collection } from '@augu/collections';
import * as utils from '@augu/utils';

/**
 * The container events used for the [[Container]].
 */
interface ContainerEvents {
  /**
   * Emitted when a singleton has been registered in this container.
   *
   * @param singleton The singleton class that has been registered
   */
  registerSingleton(singleton: any): void;

  /**
   * Emitted when a component has been registered in this container.
   *
   * @param component The component class that has been registered.
   */
  registerComponent(component: any): void;

  /**
   * Emitted when a service has been registered in this container.
   *
   * @param service The service class that has been registered
   */
  registerService(service: any): void;

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
   * Any component classes to add
   */
  components?: any[];

  /**
   * A list of singletons to bulk add
   */
  singletons?: any[];

  /**
   * A list of services to add to this [[Container]].
   */
  services?: any[];
}

/**
 * Represents a singleton import for [[Container.importSingleton]].
 */
export interface SingletonImport<T> {
  /**
   * Function to teardown this singleton, if any
   * @param singleton The singleton if you need it without
   * grabbing it yourself. :3
   */
  teardown?(this: Container, singleton: T): void | Promise<void>;

  /**
   * Function to initialize this singleton, if any.
   * @param container The container instance if you need it.
   */
  init?(container: Container): void | Promise<void>;

  default: any;
}

/**
 * Represents a "container" of components, singletons, and services. This is the main
 * entrypoint to Lilith, this is your creation tool to create your application! **(\*≧∀≦\*)**
 */
export class Container extends utils.EventBus<ContainerEvents> {
  private static _instance: Container;

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

  /**
   * The emitter tree for this [[Container]]
   */
  public emitters: Collection<string, EventEmitterLike> = new Collection();

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

    if (!Container._instance) Container._instance = this;

    const singletons = options?.singletons ?? [];
    for (let i = 0; i < singletons.length; i++) {
      if (isPrimitive(singletons[i]))
        throw new TypeError(`Cannot register singleton ${singletons[i]}. It is a primitive value.`);

      this.addSingleton(singletons[i]);
    }

    const components = options?.components ?? [];
    for (let i = 0; i < components.length; i++) {
      this.addComponent(components[i]);
    }

    const services = options?.services ?? [];
    for (let i = 0; i < services.length; i++) {
      this.addService(services[i]);
    }
  }

  /**
   * References scoped to any singleton, service, or component
   * to the name of the component/singleton/service.
   */
  get references() {
    return this.#references;
  }

  /**
   * Returns a reference of this [[Container]] that was constructed.
   */
  static get instance() {
    return this._instance;
  }

  /**
   * Initializes all components, services, and singletons.
   */
  async load() {
    this.emit('debug', "( ★ ≧ ▽ ^))★☆ Let's get started!");

    const pending: (BaseService | BaseComponent)[] = [];
    if (this.#componentsDir !== undefined) {
      // Components
      const componentList = utils.readdirSync(this.#componentsDir, { exclude: ['.js.map'] });
      this.emit('debug', `Registering ${componentList.length} pending components...`);
      for (let i = 0; i < componentList.length; i++) {
        const file = componentList[i];
        const imported: utils.Ctor<any> = await import(file);

        if (imported.default === undefined) {
          this.emit('debug', `Missing default export -> ${file} (skipping)`);
          continue;
        }

        const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(
          MetadataKeys.Component,
          imported.default
        );
        if (metadata === undefined) throw new SyntaxError('Missing @Component decorator');

        pending.push({
          subscriptions: [],
          _classRef: imported.default,
          priority: metadata.priority,
          children: (metadata.children as any) ?? [],
          type: 'component',
          name: metadata.name,
        });

        this.emit('debug', `Added reference of component "${metadata.name}" linked to ${imported.default!.name}`);
        this.#references.set(imported.default, metadata.name);
      }
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

        const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(
          MetadataKeys.Service,
          imported.default
        );
        if (metadata === undefined) throw new SyntaxError('Missing @Service decorator');

        pending.push({
          subscriptions: [],
          _classRef: imported.default,
          priority: metadata.priority,
          children: (metadata.children as any) ?? [],
          type: 'service',
          name: metadata.name,
        });

        this.emit('debug', `Added reference of service "${metadata.name}" linked to ${imported.default!.name}`);
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
          cls._classRef.api = new ComponentAPI(this, cls);

          this.emit('registerComponent', cls._classRef);
          this.components.set(cls.name, cls);
          break;

        case 'service':
          cls._classRef.api = new ServiceAPI(this, cls);

          this.emit('registerService', cls._classRef);
          this.services.set(cls.name, cls);
          break;
      }
    }

    this.emit('debug', `Registered ${this.components.size} components and ${this.services.size} services`);
    for (const component of this.components.values()) {
      this.addInjections(component._classRef);
      this.emit('onBeforeInit', component);
      await component._classRef.load?.();
      this.emit('onAfterInit', component);

      let children: any[] = [];
      if (typeof component.children === 'string') {
        const refs = await utils.readdir(component.children);
        children = await Promise.all(refs.map((ref) => import(ref)));
      } else if (component.children.length > 0) {
        children = component.children;
      }

      children = children.map(returnFromExport);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const c = new child();
        this.addInjections(c);

        c.parent = component._classRef;

        this.emit('onBeforeChildInit', component, c);
        await component._classRef.onChildLoad?.(c);
        this.emit('onAfterChildInit', component, c);

        // It's most likely children classes will have subscriptions
        // but components can also.
        const subscriptions: PendingSubscription[] = Reflect.getMetadata(MetadataKeys.Subscription, c) ?? [];
        if (subscriptions.length > 0) {
          const subsToForward = subscriptions.filter((sub) => sub.emitterCls !== undefined);

          if (subscriptions.filter((sub) => sub.emitterCls === undefined).length > 0)
            this.emit(
              'debug',
              `Unable to forward ${
                subscriptions.filter((sub) => sub.emitterCls === undefined).length
              } events due to no emitter class to automate this, please handle them yourself under \`_classRef.onChildLoad(child)\`.`
            );

          for (let i = 0; i < subsToForward.length; i++) {
            const emitter = this.findEmitter(subsToForward[i].emitterCls!);
            if (emitter === null)
              throw new TypeError(
                `Unable to find emitter ${subsToForward[i].emitterCls.constructor.name} for subscription ${subsToForward[i].event}.`
              );

            const sub = subsToForward[i];
            (component._classRef.api as ComponentAPI).forwardSubscription(emitter, {
              ...sub,
              thisCtx: c,
            });
          }
        }
      }

      component.children = children;

      // It's most likely children classes will have subscriptions
      // but components can also.
      const subscriptions: PendingSubscription[] =
        Reflect.getMetadata(MetadataKeys.Subscription, component._classRef) ?? [];
      if (subscriptions.length > 0) {
        const subsToForward = subscriptions.filter((sub) => sub.emitterCls !== undefined);

        if (subscriptions.filter((sub) => sub.emitterCls === undefined).length > 0)
          this.emit(
            'debug',
            `Unable to forward ${
              subscriptions.filter((sub) => sub.emitterCls === undefined).length
            } events due to no emitter class to automate this, please handle them yourself under \`_classRef.load()\`.`
          );

        for (let i = 0; i < subsToForward.length; i++) {
          const emitter = this.findEmitter(subsToForward[i].emitterCls!);
          if (emitter === null)
            throw new TypeError(
              `Unable to find emitter ${subsToForward[i].emitterCls.constructor.name} for subscription ${subsToForward[i].event}.`
            );

          const sub = subsToForward[i];
          (component._classRef.api as ComponentAPI).forwardSubscription(emitter, {
            ...sub,
            thisCtx: component._classRef,
          });
        }
      }
    }

    for (const service of this.services.values()) {
      this.addInjections(service._classRef);
      this.emit('onBeforeInit', service);
      await service._classRef.load?.();
      this.emit('onAfterInit', service);

      let children: any[] = [];
      if (typeof service.children === 'string') {
        const refs = await utils.readdir(service.children);
        children = await Promise.all(refs.map((ref) => import(ref)));
      } else if (service.children.length > 0) {
        children = service.children;
      }

      children = children.map(returnFromExport);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const c = new child();
        this.addInjections(c);

        c.parent = service._classRef;

        this.emit('onBeforeChildInit', service, c);
        await service._classRef.onChildLoad?.(c);
        this.emit('onAfterChildInit', service, c);

        // It's most likely children classes will have subscriptions
        // but services can also.
        const subscriptions: PendingSubscription[] = Reflect.getMetadata(MetadataKeys.Subscription, c) ?? [];
        if (subscriptions.length > 0) {
          const subsToForward = subscriptions.filter((sub) => sub.emitterCls !== undefined);

          if (subscriptions.filter((sub) => sub.emitterCls === undefined).length > 0)
            this.emit(
              'debug',
              `Unable to forward ${
                subscriptions.filter((sub) => sub.emitterCls === undefined).length
              } events due to no emitter class to automate this, please handle them yourself under \`_classRef.onChildLoad(child)\`.`
            );

          for (let i = 0; i < subsToForward.length; i++) {
            const emitter = this.findEmitter(subsToForward[i].emitterCls!);
            if (emitter === null)
              throw new TypeError(
                `Unable to find emitter ${subsToForward[i].emitterCls} for subscription ${subsToForward[i].event}.`
              );

            const sub = subsToForward[i];
            (service._classRef.api as ServiceAPI).forwardSubscription(emitter, {
              ...sub,
              thisCtx: c,
            });
          }
        }
      }

      service.children = children;

      // It's most likely children classes will have subscriptions
      // but components can also.
      const subscriptions: PendingSubscription[] =
        Reflect.getMetadata(MetadataKeys.Subscription, service._classRef) ?? [];
      if (subscriptions.length > 0) {
        const subsToForward = subscriptions.filter((sub) => sub.emitterCls !== undefined);

        if (subscriptions.filter((sub) => sub.emitterCls === undefined).length > 0)
          this.emit(
            'debug',
            `Unable to forward ${
              subscriptions.filter((sub) => sub.emitterCls === undefined).length
            } events due to no emitter class to automate this, please handle them yourself under \`_classRef.load()\`.`
          );

        for (let i = 0; i < subsToForward.length; i++) {
          const emitter = this.findEmitter(subsToForward[i].emitterCls!);
          if (emitter === null)
            throw new TypeError(
              `Unable to find emitter ${subsToForward[i].emitterCls.constructor.name} for subscription ${subsToForward[i].event}.`
            );

          const sub = subsToForward[i];
          (service._classRef.api as ComponentAPI).forwardSubscription(emitter, {
            ...sub,
            thisCtx: service._classRef,
          });
        }
      }
    }

    this.emit('debug', 'We are all set. (ㅇㅅㅇ❀) (* ^ ω ^)');
  }

  /**
   * Same functionality as [[Container.$ref]] but this can be for any
   * libraries that depend on dependency injection + has string support
   * for the [[ref]] parameter.
   *
   * @param ref The reference class or the name of a component, service, or singleton
   */
  get<TReturn = any>(ref: any): TReturn {
    if (typeof ref === 'string') {
      return (
        (this.components.get(ref)?._classRef as TReturn | undefined) ??
        (this.services.get(ref)?._classRef as TReturn | undefined) ??
        (this.singletons.get(ref)?.$ref as TReturn)
      );
    } else if (utils.isObject<any>(ref)) {
      return this.$ref(ref);
    } else {
      throw new SyntaxError('`ref` was not a string or a object of a class');
    }
  }

  /**
   * Registers an emitter to this [[Container]] for subscription handling.
   * @param emitter The emitter instance to use
   * @returns This [[Container]] instance to chain methods.
   */
  addEmitter<E extends EventEmitterLike>(name: string, emitter: E) {
    this.emitters.set(name, emitter);
    return this;
  }

  /**
   * Finds an emitter from this [[Container]] and returns it
   * @param emitterCls The event emitter class to use
   */
  findEmitter<E extends EventEmitterLike>(name: string): E | null {
    return this.emitters.find((_, __, key) => key === name) as unknown as E | null;
  }

  /**
   * Implements all injections into a class prototype (run this before creating a new class instance)
   * @param target The target class to use
   */
  addInjections(target: any) {
    // Add pending injections
    const injections: PendingInjectDefinition[] = Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [];
    const targetCls = target._classRef !== undefined ? target._classRef : target;
    const shouldInject = injections.filter((inject) => targetCls.constructor === inject.target.constructor);

    for (const inject of shouldInject) this.inject(targetCls, inject);
  }

  /**
   * Returns a reference from the component, singleton, or service tree
   * @param ref The reference to find
   * @typeparam TReturn The return value
   */
  $ref<TReturn = any>(ref: any): TReturn {
    const $ref = this.#references.get(ref);
    if ($ref === undefined) throw new TypeError('Reference was not found');

    if (this.components.has($ref)) return this.components.get($ref)!._classRef;
    else if (this.services.has($ref)) return this.services.get($ref)!._classRef;
    else if (this.singletons.has($ref)) return this.singletons.get($ref)!.$ref;
    else throw new SyntaxError(`Referenced object with ${$ref} was not found`);
  }

  /**
   * Injects all pending references to the target class
   * @param pending The pending injections
   */
  inject(target: any, pending: PendingInjectDefinition) {
    const reference = this.$ref(pending.$ref);
    Object.defineProperty(target, pending.prop, {
      get() {
        return reference;
      },
      set() {
        throw new SyntaxError('References cannot mutate state.');
      },

      enumerable: true,
      configurable: true,
    });
  }

  /**
   * Registers a singleton to this [[Container]]
   * @param singleton The singleton to register
   * @param teardown A teardown function to call when this
   * singleton is being destroyed.
   */
  addSingleton(singleton: any, teardown: (this: Container, singleton: any) => void | Promise<void> = () => void 0) {
    if (isPrimitive(singleton))
      throw new TypeError('Unable to register primitives as singletons (use variables instead)');

    const id = randomBytes(4).toString('hex');
    const value = returnFromExport(singleton);

    const s: BaseSingleton = {
      teardown,
      $ref: value,
      type: 'singleton',
      key: id,
    };

    this.emit('debug', `Registered singleton ${singleton.name}`);
    this.#references.set(singleton.constructor !== undefined ? singleton.constructor : singleton, id);
    this.singletons.set(id, s);
    this.emit('registerSingleton', value);
  }

  /**
   * Disposes this [[Container]]
   */
  dispose() {
    for (const component of this.components.values()) {
      // Dispose the component itself
      (async () => await component._classRef.dispose?.())();

      // Dispose all component children
      for (const child of component.children) (async () => await component._classRef.onChildDispose?.(child))();

      // Unsubscribes any subscriptions
      for (const sub of component.subscriptions) sub.dispose();
    }

    for (const service of this.services.values()) {
      // Dispose the service itself
      (async () => await service._classRef.dispose?.())();

      // Dispose the service's children (if any)
      for (const child of service.children) (async () => await service._classRef.onChildDispose?.(child))();

      // Unsubscribes any subscriptions
      for (const sub of service.subscriptions) sub.dispose();
    }

    for (const singleton of this.singletons.values()) {
      // Destroy the singleton
      (async () => {
        try {
          await singleton.teardown?.call(this, singleton.$ref);
        } catch (ex) {
          // preverse async trace
        }
      })();
    }

    this.components.clear();
    this.singletons.clear();
    this.services.clear();
  }

  /**
   * Applies a component to this [[Container]]
   * @param cls The component to add
   * @param args Any additional arguments to construct the component
   */
  async addComponent(cls: any, ...args: any[]) {
    const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Component, cls);
    if (metadata === undefined)
      throw new TypeError("Missing @Component decorator (did you construct this class? if so, don't)");

    const component: BaseComponent = {
      subscriptions: [],
      _classRef: cls,
      children: [],
      priority: metadata.priority,
      type: 'component',
      name: metadata.name,
    };

    component._classRef = new cls(...args);
    this.addInjections(component);

    this.emit('onBeforeInit', component);
    await component._classRef.load?.();
    this.emit('onAfterInit', component);

    let children: any[] = [];
    if (typeof component.children === 'string') {
      const refs = await utils.readdir(component.children);
      children = await Promise.all(refs.map((ref) => import(ref)));
    } else if (component.children.length > 0) {
      children = component.children;
    }

    children = children.map(returnFromExport);
    for (const child of children) {
      const c = new child.childCls();
      this.addInjections(c);

      c.parent = component._classRef;

      this.emit('onBeforeChildInit', component, c);
      await component._classRef.onChildLoad?.(c);
      this.emit('onAfterChildInit', component, c);

      // It's most likely children classes will have subscriptions
      // but components can also.
      const subscriptions: PendingSubscription[] = Reflect.getMetadata(MetadataKeys.Subscription, c) ?? [];
      if (subscriptions.length > 0) {
        const subsToForward = subscriptions.filter((sub) => sub.emitterCls !== undefined);

        if (subscriptions.filter((sub) => sub.emitterCls === undefined).length > 0)
          this.emit(
            'debug',
            `Unable to forward ${
              subscriptions.filter((sub) => sub.emitterCls === undefined).length
            } events due to no emitter class to automate this, please handle them yourself under \`_classRef.onChildLoad(child)\`.`
          );

        for (let i = 0; i < subsToForward.length; i++) {
          const emitter = this.findEmitter(subsToForward[i].emitterCls!);
          if (emitter === null)
            throw new TypeError(
              `Unable to find emitter ${subsToForward[i].emitterCls.constructor.name} for subscription ${subsToForward[i].event}.`
            );

          const sub = subsToForward[i];
          (component._classRef.api as ServiceAPI).forwardSubscription(emitter, {
            ...sub,
            thisCtx: c,
          });
        }
      }
    }

    component.children = children;

    // It's most likely children classes will have subscriptions
    // but components can also.
    const subscriptions: PendingSubscription[] =
      Reflect.getMetadata(MetadataKeys.Subscription, component._classRef) ?? [];
    if (subscriptions.length > 0) {
      const subsToForward = subscriptions.filter((sub) => sub.emitterCls !== undefined);

      if (subscriptions.filter((sub) => sub.emitterCls === undefined).length > 0)
        this.emit(
          'debug',
          `Unable to forward ${
            subscriptions.filter((sub) => sub.emitterCls === undefined).length
          } events due to no emitter class to automate this, please handle them yourself under \`_classRef.load()\`.`
        );

      for (let i = 0; i < subsToForward.length; i++) {
        const emitter = this.findEmitter(subsToForward[i].emitterCls!);
        if (emitter === null)
          throw new TypeError(
            `Unable to find emitter ${subsToForward[i].emitterCls.constructor.name} for subscription ${subsToForward[i].event}.`
          );

        const sub = subsToForward[i];
        (component._classRef.api as ComponentAPI).forwardSubscription(emitter, {
          ...sub,
          thisCtx: component._classRef,
        });
      }
    }

    this.#references.set(component._classRef.constructor, component.name);
    this.components.set(component.name, component);
  }

  /**
   * Applies a service to this [[Container]]
   * @param cls The component to add
   * @param args Any additional arguments to construct the service
   */
  async addService(cls: any, ...args: any[]) {
    const metadata: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Service, cls);
    if (metadata === undefined)
      throw new TypeError("Missing @Service decorator (did you construct this class? if so, don't)");

    const service: BaseService = {
      subscriptions: [],
      _classRef: cls,
      children: [],
      priority: metadata.priority,
      type: 'service',
      name: metadata.name,
    };

    service._classRef = new cls(...args);
    this.addInjections(service);

    this.emit('onBeforeInit', service);
    await service._classRef.load?.();
    this.emit('onAfterInit', service);

    let children: any[] = [];
    if (typeof service.children === 'string') {
      const refs = await utils.readdir(service.children);
      children = await Promise.all(refs.map((ref) => import(ref)));
    } else if (service.children.length > 0) {
      children = service.children;
    }

    children = children.map(returnFromExport);
    for (const child of children) {
      const c = new child.childCls();
      this.addInjections(c);

      c.parent = service._classRef;

      this.emit('onBeforeChildInit', service, c);
      await service._classRef.onChildLoad?.(c);
      this.emit('onAfterChildInit', service, c);

      // It's most likely children classes will have subscriptions
      // but services can also.
      const subscriptions: PendingSubscription[] = Reflect.getMetadata(MetadataKeys.Subscription, c) ?? [];
      if (subscriptions.length > 0) {
        const subsToForward = subscriptions.filter((sub) => sub.emitterCls !== undefined);

        if (subscriptions.filter((sub) => sub.emitterCls === undefined).length > 0)
          this.emit(
            'debug',
            `Unable to forward ${
              subscriptions.filter((sub) => sub.emitterCls === undefined).length
            } events due to no emitter class to automate this, please handle them yourself under \`_classRef.onChildLoad(child)\`.`
          );

        for (let i = 0; i < subsToForward.length; i++) {
          const emitter = this.findEmitter(subsToForward[i].emitterCls!);
          if (emitter === null)
            throw new TypeError(
              `Unable to find emitter ${subsToForward[i].emitterCls.constructor.name} for subscription ${subsToForward[i].event}.`
            );

          const sub = subsToForward[i];
          (service._classRef.api as ServiceAPI).forwardSubscription(emitter, {
            ...sub,
            thisCtx: c,
          });
        }
      }
    }

    service.children = children;

    // It's most likely children classes will have subscriptions
    // but components can also.
    const subscriptions: PendingSubscription[] =
      Reflect.getMetadata(MetadataKeys.Subscription, service._classRef) ?? [];
    if (subscriptions.length > 0) {
      const subsToForward = subscriptions.filter((sub) => sub.emitterCls !== undefined);

      if (subscriptions.filter((sub) => sub.emitterCls === undefined).length > 0)
        this.emit(
          'debug',
          `Unable to forward ${
            subscriptions.filter((sub) => sub.emitterCls === undefined).length
          } events due to no emitter class to automate this, please handle them yourself under \`_classRef.load()\`.`
        );

      for (let i = 0; i < subsToForward.length; i++) {
        const emitter = this.findEmitter(subsToForward[i].emitterCls!);
        if (emitter === null)
          throw new TypeError(
            `Unable to find emitter ${subsToForward[i].emitterCls.constructor.name} for subscription ${subsToForward[i].event}.`
          );

        const sub = subsToForward[i];
        (service._classRef.api as ServiceAPI).forwardSubscription(emitter, {
          ...sub,
          thisCtx: service._classRef,
        });
      }
    }

    this.#references.set(service._classRef.constructor, service.name);
    this.services.set(service.name, service);
  }

  /**
   * Finds a component, service, or singleton by a specific `predicate` function
   * @param func The predicate function to find the component, service, or singleton's constructor type or name
   * @returns The component, service, singleton found or `null` if nothing was found
   */
  find<S extends any = any, ThisArg = Container>(
    func: (value: BaseComponent | BaseService | BaseSingleton) => boolean,
    thisArg?: ThisArg
  ): S | null {
    const values: (BaseComponent | BaseService | BaseSingleton)[] = ([] as any[]).concat(
      this.components.toArray(),
      this.services.toArray(),
      this.singletons.toArray()
    );

    const predicate = func.bind(thisArg !== undefined ? thisArg : this);
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (predicate(value)) {
        switch (value.type) {
          case 'component':
          case 'service':
            return (value as BaseComponent | BaseService)._classRef;

          case 'singleton':
            return (value as BaseSingleton).$ref;

          // this shouldn't happen but whatever
          default:
            return null;
        }
      }
    }

    return null;
  }

  /**
   * Imports a singleton with a default export, and maybe a `init` / `teardown`
   * function.
   *
   * @param import_ The singleton import, this can also be a function
   * to lazy-load the import.
   *
   * @example
   * ```js
   * container.importSingleton(() => import('./my-singleton-here'));
   * container.importSingleton({ default: <some singleton>, init() {}, teardown() {} });
   * ```
   *
   * @returns This container instance.
   */
  async importSingleton<T>(import_: SingletonImport<T> | (() => Promise<SingletonImport<T>> | SingletonImport<T>)) {
    const singleton = typeof import_ === 'function' ? await import_() : import_;
    this.addSingleton(singleton.default, singleton.teardown);

    if (singleton.init !== undefined) await singleton.init(this);

    return this;
  }
}
