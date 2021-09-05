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

import { ReferredObjectDefinition, MetadataKeys } from '../types';
import { isAbsolute } from 'path';

/**
 * Represents the options for using a Component
 */
export interface ComponentOptions {
  /**
   * List of children or an absolute path to load in children
   */
  children?: any[] | string;

  /**
   * The priority to load the component
   */
  priority: number;

  /**
   * The name of the component
   */
  name: string;
}

/**
 * Class decorator to mark the target class as a component
 */
export function Component({ name, priority, children }: ComponentOptions): ClassDecorator {
  return (target) => {
    if (children !== undefined) {
      if (typeof children === 'string' && !isAbsolute(children))
        throw new TypeError(`Path '${children}' was not an absolute path.`);

      if (!Array.isArray(children) && !(typeof children === 'string'))
        throw new TypeError('Component children should be an Array of injectables or an absolute path');
    }

    Reflect.defineMetadata(
      MetadataKeys.Component,
      <ReferredObjectDefinition>{
        priority,
        children,
        type: 'component',
        name,
      },
      target
    );
  };
}
