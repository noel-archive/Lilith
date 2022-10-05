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

import type { CamelCase, Constructor, Replace } from 'type-fest';
import type { Lazy } from '@noelware/utils';

/** Represents a type-alias for all the container event names. */
export type ContainerEventNames = keyof ContainerEvents;

/** Uses the [[Replace <https://github.com/sindresorhus/type-fest/blob/main/source/replace.d.ts#L5-L67>]] type for replacing all `:` with `-`. */
export type ReplaceColonWithDash<S> = S extends string ? Replace<S, ':', '-', { all: true }> : never;

/** Represents a type-alias for loading Lilith objects. */
export type Load = any | Constructor<any> | { path: string };

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
  onLoad?(...args: A): Promise<void> | void;
}

/** Represents an extension of {@link LifecycleEvents} to include children lifecycles. */
export interface ChildLifecycleEvents extends LifecycleEvents {
  onChildDestroy?(child: LilithObject): void;
  onChildLoad?(child: LilithObject): Promise<void> | void;
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
  $ref?: any; // this is only here for classes that are services, the `services()` function ignore this.
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
  name: string;
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

export const ContainerEvents: Record<CamelCase<ReplaceColonWithDash<ContainerEventNames>>, ContainerEventNames> = {
  serviceChildRegister: 'service:child:register',
  serviceChildDestroy: 'service:child:destroy',
  singletonRegister: 'singleton:register',
  singletonDestroy: 'singleton:destroy',
  serviceRegister: 'service:register',
  serviceDestroy: 'service:destroy',
  debug: 'debug'
};
