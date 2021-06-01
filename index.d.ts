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

import { Collection } from '@augu/collections';
import { EventBus } from '@augu/utils';

/** Represents the entrypoint of @augu/lilith */
declare namespace lilith {
  // ~ Namespaces ~
  export namespace utils {
    /**
     * Checks if [value] is a [[BaseComponent]] or not.
     * @param value The value to use
     */
    export function isComponentLike(value: unknown): value is BaseComponent;

    /**
     * Checks if [value] is a [[BaseService]] or not.
     * @param value The value to use
     */
    export function isServiceLike(value: unknown): value is BaseService;

    /**
     * Returns the default export (if any).
     * @param value The value to use
     */
    export function returnFromExport<T extends object>(value: T): ImportedDefaultExport<T>;

    /**
     * Returns a boolean value if `value` is not a primitive.
     * @param value The value to check
     */
    export function isPrimitive(value: unknown): boolean;
  }

  // ~ Constants ~
  /** Returns the version of Lilith */
  export const version: string;

  // ~ Classes ~
  /**
   * Represents a "container" of components, singletons, and services. This is the main
   * entrypoint to Lilith, this is your creation tool to create your application! **(\*≧∀≦\*)**
   */
  export class Container extends EventBus<lilith.ContainerEvents> {
    /**
     * Represents a "container" of components, singletons, and services. This is the main
     * entrypoint to Lilith, this is your creation tool to create your application! **(\*≧∀≦\*)**
     *
     * @param options Any additional options to use
     */
    constructor(options?: lilith.ContainerOptions);

    /**
     * Returns the component tree
     */
    public components: Collection<string, BaseComponent>;

    /**
     * References scoped to any singleton, service, or component
     * to the name of the component/singleton/service.
     */
    public references: Collection<any, string>;

    /**
     * Returns the singleton tree
     */
    public singletons: Collection<string, BaseSingleton>;

    /**
     * Returns the service tree
     */
    public services: Collection<string, BaseService>;

    /**
     * The emitter tree for this [[Container]]
     */
    public emitters: Collection<string, EventEmitterLike>;

    /**
     * Initializes all components, services, and singletons.
     */
    public load(): Promise<void>;

    /**
     * Returns a reference from the component, singleton, or service tree
     * @param ref The reference to find
     * @typeparam TReturn The return value
     */
    public $ref<TReturn = any>(ref: any): TReturn;

    /**
     * Injects all pending references to the target class
     * @param target The target to inject the value.
     * @param pending The pending injections
     */
    public inject(target: any, pending: lilith.PendingInjectDefinition): void;

    /**
     * Registers a singleton to this [[Container]]
     * @param singleton The singleton to register
     */
    public addSingleton(singleton: any): void;

    /**
     * Disposes this [[Container]]
     */
    public dispose(): void;

    /**
     * Applies a component to this [[Container]]
     * @param cls The component to add
     */
    public addComponent(cls: any): Promise<void>;

    /**
     * Applies a service to this [[Container]]
     * @param cls The service to add
     */
    public addService(cls: any): Promise<void>;

    /**
     * Runs all injections for components/services
     * @param target The target to inject
     * @deprecated
     */
    public runInjections(target: any): void;

    /**
     * Implements all injections into a class prototype (run this before creating a new class instance)
     * @param target The target class to use
     */
    public addInjections(target: any): void;

    /**
     * Registers an emitter to this [[Container]] for subscription handling.
     * @param emitter The emitter instance to use
     * @returns This [[Container]] instance to chain methods.
     */
    public addEmitter<E extends EventEmitterLike>(name: string, emitter: E): this;

    /**
     * Finds an emitter from this [[Container]] and returns it
     * @param emitterCls The event emitter class to use
     */
    public findEmitter<E extends EventEmitterLike>(name: string): E | null;

    /**
     * Finds a component, service, or singleton by a specific `predicate` function
     * @param func The predicate function to find the component, service, or singleton's constructor type or name
     * @returns The component, service, singleton found or `null` if nothing was found
     */
    public find<S extends BaseComponent | BaseService | BaseSingleton, ThisArg = Container>(
      func: (value: BaseComponent | BaseService | BaseSingleton) => boolean,
      thisArg?: ThisArg
    ): S | null;
  }

  /**
   * Represents a subscription that is handled by the component or service.
   */
  export class Subscription {
    /**
     * If this subscription is ran once and unsubscribed after
     */
    public once: boolean;
    /**
     * The name of the subscription (which is the event name)
     */
    public name: string;

    constructor({
      listener,
      emitter,
      name,
      once
    }: SubscriptionInfo);

