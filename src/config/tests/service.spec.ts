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

import { beforeAll, describe, expect, test } from 'vitest';
import { Container, createLilith } from '@lilith/core';
import { ConfigService } from '../src/service';
import { JsonLoader } from 'src/loaders';
import { join } from 'path';

interface Config {
  users: string[];
  boops: boolean;
}

describe('ConfigService (@lilith/config)', () => {
  let container!: Container<Config>;
  beforeAll(() => {
    container = createLilith<Config>({
      services: [
        // @ts-ignore
        new ConfigService({
          loader: new JsonLoader(),
          file: join(process.cwd(), 'tests', '__fixtures__', 'example.json')
        })
      ]
    });

    container.on('debug', console.log);
  });

  test('should load', async () => {
    await expect(container.start()).resolves.toBeUndefined();
  });

  test('should inject config service', () => {
    const service = container.inject<ConfigService<Config>>(ConfigService);
    expect(service).not.toBeNull();

    expect(service!.get('users')).toStrictEqual(['noel', 'ice']);
    expect(service!.get('boops')).toBeTruthy();
  });

  test('should lookup from variable table', () => {
    expect(container.variable('boops')).not.toBeNull();
    expect(container.variable('boops')).toBeTruthy();
    expect(container.variable('users')).toStrictEqual(['noel', 'ice']);
  });
});
