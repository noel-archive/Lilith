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

import { isInjectable } from './NotInjectable';
import { MetadataKeys } from '../internal/MetadataKeys';

// represents a injectable reference
interface InjectReference {
  // the property key that should be injected
  property: string;

  // the reference class itself
  ref: any;
}

export const getInjectables = (target: any) =>
  Reflect.getMetadata<InjectReference[]>(MetadataKeys.Injections, target) ?? [];

/**
 * Inject a reference to a property and return it. If the referenced
 * class is marked a non injectable (used with the `@NonInjectable()` decorator),
 * then it'll error out.
 */
const _Inject: PropertyDecorator = (target: any, prop) => {
  const $ref = Reflect.getMetadata('design:type', target, prop);
  if ($ref === undefined)
    throw new TypeError(`Inferred reference for "${target.name ?? '<unknown>'}#${String(prop)}" was not found.`);

  if (!isInjectable($ref))
    throw new TypeError('Reference was marked as a non injectable.');

  const injections = Reflect.getMetadata<InjectReference[]>(MetadataKeys.Injections, target) ?? [];
  injections.push({
    property: String(prop),
    ref: $ref
  });

  Reflect.defineMetadata(MetadataKeys.Injections, injections, target);
};

export default _Inject;
