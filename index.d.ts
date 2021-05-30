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
declare namespace Lilith {
  // ~ Constants ~
  /** Returns the version of Lilith */
  export const version: string;

  // ~ Classes ~
  /**
   * Represents a "container" of components, singletons, and services. This is the main
   * entrypoint to Lilith, this is your creation tool to create your application! **(\*≧∀≦\*)**
   */
  export class Container extends EventBus<Lilith.ContainerEvents> {
    /**
     * Represents a "container" of components, singletons, and services. This is the main
     * entrypoint to Lilith, this is your creation tool to create your application! **(\*≧∀≦\*)**
     *
     * @param options Any additional options to use
     */
    constructor(options?: Lilith.ContainerOptions);

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
    public inject(target: any, pending: Lilith.PendingInjectDefinition): void;

    /**
     * Bulk-add a list of singletons
     * @param singletons The singletons to add
     * @deprecated
     */
    public addSingletons(singletons: any[]): void;

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
     */
    public runInjections(target: any): void;

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
}

export = Lilith;
export as namespace Lilith;
