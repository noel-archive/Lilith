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

// @ts-check

const { copyFile, writeFile, mkdir, rm, readFile } = require('fs/promises');
const getStackVersion = require('./util/stack-version');
const { existsSync } = require('fs');
const LoggerFactory = require('./util/log');
const { colors } = require('leeks.js');
const { join } = require('path');
const { build } = require('tsup');

const LIBRARIES = ['lilith', 'config', 'logging', 'winston'];

const log = LoggerFactory.get('publish');
async function main() {
  log.info('Preparing for publishing!');

  const stackVersion = await getStackVersion();
  log.info(`Stack Version: v${stackVersion}`);

  if (existsSync(join(process.cwd(), 'dist'))) await rm(join(process.cwd(), 'dist'), { recursive: true, force: true });
  for (const library of LIBRARIES) {
    const dir = join(process.cwd(), 'dist', library === 'lilith' ? 'core' : library);
    await mkdir(dir, { recursive: true });

    log.info(`Building library distribution ${colors.gray(`@lilith/${library === 'lilith' ? 'core' : library}`)}...`);
    const now = Date.now();
    await build({
      sourcemap: true,
      treeshake: true,
      tsconfig: join(process.cwd(), 'src', library, 'tsconfig.json'),
      platform: 'node',
      target: 'node16',
      format: ['cjs', 'esm'],
      outDir: join(dir, 'dist'),
      minify: true,
      bundle: true,
      clean: true,
      entry: [join(process.cwd(), 'src', library, 'index.ts')],
      name: `@lilith/${library === 'lilith' ? 'core' : library}`,
      dts: false
    });

    await copyFile(join(process.cwd(), 'LICENSE'), join(dir, 'LICENSE'));
    await copyFile(join(process.cwd(), 'src', library, 'README.md'), join(dir, 'README.md'));
    await copyFile(join(process.cwd(), 'src', library, 'package.json'), join(dir, 'package.json'));
    await copyFile(join(process.cwd(), 'src', library, 'typings.d.ts'), join(dir, 'dist', 'index.d.ts'));

    const pkgContents = await readFile(join(dir, 'package.json'), 'utf-8');
    // @ts-ignore
    const newPkgContents = pkgContents.replace('0.0.0-dev.0', stackVersion);
    await writeFile(join(dir, 'package.json'), newPkgContents);

    log.success(
      `Took ${colors.gray(`${Date.now() - now}ms`)} to build distribution for library ${colors.gray(
        `@lilith/${library === 'lilith' ? 'core' : library}`
      )}!`
    );
  }
}

main().catch((ex) => {
  log.error(ex);
  process.exit(1);
});
