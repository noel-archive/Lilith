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

import { PendingInjectDefinition, MetadataKeys } from '../types';

/**
 * Decorator to inject a component, service, or singleton into
 */
export const Inject: PropertyDecorator = (target: any, prop) => {
  const $ref = Reflect.getMetadata('design:type', target, prop);
  if ($ref === undefined) throw new TypeError(`Inferred reference for property ${String(prop)} was not found`);

  const pending: PendingInjectDefinition[] = Reflect.getMetadata(MetadataKeys.PendingInjections, global) ?? [];
  pending.push({
    target,
    prop,
    $ref,
  });

  Reflect.defineMetadata(MetadataKeys.PendingInjections, pending, global);
};
