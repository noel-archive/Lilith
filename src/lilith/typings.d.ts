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

import { Lazy, EventBus } from '@noelware/utils';
import { Constructor } from 'type-fest/source/basic';
import { CamelCase } from 'type-fest';
import { Replace } from 'type-fest/source/replace';

/*
 * TypeScript declarations for @lilith/{library} v{version}
 *
 * ## Maintainers
 * - Noel <cutie@floofy.dev> (https://floofy.dev)
 *
 * ## Contributors
 * - Noel <cutie@floofy.dev> (https://floofy.dev)
 */

declare namespace Lilith {
  /**
   * Hook to retrieve the {@link Container} instance, if it was ever constructed.
   * @returns A {@link Container} if any, or a `Error` thrown.
   */
  export function useContainer<Variables extends {} = {}>(): Container<Variables>;

  /** Represents a interface for the {@link Lilith.singleton singleton} function. */
  export interface CreateSingletonOptions<T extends {}> extends LifecycleEvents<[T]> {
    provide(): T;
  }

  /**
   * Creates a new {@link Singleton} object.
   * @param provide The lazily evaluated function.
   * @returns A {@link Singleton} object.
   */
  export function singleton<T extends {} = {}>(provide: () => T): Singleton<T>;

  /**
   * Creates a new {@link Singleton} object with lifecycle hooks.
   * @param param0 The options for adding lifecycle hooks and the lazily evaluated data.
   * @param param0.provide The lazily evaluated function.
   * @param param0.onLoad Lifecycle hook when this singleton is being initialized.
   * @param param0.onDestroy Lifecycle hook when this singleton is being destroyed.
   * @returns A {@link Singleton} object.
   */
  export function singleton<T extends {} = {}>({ provide, onLoad, onDestroy }: CreateSingletonOptions<T>): Singleton<T>;

  /** Represents a type-alis signature to create a service from the {@link Lilith.service service} function. */
  export type CreateServiceOptions = Omit<Service, 'type' | 'priority' | '$ref'> & { priority?: number };

  /**
   * Creates a new {@link Service} object.
   * @param param0 The options for creating a {@link Service}.
   * @param param0.name The name of the service
   * @param param0.children The children dependencies that the service should load.
   * @param param0.onChildDestroy Lifecycle method to do extra stuff when a child is being destroyed.
   * @param param0.onChildLoad Lifecycle method to do extra stuff when a child is being initialized.
   * @param param0.onDestroy Lifecycle method to do extra stuff when this service is being destroyed.
   * @param param0.onLoad Lifecycle method to do extra stuff when this service is being initialized.
   * @returns A {@link Service} object.
   */
  export function service({
    name,
    children,
    priority,
    onChildDestroy,
    onChildLoad,
    onDestroy,
    onLoad
  }: CreateServiceOptions): Service;

  /**
   * Assertion function to check if the object represents is a {@link LilithObject} or not.
   * @param key The key to check, since all objects have a `'type'` property.
   * @param value The object itself.
   */
  export function isLilithObject<O extends LilithObject>(key: O['type'], value: unknown): value is O;

  /**
   * Assertion function to check if the value represented is a {@link Singleton} object or not.
   * @param value The value that is represented as a {@link Singleton} object.
   */
  export function isSingleton<T extends {} = {}>(value: unknown): value is Singleton<T>;

  /**
   * Assertion function to check if the value represented is a {@link Service} object or not.
   * @param value The value that is represented as a {@link Service} object.
   */
  export function isService(value: unknown): value is Service;

  /** Represents a type-alias for all the container event names. */
  export type ContainerEventNames = keyof ContainerEvents;

  /** Uses the [[Replace <https://github.com/sindresorhus/type-fest/blob/main/source/replace.d.ts#L5-L67>]] type for replacing all `:` with `-`. */
  export type ReplaceColonWithDash<S> = S extends string ? Replace<S, ':', '-', { all: true }> : never;

  /** Represents a type-alias for loading Lilith objects. */
  export type Load = any | Constructor<any> | { path: string };

  /**
   * Represents all the container events mapped from the colon counterpart to camelCase.
   */
  export const ContainerEvents: Record<CamelCase<ReplaceColonWithDash<ContainerEventNames>>, ContainerEventNames>;

  /** Represents the core options for the {@link Container}. */
  export interface ContainerOptions<Variables extends {} = {}> {
    singletons?: (Load | (() => any))[];
    variables?: Variables;
    services?: Load[];
  }

