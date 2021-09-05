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

const {
  existsSync,
  promises: { mkdir },
} = require('fs');

const { join } = require('path');
const esbuild = require('esbuild');
const leeks = require('leeks.js');

const logger = {
  error: (...messages) => console.error(leeks.hex('', '!'), ...messages),
  info: (...messages) => console.log(leeks.hex('', '+'), ...messages),
  warn: (...messages) => console.log(leeks.hex('', '?'), ...messages),
};

const main = async () => {
  logger.info(`Building ${leeks.colors.gray('@augu/lilith')} in production mode.`);
  const DIST_PATH = join(process.cwd(), 'dist');

  if (DIST_PATH !== null && !existsSync(DIST_PATH)) await mkdir(DIST_PATH);
  logger.info('Compiling TypeScript with `esbuild`...');

  await esbuild.build({
    bundle: true,
    entryPoints: [join(process.cwd(), 'src', 'index.ts')],
    outfile: join(process.cwd(), 'dist', 'lilith.cjs'),
    format: 'cjs',
    platform: 'node',
    target: 'node14',
  });

  logger.info('Built successfully without any errors, I hope :3');

  return 0;
};

main()
  .then((code) => process.exit(code))
  .catch((ex) => {
    logger.error(ex);
    process.exit(1);
  });
