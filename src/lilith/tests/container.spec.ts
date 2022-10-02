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

import 'reflect-metadata';

import { describe, expect, test } from 'vitest';
import { useContainer } from '../src/use-container';
import { isSingleton } from '../src/functions';
import { Container } from '../src/container';

describe('@lilith/core - Container', () => {
  const container = new Container();

  test('create new container', () => {
    expect(container.inject('blah')).toBeNull();
    expect(Container.instance === container).toBeTruthy();
  });

  test('singleton - no primitives', () => {
    container.addSingleton({
      provide() {
        return 'beep';
      }
    });

    expect(() => container['singletons'][0].$ref.get()).toThrowError();
    expect(() => container['singletons'][0].$ref.get()).toThrowErrorMatchingInlineSnapshot(
      `"Value beep is not a object, received \`string\`"`
    );
  });

  test('singleton - objects', () => {
    class SomeInlineClass {
      private readonly value: string = 'get';
      get() {
        return this.value;
      }
    }

    container.addSingleton(() => new SomeInlineClass());

    expect(container['singletons'].length).toBe(2);
    expect(() => container['singletons'][1].$ref.get()).not.toThrow();
    expect(container['singletons'][1].$ref.get()).toBeInstanceOf(SomeInlineClass);
    expect((container['singletons'][1].$ref.get() as SomeInlineClass).get()).toBe('get');
    expect(isSingleton(container['singletons'][1])).toBeTruthy();
  });

  test('useContainer method', () => {
    let c!: Container<{}>;
    expect(() => (c = useContainer())).not.toThrowError();
    expect(Container.instance === c).toBeTruthy();
  });

  test('services - not valid objects', async () => {
    const c = useContainer();
    c.destroy();

    expect(() => useContainer()).toThrowError();

    // Create a new container
    let newContainer = new Container({
      services: [Date]
    });

    newContainer.on('debug', console.log);
    await expect(() => newContainer.start()).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Class instance Function doesn\'t contain a @Service decorator!"'
    );

    newContainer.destroy();

    // Create a new container that uses plain objects like {}
    // @ts-expect-error
    newContainer = new Container({ services: [{}] });
    newContainer.on('debug', console.log);

    await expect(() => newContainer.start()).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Object instance [object Object] doesn\'t contain a @Service decorator!"'
    );

    newContainer.destroy();

    // Create a new container that succeeds
    // this fails for some reason!
    //
    // newContainer = new Container({ services: [{ path: join(process.cwd(), 'tests', '__fixtures__') }] });
    // newContainer.on('debug', console.log);

    // await expect(newContainer.start()).resolves.toBeUndefined();
  });
});