  /**
   * Represents the main entrypoint of Lilith, the container. This is where all the IoC hooks occur,
   * use the {@link Container.start #start} method to run the IoC hooks!
   */
  export class Container<Variables extends {} = {}> extends EventBus<ContainerEvents> {
    /**
     * @param options The container options object.
     */
    constructor(options?: ContainerOptions<Variables>);

    /**
     * Returns the container instance, if it was ever initialized. Returns `undefined`
     * if the container was never constructed.
     *
     * It is best recommended to use the {@link Lilith.useContainer useContainer} hook instead.
     */
    static get instance(): Container | undefined;

    /**
     * Starts the container and does the proper initialization for all Lilith objects.
     */
    start(): Promise<void>;

    /**
     * Destroys the IoC container and all the containing services, singletons,
     * and variables. This will also unhook this container instance from the
     * global container that the {@link Lilith.useContainer useContainer} hook
     * uses.
     */
    destroy(): void;

    /**
     * Inject a service or singleton based off the constructor that it was
     * injected from.
     *
     * @param ctor The constructor.
     * @return The singleton or service, or `null` if nothing was found.
     */
    inject<T>(ctor: Constructor<T>): T | null;

    /**
     * Inject a variable based off the variable name.
     * @param key The name of the variable.
     * @return The variable, or `null` if none was found.
     */
    inject<K extends keyof Variables>(key: K): Variables[K] | null;

    /**
     * Inject a service based off the name.
     * @param name The name of the service.
     * @return The service, or `null` if nothing was found.
     */
    inject<T>(name: string): T | null;

    /**
     * Adds a singleton based off the {@link Singleton} object.
     * @param singleton The singleton object.
     */
    addSingleton<T extends {}>(singleton: Omit<Singleton<T>, '$ref' | 'type'> & { provide: () => T }): void;

    /**
     * Adds a singleton at runtime. The function that is used as the parameter is lazily evaluated.
     * @param value The lazily evaluated value that is used to act as a singleton.
     */
    addSingleton<T extends {}>(value: () => T): void;

    /**
     * Gets a variable from this {@link Container} instance. This is the recommended way
     * to get variables than {@link Container.inject} since this is more type-safe and
     * fast way.
     *
     * @param key The variable's name.
     * @return The variable, or `null` if no variable was found.
     */
    variable<K extends keyof Variables>(key: K): Variables[K] | null;

    /**
     * Adds a variable at runtime.
     * @param key The variable name
     * @param value The variable value
     */
    addVariable<K extends keyof Variables>(key: K, value: Variables[K]): void;
  }

  /** Represents all the events that a [[Container]] can listen to. */
  export interface ContainerEvents {
    /**
     * Emitted when a child service is being registered in a parent service.
     *
     * @event service:child:register
     * @param parent The parent service.
     * @param child The child service.
     */
    'service:child:register'(parent: any, child: any): void;

    /**
     * Emitted when a child service is being destroyed in a parent service. This event
     * is useful to check what services have teardown support.
     *
     * @event service:child:destroy
     * @param parent The parent service.
     * @param child The child service.
     */
    'service:child:destroy'(parent: any, child: any): void;

    /**
     * Emitted when a singleton is being registered and initialized in the [[Container]]. This is useful
     * for logging which singletons are available.
     *
     * @event singleton:register
     * @param singleton The singleton object.
     */
    'singleton:register'(singleton: any): void;

    /**
     * Emitted when a singleton is being destroyed and deinitialized in the [[Container]]. This is useful
     * for logging which singletons have teardown support.
     *
     * @event singleton:destroy
     * @param singleton The singleton object.
     */
    'singleton:destroy'(singleton: any): void;

    /**
     * Emitted when a service is being registered and initialized in the [[Container]]. This is useful
     * for logging which services are available.
     *
     * @event service:destroy
     * @param service The service object.
     */
    'service:register'(service: any): void;

    /**
     * Emitted when a service is being destroyed and deinitialized in the [[Container]]. This is useful
     * for logging which singletons have teardown support.
     *
     * @event service:destroy
     * @param service The service object.
     */
    'service:destroy'(service: any): void;

    /**
     * Emitted when the container has logs it wants to send to the end user with this event. Useful
     * for debugging the container.
     *
     * @event debug
     * @param message The debug message.
     */
    debug(message: string): void;
  }

