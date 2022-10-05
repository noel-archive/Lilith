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
import { createLilith, Inject, Service, useContainer } from '@lilith/core';
import type { Logger } from '../src/logger';
import { LogService } from '../src/service';
import ConsoleBackend from './__fixtures__/console.backend';
import { Log } from '../src/decorators/Log';

@Service({ name: 'myservice' })
class MyGenericService {
  private logging!: LogService<ConsoleBackend>;
  private logger: Logger = null!;

  onLoad() {
    const container = useContainer();
    this.logging = container.inject<LogService<ConsoleBackend>>(LogService)!;

    this.logger = this.logging.loggerFactory.get('my', 'generic', 'service');
    this.logger.info('Hello, world!');
  }
}

// @Service({ name: 'myotherservice', priority: 5 })
// class MyOtherGenericService {
//   @Log() private readonly logger!: Logger;

//   onLoad() {
//     console.log(this.logger);
//     this.logger.info('Hello, world. Again!');
//   }
// }

describe('@lilith/logging :: LogService', () => {
  const container = createLilith({
    services: [
      MyGenericService,
      // MyOtherGenericService,
      new LogService({
        attachDebugToLogger: true,
        backend: new ConsoleBackend({} as never)
      })
    ]
  });

  // beforeAll(() => {
  //   container.on('debug', console.log);
  // });

  test('it should run correctly', async () => {
    await expect(container.start()).resolves.toBeUndefined();
  });
});
