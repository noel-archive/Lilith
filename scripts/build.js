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

const { copyFile, readFile, writeFile } = require('fs/promises');
const LoggerFactory = require('./util/log');
const { colors } = require('leeks.js');
const { build } = require('tsup');
const { join } = require('path');

const log = LoggerFactory.get('build');
async function main() {
  const stackVersion = await readFile(join(process.cwd(), '.stack-version'), 'utf-8').then((f) =>
    f
      .split('\n')
      .filter((f) => f && !f.startsWith('#'))
      .at(0)
  );

  log.info(`Building for stack version v${stackVersion}!`);

  for (const library of ['lilith', 'config']) {
    log.info(`Building library distribution ${colors.gray(`@lilith/${library === 'lilith' ? 'core' : library}`)}...`);
    const now = Date.now();
    await build({
      sourcemap: true,
      treeshake: true,
      tsconfig: join(process.cwd(), 'src', library, 'tsconfig.json'),
      platform: 'node',
      target: 'node16',
      format: ['cjs', 'esm'],
      outDir: join(process.cwd(), 'src', library, 'dist'),
      minify: (process.env.NODE_ENV && process.env.NODE_ENV === 'production') || false,
      bundle: true,
      clean: true,
      entry: [join(process.cwd(), 'src', library, 'index.ts')],
      name: `@lilith/${library === 'lilith' ? 'core' : library}`,
      dts: false
    });

    await copyFile(
      join(process.cwd(), 'src', library, 'typings.d.ts'),
      join(process.cwd(), 'src', library, 'dist', 'index.d.ts')
    );

    let contents = await readFile(join(process.cwd(), 'src', library, 'dist', 'index.d.ts'), 'utf-8');
    contents = contents.replace('@lilith/{library}', `@lilith/${library === 'lilith' ? 'core' : library}`);

    // @ts-expect-error
    contents = contents.replace('{version}', stackVersion);

    await writeFile(join(process.cwd(), 'src', library, 'dist', 'index.d.ts'), contents);
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