  /** Represents a base object that represents any piece (i.e, service, singleton, variable, injectable) */
  export interface LilithObject {
    type: string;
  }

  /** Represents a interface of the basic lifecycles a {@link LilithObject} has. */
  export interface LifecycleEvents<A extends any[] = []> {
    onDestroy?(...args: A): void;
    onLoad?(...args: A): void;
  }

  /** Represents an extension of {@link LifecycleEvents} to include children lifecycles. */
  export interface ChildLifecycleEvents extends LifecycleEvents {
    onChildDestroy?(child: LilithObject): void;
    onChildLoad?(child: LilithObject): void;
  }

  /**
   * Represents a service, the fundemental piece of **Lilith**. Services are a way to encaspulate
   * modules that can be shared with different services. Services can be injectable easily with
   * the [[Container#inject]] method, or with the [[inject]] function call.
   *
   * @example
   * ```ts
   * import { Service, Inject, createLilith } from '@lilith/core';
   *
   * (@)Service('my service name')
   * class MyService {
   *   private readonly someOtherService: SomeService;
   *   constructor(@Inject someOtherService: SomeService) {
   *      this.someOtherService = someOtherService;
   *   }
   *
   *   onLoad() {
   *      this.someOtherService.doSomething();
   *   }
   * }
   *
   * (@)Service('my other service')
   * class SomeService {
   *   doSomething(): void { console.log('i did something!'); }
   * }
   *
   * const container = createLilith({
   *    // order matters!
   *    services: [SomeService, MyService]
   * });
   *
   * container.start();
   * // you should have "i did something!" printed in the console
   *
   * container.destroy();
   * ```
   */
  export interface Service extends LilithObject, ChildLifecycleEvents {
    priority: number;
    children: any[];
    $ref?: any;
    type: 'service';
    name: string;
  }

  /**
   * Represents a singleton. A singleton is a way to share objects within Lilith services, and since singletons
   * are injectable, you can use the [[Container#inject]], [[inject]], or the [[@Inject]] decorator to inject
   * it into services.
   *
   * Singletons can only be objects, not primitives (i.e, string, number, boolean). Singletons must be constructed
   * without any prior knowledge on how to construct itself. Singletons doesn't have lifecycle events also!
   *
   * Singletons are also **lazily evaluated**, they're only loaded once they are needed. Otherwise, you might
   * want to opt in for **variables** that are loaded automatically.
   *
   * @example
   * ```ts
   * import { singleton, createLilith } from '@lilith/core';
   *
   * class SomeObjectToHold {
   *   doSomething(): void { console.log('I did something!'); }
   * }
   *
   * const container = createLilith({
   *   singletons: [
   *      singleton(() => new SomeObjectToHold())
   *   ]
   * });
   *
   * container.start();
   *
   * const singleton = container.inject(SomeObjectToHold);
   * singleton.doSomething();
   * // console printed "I did something!"
   *
   * container.destroy();
   * ```
   */
  export interface Singleton<T extends {} = {}> extends LilithObject, LifecycleEvents<[T]> {
    $ref: Lazy<T>;
    type: 'singleton';
  }

  /**
   * Represents a variable that can be used immediately. This is only useful in the `@lilith/config` library,
   * or you can create variables. **Variables** are different from singletons, **Variables** can hold
   * any data type (string, boolean, number, etc), but singletons can only hold **objects** that are
   * constructed.
   *
   * You might want to use **variables** over **singletons** for:
   * - Configuration injection (i.e, with `@lilith/config`)
   * - Easy lookup for values that you might need in services.
   *
   * You might want to avoid **variables** for:
   * - Objects that should be lazily-loaded, while **variables** are loaded and kept automatically
   *   in the container tree, rather than lazily evaluated when looked up.
   *
   * @warning Variables are loaded even if **Container#start** was not called.
   * @example
   * ```ts
   * import { createLilith } from '@lilith/core';
   *
   * export interface VariableContainer {
   *   key: 'value';
   * }
   *
   * const container = createLilith<VariableContainer>({
   *   variables: {
   *     key: 'value'
   *   }
   * });
   *
   * const value = container.variable('key');
   * // => 'value'
   * ```
   */
  export interface Variable<K extends string | symbol, V = unknown> extends LilithObject {
    value: V;
    type: 'variable';
    key: K;
  }

