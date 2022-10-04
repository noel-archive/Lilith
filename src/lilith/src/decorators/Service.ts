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

import { Load, MetadataKeys } from '../types';

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
export const Service = ({ children, name, priority }: ServiceDecoratorDeclaration): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(MetadataKeys.Service, { priority, children, name }, target);
  };
};
