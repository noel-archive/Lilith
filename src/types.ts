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

/**
 * Type alias to represented the return value of `require()` or `import()`
 */
export type ImportedDefaultExport<T> = T extends { default: infer P }
  ? P
  : T;

/**
 * Represents a base component; typed for [[Application.components]].
 * You can inject singletons, services, and components.
 */
export interface BaseComponent {
  _classRef: any;

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
  FindChildrenIn    = '$lilith::api::link-parent::find',
  Subscriptions     = '$lilith::api::subscriptions',
  LinkParent        = '$lilith::api::link-parent',
  Component         = '$lilith::api::component',
  Service           = '$lilith::api::service'
}

/**
 * Represents the pending injections from all classes
 */
export interface PendingInjectDefinition {
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
 * Represents the definition of a referred object
 */
export interface ReferredObjectDefinition {
  /**
   * A number to show if this referred object should be initialized
   * first or list, like a priority tree
   */
  priority: number;

  /**
   * The type of this [[ReferredObjectDefintion]]
   */
  type: 'component' | 'service' | 'singleton';

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
 * Represents a definition of parent / children of a [[BaseComponent]] or [[BaseService]]
 */
export interface ChildrenDefinition {
  /**
   * The parent class that this [[ChildrenDefinition]] belongs to
   */
  parentCls: any;

  /**
   * The child class that this [[ChildrenDefinition]] belongs to
   */
  childCls: any;
}
