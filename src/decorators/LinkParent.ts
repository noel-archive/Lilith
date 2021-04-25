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

import { ChildrenDefinition, MetadataKeys } from '../types';

/**
 * Links a parent component or service to this class
 * @param cls The parent component or service
 * @deprecated This decorator is deprecated and will be removed in a future release.
 * Fill in the `children` property in the `@Component` or `@Service` decorator.
 */
export function LinkParent(cls: any): ClassDecorator {
  return (target) => {
    const parentToChildDefs: ChildrenDefinition[] = Reflect.getMetadata(MetadataKeys.LinkParent, global) ?? [];
    parentToChildDefs.push({
      parentCls: cls,
      childCls: target
    });

    Reflect.defineMetadata(MetadataKeys.LinkParent, parentToChildDefs, global);
  };
}
