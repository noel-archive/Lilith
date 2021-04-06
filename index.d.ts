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
     * Returns the singleton tree
     */
    public singletons: Collection<string, BaseSingleton>;

    /**
     * Returns the service tree
     */
    public services: Collection<string, BaseService>;

    /**
     * Verifies the current state of this [[Container]], this initializes all components, services, and singletons.
     * @deprecated This method is deprecated and will be removed in a future release, use [[Container.load]].
     */
    public verify(): Promise<void>;

    /**
     * Initializes all components, services, and singletons.
     */
    public load(): Promise<void>;

    /**
     * Sets the directory to find components in
     * @deprecated This method is deprecated and will be removed in a future release. Use `componentsDir` when
     * creating this [[Container]]
     * @param dir The directory
     */
    public findComponentsIn(dir: string): this;

    /**
     * Sets the directory to find services in
     * @deprecated This method is deprecated and will be removed in a future release. Use `servicesDir` when
     * creating this [[Container]]
     * @param dir The directory
     */
    public findServicesIn(dir: string): this;

    /**
     * Returns a reference from the component, singleton, or service tree
     * @param ref The reference to find
     * @typeparam Ref The reference by class (it'll return `typeof <ref>`, use the second generic to return the class)
     * @typeparam TReturn The return value
     */
    public $ref<Ref extends any, TReturn extends any = any>(ref: Ref): TReturn;

    /**
     * Injects all pending references to the target class
     * @param pending The pending injections
     */
    public inject(pending: Lilith.PendingInjectDefinition): void;

    /**
     * Bulk-add a list of singletons
     * @param singletons The singletons to add
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
  }

  // ~ Decorators ~
  /**
   * Decorator to inject components, services, or singletons
   * into a property.
   */
  export const Inject: PropertyDecorator;

  /**
   * Decorator to mark this class as a Component
   * @param priority The priority hierarchy
   * @param name The name of the component
   */
  export function Component({ priority, name }: { priority: number; name: string; }): ClassDecorator;

  /**
   * Decorator to mark this class as a Service
   * @param priority The priority hierarchy
   * @param name The name of the component
   */
  export function Service({ priority, name }: { priority: number; name: string; }): ClassDecorator;

  /**
   * Links a parent component or service to this class
   * @param cls The parent component or service
   * @example `@LinkParent(SomeService)`
   */
  export function LinkParent(cls: any): ClassDecorator;

  /**
   * Decorator to find all children in
   * @param path The absolute path to use
   */
  export function FindChildrenIn(path: string): ClassDecorator;

  // ~ Types & Interfaces ~
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
}

export = Lilith;
export as namespace Lilith;
