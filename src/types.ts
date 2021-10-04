/**
 * Copyright (c) 2021 Noelware
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

import type { Subscription } from './Subscription';
import type { Container } from '.';

/**
 * Type alias to represented the return value of `require()` or `import()`
 */
export type ImportedDefaultExport<T> = T extends { default: infer P } ? P : T;

/**
 * Represents a base component; typed for [[Application.components]].
 * You can inject singletons, services, and components.
 */
export interface BaseComponent {
  _classRef: any;

  /**
   * List of subscriptions managed by this component.
   */
  subscriptions: Subscription[];

  /**
   * List of children attached to this [[BaseComponent]] as it's parent
   */
  children: any[];

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
}

/**
 * Represents a base service; typed for [[Application.services]].
 * You can inject singletons, services, and components.
 */
export interface BaseService {
  _classRef: any;

  /**
   * List of subscriptions managed by this service.
   */
  subscriptions: Subscription[];

  /**
   * List of children attached to this [[BaseService]] as it's parent
   */
  children: any[];

  /**
   * Represents the type for this [[BaseService]]. It's always
   * gonna be `service`, just here for simplicity
   */
  type: string;

  /**
   * The name of the service
   */
  name: string;

  /**
   * The priority of this [[BaseService]]
   */
  priority: number;
}

/**
 * List of metadata keys available, this is not exported in Lilith itself.
 */
export const enum MetadataKeys {
  PendingInjections = '$lilith::api::injections::pending',
  Subscription = '$lilith::api::subscription',
  Injectable = '$lilith::api::injectables',
  Variable = '$lilith::api::variable',
  Component = '$lilith::api::component',
  Service = '$lilith::api::service',
}

/**
 * Represents the pending injections from all classes
 */
export interface PendingInjectDefinition {
  /**
   * If this belongs in a constructor/function parameter.
   */
  isParam: boolean;

  /**
   * Returns the index if {@link PendingInjectDefinition.isParam} is true.
   */
  index?: number;

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

export type PendingVariableDefinition = PendingInjectDefinition;

/**
 * Represents the definition of a referred object
 */
export interface ReferredObjectDefinition {
  /**
   * A number to show if this referred object should be initialized
   * first or list, like a priority tree
   */
  priority: number;

  /**
   * List of children or an absolute path to load in children
   */
  children?: string | any[];

  /**
   * The type of this [[ReferredObjectDefintion]]
   */
  type: 'component' | 'service';

  /**
   * The name of this [[ReferredObjectDefinition]]
   */
  name: string;
}

/**
 * Represents a singleton that is registered into Lilith
 */
export interface BaseSingleton {
  /**
   * Function to teardown this singleton, if any
   */
  teardown?(this: Container, singleton: any): void | Promise<void>;

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
 * Represents a variable instance that was added using
 * [[Container.addVariable]] or using the `variables` option
 * when creating a container.
 */
export interface BaseVariable {
  /**
   * The reference to the variable
   */
  $ref: any;

  /**
   * The type that this is represented as (always `variable`)
   */
  type: 'variable';

  /**
   * The name of the variable
   */
  name: string;
}

/**
 * Represents a pending subscription to be added
 */
export interface PendingSubscription {
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

/**
 * Represents a base object of the `@Injectable` decorator.
 */
export interface BaseInjectable {
  /**
   * Returns the reference of the injectable.
   */
  $ref: any;

  /**
   * Returns the type this object is, it'll always be
   * `'injectable'`.
   */
  type: 'injectable';

  /**
   * List of subscriptions managed by this service.
   */
  subscriptions: Subscription[];
}
