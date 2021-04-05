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

import { MetadataKeys } from '../types';
import { isAbsolute } from 'path';

/**
 * Decorator to find all children in
 * @param path The absolute path to use
 */
export function FindChildrenIn(path: string): ClassDecorator {
  return (target) => {
    if (!isAbsolute(path))
      throw new TypeError(`Path ${path} was not a absolute path`);

    const hasPath = Reflect.getMetadata(MetadataKeys.FindChildrenIn, target);
    if (hasPath !== undefined)
      throw new TypeError(`Class already has a path set (${hasPath})`);

    Reflect.defineMetadata(MetadataKeys.FindChildrenIn, path, target);
  };
}
