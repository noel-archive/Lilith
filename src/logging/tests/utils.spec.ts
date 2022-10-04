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

import { formatMessages, getCallSites, prettifyError } from '../src/utils';
import { describe, expect, test } from 'vitest';
import { resolve } from 'path';

describe('@lilith/logging :: Utils', () => {
  // Vite reports the errors in the root project (outside src/logging), so we have to resolve it back
  // to the ACTUAL root directory.
  const resolved = process.cwd().endsWith('src/logging') ? resolve(process.cwd(), '../..') : process.cwd();

  test('Utils#prettifyError', () => {
    const error = new Error('we do the boops around here!');
    const prettified = prettifyError(error, true, 3, true);
    expect(prettified).toMatchInlineSnapshot(`
      "Error :: we do the boops around here!
         * [1m[2min[0m[0m [1m[2mchunk-runtime-chain.0ab05798.mjs[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/chunk-runtime-chain.0ab05798.mjs:2266:13[0m[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/chunk-runtime-chain.0ab05798.mjs:2141:26[0m[0m[0m
         * [1m[2min[0m[0m [1m[2mchunk-runtime-error.f5506f40.mjs[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:540:42[0m[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:635:15[0m[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:635:15[0m[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:767:5[0m[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:785:3[0m[0m[0m
         * [1m[2min[0m[0m [1m[2mentry.mjs[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/entry.mjs:83:9[0m[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:293:5[0m[0m[0m
           [2m~[0m [3m[1m[2m${resolved}/node_modules/vitest/dist/entry.mjs:76:5[0m[0m[0m
         * [1m[2min[0m[0m [1m[2mworker.js[0m[0m
           [2m~[0m [3m[1m[2mfile://${resolved}/node_modules/tinypool/dist/esm/worker.js:109:20[0m[0m[0m"
    `);

    const prettifiedAgain = prettifyError(error, false, 3, true);
    expect(prettifiedAgain).toMatchInlineSnapshot(`
      "Error :: we do the boops around here!
         * in chunk-runtime-chain.0ab05798.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-chain.0ab05798.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-chain.0ab05798.mjs
         * in chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
         * in entry.mjs
           ~ ${resolved}/node_modules/vitest/dist/entry.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/entry.mjs
         * in worker.js
           ~ file://${resolved}/node_modules/tinypool/dist/esm/worker.js"
    `);
  });

  test('Utils#getCallSites', () => {
    const error = new Error('beeps and the boops');
    const stack = getCallSites(error);

    expect(stack.length).toBe(11);
    expect(stack).toMatchInlineSnapshot(`
      [
        CallSite {},
        CallSite {},
        CallSite {},
        CallSite {},
        CallSite {},
        CallSite {},
        CallSite {},
        CallSite {},
        CallSite {},
        CallSite {},
        CallSite {},
      ]
    `);
  });

  test('Utils#formatMessages', () => {
    const messages: unknown[] = [
      'a string',
      new Error('we have been booped!!!!!'),
      1234,
      function () {
        /* do something */
      },
      {
        a: {
          deep: {
            object: true
          }
        }
      }
    ];

    const formatted = formatMessages(true, ...messages);
    expect(formatted).toMatchInlineSnapshot(`
      "a string
      Error :: we have been booped!!!!!
         * [1m[2min[0m[0m [1m[2mchunk-runtime-chain.0ab05798.mjs[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/chunk-runtime-chain.0ab05798.mjs:2266:13[0m[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/chunk-runtime-chain.0ab05798.mjs:2141:26[0m[0m[0m
         * [1m[2min[0m[0m [1m[2mchunk-runtime-error.f5506f40.mjs[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:540:42[0m[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:635:15[0m[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:635:15[0m[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:767:5[0m[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:785:3[0m[0m[0m
         * [1m[2min[0m[0m [1m[2mentry.mjs[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/entry.mjs:83:9[0m[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs:293:5[0m[0m[0m
           [2m~[0m [3m[1m[2m/mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/vitest/dist/entry.mjs:76:5[0m[0m[0m
         * [1m[2min[0m[0m [1m[2mworker.js[0m[0m
           [2m~[0m [3m[1m[2mfile:///mnt/storage/Projects/Noelware/Libraries/TypeScript/lilith/node_modules/tinypool/dist/esm/worker.js:109:20[0m[0m[0m
      1234
      [36m[Function (anonymous)][39m
      { a: { deep: { object: [33mtrue[39m } } }"
    `);

    const formattedAlso = formatMessages(false, ...messages);
    expect(formattedAlso).toMatchInlineSnapshot(`
      "a string
      Error :: we have been booped!!!!!
         * in chunk-runtime-chain.0ab05798.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-chain.0ab05798.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-chain.0ab05798.mjs
         * in chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
         * in entry.mjs
           ~ ${resolved}/node_modules/vitest/dist/entry.mjs
           ~ ${resolved}/node_modules/vitest/dist/chunk-runtime-error.f5506f40.mjs
           ~ ${resolved}/node_modules/vitest/dist/entry.mjs
         * in worker.js
           ~ file://${resolved}/node_modules/tinypool/dist/esm/worker.js
      1234
      [Function (anonymous)]
      { a: { deep: { object: true } } }"
    `);
  });
});
