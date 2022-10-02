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

import type { LilithObject, Service, Singleton, LifecycleEvents } from './types';
import { Lazy, isObject, hasOwnProperty } from '@noelware/utils';
import { randomBytes } from './crypto-utils';

/** Represents a type-alis signature to create a service from the {@link service} function. */
export type CreateServiceOptions = Omit<Service, 'type' | 'priority' | '$ref'> & { priority?: number };

/** Represents a interface for the {@link singleton} function. */
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
export function singleton<T extends {} = {}>(value: any): Singleton<T> {
  if (isObject(value)) {
    const name = randomBytes(4);

    return {
      onDestroy: hasOwnProperty<any>(value, 'onDestroy') ? (value as any).onDestroy : undefined,
      onLoad: hasOwnProperty<any>(value, 'onLoad') ? (value as any).onLoad : undefined,
      $ref: new Lazy((value as any).provide),
      type: 'singleton',
      name
    };
  }

  if (typeof value !== 'function')
    throw new TypeError(
      `Expecting \`function\`, received ${typeof value === 'object' ? 'array/object/null' : typeof value}`
    );

  const name = randomBytes(4);
  return {
    onDestroy: undefined,
    onLoad: undefined,
    $ref: new Lazy(value),
    type: 'singleton',
    name
  };
}

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
}: CreateServiceOptions): Service {
  return {
    onChildDestroy,
    onChildLoad,
    onDestroy,
    priority: priority ?? 0,
    children,
    onLoad,
    $ref: undefined,
    name,
    type: 'service'
  };
}

/**
 * Assertion function to check if the object represents is a {@link LilithObject} or not.
 * @param key The key to check, since all objects have a `'type'` property.
 * @param value The object itself.
 */
export function isLilithObject<O extends LilithObject>(key: O['type'], value: unknown): value is O {
  if (!isObject(value)) return false;
  if (!hasOwnProperty(value as LilithObject, 'type')) return false;

  return (value as LilithObject).type === key;
}

/**
 * Assertion function to check if the value represented is a {@link Singleton} object or not.
 * @param value The value that is represented as a {@link Singleton} object.
 */
export function isSingleton<T extends {} = {}>(value: unknown): value is Singleton<T> {
  return isLilithObject<Singleton<T>>('singleton', value);
}

/**
 * Assertion function to check if the value represented is a {@link Service} object or not.
 * @param value The value that is represented as a {@link Service} object.
 */
export function isService(value: unknown): value is Service {
  return (
    isLilithObject<Service>('service', value) && Array.isArray(value.children) && hasOwnProperty(value, 'priority')
  );
}
