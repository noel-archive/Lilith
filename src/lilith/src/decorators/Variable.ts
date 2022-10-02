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

/** Represents a type-alias of the variable injection metadata that is stored on the class. */
export type VariableInjectionMeta = InjectionMeta<{ key: string | symbol }>;

/**
 * The **Variable** decorator allows you to reference container variables in your services. It is also
 * available as a constructor or property injection, refer to the [[@Inject]] decorator documentation
 * on how to use it, but replace [[@Inject]] with [[@Variable]]
 *
 * @param key The key that is scoped to a variable in the container.
 */
export const Variable = (key: string | symbol): PropertyDecorator => {
  return (target, property) => {
    const variables: VariableInjectionMeta[] = Reflect.getMetadata(MetadataKeys.Variable, target) ?? [];

    variables.push({ property, key });
    Reflect.defineMetadata(MetadataKeys.Variable, variables, target);
  };
};
