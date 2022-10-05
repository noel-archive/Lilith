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

import type { InjectionMeta } from '.';
import { MetadataKeys } from '../types';

/** Represents a type-alias of the injection metadata that is stored on the class. */
export type InjectInjectionMeta = InjectionMeta<{ $ref: any }>;

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
export const Inject: PropertyDecorator = (target, property) => {
  const $ref = Reflect.getMetadata('design:type', target, property);
  if (!$ref) throw new Error(`Unable to infer object instance in property ${String(property)}`);

  const injections: InjectInjectionMeta[] = Reflect.getMetadata(MetadataKeys.Injections, target) ?? [];
  injections.push({
    property,
    $ref
  });

  Reflect.defineMetadata(MetadataKeys.Injections, injections, target.constructor);
};