  /** Represents the metadata object for the [[@Inject]] and [[@Variable]] decorators. */
  export interface InjectionMetaObject {
    property: string | symbol;
  }

  /** Type-alias to extend {@link InjectionMetaObject} with a object. */
  export type InjectionMeta<T extends {} = {}> = InjectionMetaObject & T;

  /** Represents a type-alias of the injection metadata that is stored on the class. */
  export type InjectInjectionMeta = InjectionMeta<{ $ref: any }>;

  /**
   * Represents the options for the {@link Service @Service} decorator.
   */
  export interface ServiceDecoratorDeclaration {
    /** The priority of this service to be loaded. The higher the service priority is, the more chances it'll be loaded first. */
    priority?: number;

    /** Children objects to load into this service. This can be any piece of data, even services! */
    children?: Load[];

    /** The name of the service to identify itself. */
    name: string;
  }

  /**
   * Provides metadata about the target class that should be treated as a service that can inject
   * other services.
   *
   * You can retrieve all the metadata about all services in the {@link Reflect} object, as an example:
   * ```ts
   * // You are required to have `reflect-metadata` installed. It is a peer dependency to @lilith/core.
   * import { Service, MetadataKeys } from '@lilith/core';
   *
   * (@)Service({ name: 'my service name', priority: 100 })
   * class MyService {}
   *
   * const metadata = Reflect.getMetadata(MetadataKeys.Service, MyService);
   * // => { name: String, children: any[], priority: integer } | undefined
   * ```
   *
   * Lilith does injecting from the constructor, or any properties automatically when you initialized
   * your container, so you don't have to do it yourself. You can also use the [[Container#addService]] to
   * add a service at runtime.
   *
   * @param param0 The {@link ServiceDecoratorDeclaration} object.
   * @param param0.priority The priority of this service to be loaded. The higher the service priority is, the more chances it'll be loaded first.
   * @param param0.children A {@link Load} type that can represents an absolute path, array of classes/instances.
   * @param param0.name The name of the service, to identify itself.
   * @returns A {@link ClassDecorator}.
   */
  export const Service: ({ children, name, priority }: ServiceDecoratorDeclaration) => ClassDecorator;

  /**
   * Injects a service or singleton into the parent class by the constructor, or a property of that
   * class. Injections happen automatically when you start your container, so be wary of that.
   *
   * Injections are also scoped to the service that it is targeting. Before Lilith v6, injections were
   * scoped to the global object, so you could use the `global` object to get all the injection references. Now,
   * they're stored in the service's class metadata.
   *
   * @example
   * ```ts
   * import { Service, singleton, createLilith } from '@lilith/core';
   *
   * class SingletonThing {
   *   doSomething(): void { console.log('Hello, world!'); }
   * }
   *
   * (@)Service({ name: 'my service name', priority: 200 })
   * class MyService {
   *    (@)Inject
   *    private readonly singleton!: SingletonThing;
   *
   *    onLoad() {
   *       this.singleton.doSomething();
   *    }
   * }
   *
   * const container = createLilith({
   *    singletons: [SingletonThing],
   *    services: [MyService]
   * });
   *
   * // start the container so injections can apply
   * container.start();
   *
   * // you should see 'Hello, world!' printed to the terminal.
   * container.destroy(); // Destroy the container and release the instance away.
   * ```
   */
  export const Inject: PropertyDecorator;

  /** Represents a type-alias of the variable injection metadata that is stored on the class. */
  export type VariableInjectionMeta = InjectionMeta<{ key: string }>;

  /**
   * The **Variable** decorator allows you to reference container variables in your services. It is also
   * available as a constructor or property injection, refer to the [[@Inject]] decorator documentation
   * on how to use it, but replace [[@Inject]] with [[@Variable]]
   *
   * @param key The key that is scoped to a variable in the container.
   */
  export const Variable: (key: string) => PropertyDecorator;

  /**
   * Simpiled version of creating a {@link Container}.
   * @param options The container options.
   */
  export const createLilith: <Variables extends {} = {}>(options?: ContainerOptions<Variables>) => Container<Variables>;

  /**
   * Represents all the metadata keys that Lilith uses. This is meant for internal
   * purposes.
   *
   * @internal
   */
  export enum MetadataKeys {
    Injections = '$lilith::injections',
    Variable = '$lilith::variable',
    Service = '$lilith::service'
  }
}

export = Lilith;
export as namespace Lilith;