    /**
     * Subscribes to the emitter
     */
    public subscribe(): void;

    /**
     * Disposes the subscription
     */
    public dispose(): void;
  }

  class ComponentAPI extends SharedAPI {
    /**
     * Represents the entity itself
     */
    public entity: BaseService;

    /**
     * The shared API type
     */
    public type: EntityType.Service;

    constructor(container: Container, entity: BaseService);
  }

  class ServiceAPI extends SharedAPI {
    /**
     * Represents the entity itself
     */
    public entity: BaseService;

    /**
     * The shared API type
     */
    public type: EntityType.Service;

    constructor(container: Container, entity: BaseService);
  }

  /**
   * Represents an API for interacting with the container with a
   * simple API. You can inject references yourself, add subscriptions,
   * etc. Components will share the [[ComponentAPI]] and services will
   * share the [[ServiceAPI]], which extends this class.
   */
  class SharedAPI {
    /**
     * The container instance for this [[SharedAPI]].
     */
    public container: Container;

    /**
     * Represents the entity itself
     */
    public entity: BaseComponent | BaseService;

    /**
     * The shared API type
     */
    public type: EntityType;

    constructor(container: Container);

    /**
     * Returns a boolean value if this instance is [[ComponentAPI]].
     */
    public static get isComponentAPI(): boolean;

    /**
     * Returns a boolean if this instance is [[ServiceAPI]].
     */
    public static get isServiceAPI(): boolean;

    /**
     * Simplified method to retrieve the class reference of a component,
     * service, or singleton.
     *
     * > Note: This method is a proxy to [[Container.$ref]]
     *
     * @param ref The reference class to use
     */
    public getReference<TReturn = any>(ref: any): TReturn;

    /**
     * Return a component from the container's component tree.
     * @param name The name of the component
     * @throws {TypeError}: If the component couldn't be found.
     */
    public getComponent(name: string): BaseComponent;

    /**
     * Returns a service from the container's services tree.
     * @param name The name of the service
     * @throws {TypeError}: If the service couldn't be found.
     */
    public getService(name: string): BaseService;

    /**
     * Lazily adds a subscription to the component or service's subscription
     * tree. To forward multiple, use the [SharedAPI.forwardSubscriptions] function.
     *
     * @param emitter The event emitter to use.
     * @param name The name of the event to forward
     * @param listener The listener function to forward
     * @param once If this event should be emitted once and unsubscribed after it's called.
     */
    addSubscription<
      E extends EventEmitterLike,
      Events = {},
      K extends keyof Events = keyof Events
    >(emitter: E, name: K, listener: Events[K], once?: boolean): void;

    /**
     * Lazily adds multiple subscriptions into this component or service tree.
     * To lazily forward once, use the [SharedAPI.addSubscription] function.
     *
     * @param emitter The event emitter to use.
     * @param childClass The child class to forward subscriptions to this component
     * or service tree.
     */
    forwardSubscriptions<E extends EventEmitterLike>(emitter: E, childClass: any): void;

    /**
     * Lazily add a single subscription with a pending subscription into this component
     * or service tree.
     *
     * @param emitter The emitter to use
     * @param sub The pending subscription to use
     */
    public forwardSubscription<E extends EventEmitterLike>(emitter: E, subscription: PendingSubscription): void;
  }

  // ~ Decorators ~
  /**
   * Decorator to inject components, services, or singletons
   * into a property.
   */
  export const Inject: PropertyDecorator;

  /**
   * Decorator to mark this class as a Component
   * @param children Any children classes to pass in or an absolute path to use
   * @param priority The priority hierarchy
   * @param name The name of the component
   */
  export function Component({ priority, children, name }: ComponentOrServiceOptions): ClassDecorator;

  /**
   * Decorator to mark this class as a Service
   * @param children Any children classes to pass in or an absolute path to use
   * @param priority The priority hierarchy
   * @param name The name of the component
   */
  export function Service({ priority, children, name }: ComponentOrServiceOptions): ClassDecorator;

  /**
   * Adds a subscription to this method with type-safety included
   * @param event The event name to use
   * @param emitter The event emitter to use
   * @param once If this subscription should be pushed to the callstack
   * and popped off after emittion.
   */
  export function Subscribe<
    T extends Record<string, unknown>,
    K extends keyof T = keyof T
  >(event: K, emitter?: string, once?: boolean): MethodDecorator;

  /**
  * Adds a subscription to this method without type-safety included
  * @param event The event name to use
  * @param emitter The event emitter to define
  * @param once If this subscription should be pushed to the callstack
  * and popped off after emittion.
  */
  export function Subscribe(event: string, emitter?: string, once?: boolean): MethodDecorator;

