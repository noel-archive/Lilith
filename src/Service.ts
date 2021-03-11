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
 * Represents a service.
 */
export interface Service {
  /**
   * Called when `Application.dispose` is called, this ensures
   * anything that is disposable should be disposed.
   */
  dispose?(): void;

  /**
   * Called when `Application.verify` is called. Ensures
   * that the service is loaded.
   */
  load?(): void | Promise<void>;

  /**
   * The name of the service
   */
  name: string;
}

/**
 * Simple function to check if a [value] is a instanceof a Service.
 * @param value The value to check
 */
export function isServiceLike(value: unknown): value is Service {
  return (
    // arrays and `null` is considered a object in "typeof x"
    (typeof value === 'object' && !Array.isArray(value) && value !== null) &&

    // check if `name` is a string
    typeof (value as Service).name === 'string'
  );
}
