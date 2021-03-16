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

  /**
   * Decorator to inject components, services, or singletons
   * into a property.
   */
  export const Inject: PropertyDecorator;

  // ~ Types ~
  /** Type-alias to check if [T] could be a component/service. */
  export type ReferenceLike<T> = T extends Lilith.Component | Lilith.Service ? T : any;

  /** References to injectable values from a property. */
  interface InjectReferences {
    property: string;
    ref: any;
  }

  // ~ Functions ~
  /**
   * Marks this class as non-injectable
   */
  export function NotInjectable(): ClassDecorator;

  /**
   * Retrieve a list of injectables from a specific [target] class.
   * @param target The target class
   * @returns An array of references
   */
  export function getInjectables(target: any): Lilith.InjectReferences[];

  /**
   * Checks if a [target] class is injectable or not. All classes are injectable
   * by default except if a class is marked with `@NonInjectable()`.
   *
   * @param target The target class
   */
  export function isInjectable(target: any): boolean;

  // ~ Classes ~
  export interface Component {
    /**
     * Called when `Application.dispose` is called, this ensures
     * anything that is disposable should be disposed.
     */
    dispose?(): void;

    /**
     * Called when `Application.verify` is called. Ensures
     * that the component is loaded.
     */
    load?(): void | Promise<void>;

    /**
     * Priority to load the component. If the priority
     * number is lowered, it'll be loaded first.
     */
    priority: number;

    /**
     * The name of the component
     */
    name: string;
  }

  export interface Service {
    /**
     * Called when `Application.dispose` is called, this ensures
     * anything that is disposable should be disposed.
     */
    dispose?(): void;

    /**
     * Called when `Application.verify` is called. Ensures
     * that the service is loaded.
     */
    load?(): void | Promise<void>;

    /**
     * The name of the service
     */
    name: string;
  }

  interface LilithEvents {
    // Component hooks
    'component.initializing'(component: Component): void;
    'component.loaded'(component: Component): void;

    // Singleton hooks
    'singleton.loaded'(singleton: any): void;

    // Service hooks
    'service.initializing'(service: Service): void;
    'service.loaded'(service: Service): void;

    // other
    debug(message: string): void;
    warn(message: string): void;
  }

  /**
   * Main entrypoint to Lilith. This is where all injectables
   * get referenced and are available in.
   */
  export class Application extends EventBus<LilithEvents> {
    /** List of the singletons available to this Application context. */
    public singletons: Collection<string, any>;

    /** List of the components available to this Application context. */
    public components: Collection<string, Component>;

    /** List of references available to this Application context. */
    public references: Collection<any, string>;

    /** List of the services available to this Application context. */
    public services: Collection<string, Service>;

    /**
     * Verify the current state of Lilith. If anything that wasn't
     * correctly placed, then a [Error] will throw.
     */
    verify(): Promise<void>;

    /**
     * Return a reference from the reference tree
     * @param reference The reference to find
     */
    $ref<T extends any>(reference: ReferenceLike<T>): T;

    /**
     * Sets the directory to find components in
     * @param dir The directory
     */
    findComponentsIn(dir: string): this;

    /**
     * Sets the directory to find singletons in
     * @param dir The directory
     */
    findSingletonsIn(dir: string): this;

    /**
     * Sets the directory to find services in
     * @param dir The directory
     */
    findServicesIn(dir: string): this;

    /**
     * Scope a [singleton] value to this [Application]
     * @param singleton The singleton to add
     */
    addSingleton(singleton: any): this;

    /**
     * Dispose this [Application] instance.
     */
    dispose(): void;

    /**
     * Add injectables to a [target] class
     * @param injections List of injections to implement
     * @param target The target class
     */
    inject(injections: Lilith.InjectReferences[], target: any): void;
  }
}

export = Lilith;
export as namespace Lilith;