  // ~ Enums ~
  export enum EntityType {
    Component = 'component',
    Service   = 'service'
  }

  // ~ Types & Interfaces ~
  /**
   * Represents the lifecycle hooks for a [BaseComponent]
   * or a [BaseService].
   *
   * @typeparam C **~** The child object, if any.
   */
  export interface ComponentOrServiceHooks<C = {}> {
    /**
     * Called when [Container.dispose] is called, this disposes
     * each child in this component / service.
     *
     * @param child The child object that is being disposed
     */
    onChildDispose?(child: C): void;

    /**
     * Called when [Container.load], [Container.addComponent], or [Container.addService] is called.
     * This function properly adds a child class to this component / service.
     *
     * @param child The child object that was received from the parent component / services'
     * `children` property.
     */
    onChildLoad?(child: C): void;

    /**
     * Called when [Container.dispose] is called. This disposes
     * any database calls, or whatever for this specific component
     * or service.
     */
    dispose?(): void | Promise<void>;

    /**
     * Called when [Container.load], [Container.addComponent], or [Container.addService] is called.
     * This functions acts like the foundation on introducting your component / service
     * to your application.
     */
    load?(): void | Promise<void>;
  }

  /**
   * Type alias to represented the return value of `require()` or `import()`
   */
  type ImportedDefaultExport<T> = T extends { default: infer P }
    ? P
    : T;

  /**
   * Represents a base component; typed for [[Application.components]].
   * You can inject singletons, services, and components.
   */
  interface BaseComponent {
    /**
     * Represents the type for this [[BaseComponent]]. It's always
     * gonna be `component`, just here for simplicity
     */
    type: string;

    /**
     * The name of the component
     */
    name: string;

    /**
     * The priority of this [[BaseComponent]]
     */
    priority: number;

    /**
     * The children classes in this [[BaseComponent]]
     */
    children: any[];
  }

  /**
   * Represents a base service; typed for [[Application.services]].
   * You can inject singletons, services, and components.
   */
  interface BaseService {
    /**
     * Represents the type for this [[BaseComponent]]. It's always
     * gonna be `component`, just here for simplicity
     */
    type: string;

    /**
     * The name of the component
     */
    name: string;

    /**
     * The priority of this [[BaseComponent]]
     */
    priority: number;

    /**
     * The children classes in this [[BaseService]]
     */
    children: any[];
  }

  /**
   * Represents a singleton that is registered into Lilith
   */
  interface BaseSingleton {
    /**
     * The reference to the singleton itself
     */
    $ref: any;

    /**
     * The type for this [[BaseSingleton]]. It'll always default to `'singleton'`.
     */
    type: string;

    /**
     * The singleton's key, just a random scribble of words.
     */
    key: string;
  }

  /**
   * Represents the pending injections from all classes
   */
  interface PendingInjectDefinition {
    /**
     * The target class
     */
    target: any;

    /**
     * The property key
     */
    prop: string | symbol;

    /**
     * The inferred reference to inject
     */
    $ref: any;
  }

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
     * Emitted if a child has errored while initializing
     *
     * @param cls The component or service
     * @param child The child of the parent, the child has access
     * to the parent with `child.parent`.
     * @param error The error that occured
     */
    childInitError(cls: BaseComponent | BaseService, child: any, error: any): void;

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

  /**
   * Represents the options for using a Component
   */
  interface ComponentOrServiceOptions {
    /**
     * List of children or an absolute path to load in children
     */
    children?: any[] | string;

    /**
     * The priority to load the component
     */
    priority: number;

    /**
     * The name of the component
     */
    name: string;
  }

  /**
   * Represents a pending subscription to be added
   */
  interface PendingSubscription {
    /**
     * The listener function
     */
    listener: (...args: any[]) => any;

    /**
     * The event to use for this subscription
     */
    event: string;

    /**
     * If this subscription should be pushed to the subscription
     * callstack and popped off when it is emitted.
     */
    once: boolean;

    emitterCls?: any;
    target: any;
    prop: string | symbol;
  }

  interface SubscriptionInfo {
    listener(...args: any[]): any;
    emitter: EventEmitterLike;
    once: boolean;
    name: string;
  }

  interface EventEmitterLike {
    removeListener(event: string, listener: (...args: any[]) => void): any;
    addListener(event: string, listener: (...args: any[]) => void): any;
    once(event: string, listener: (...args: any[]) => void): any;
    on(event: string, listener: (...args: any[]) => void): any;
  }
}

export = lilith;
export as namespace lilith;
