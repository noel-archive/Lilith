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
 * Represents a singleton.
 */
export default class Singleton<T> {
  #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  /**
   * Checks if a [value] is represented as a [Singleton[T]].
   * @param value The value to check for
   */
  static isSingletonLike(value: unknown): value is Singleton<any> {
    return (
      // arrays and `null` is considered a object in "typeof x"
      (typeof value === 'object' && !Array.isArray(value) && value !== null) &&

      // check if the prototype exists
      (typeof (value as any).__proto__ !== 'undefined') &&

      // check if the prototype has a name
      (typeof (value as any).__proto__.name !== 'undefined' || typeof (value as any).__proto__.name !== 'string') &&

      // check if the name is "Singleton"
      ((value as any).__proto__.name === 'Singleton') &&

      // check if the value is not null or undefined
      ((value as Singleton<any>).value !== undefined || (value as Singleton<any>).value !== null)
    );
  }
}
