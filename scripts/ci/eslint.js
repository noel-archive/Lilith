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

const { info, warning, error } = require('@actions/core');
const { readdir } = require('@noelware/utils');
const { ESLint } = require('eslint');
const { join } = require('path');

const LIBRARIES = ['lilith', 'config', 'logging'];

const main = async () => {
  info('starting linter...');

  const eslint = new ESLint({
    useEslintrc: true
  });

  for (const library of LIBRARIES) {
    const srcDir = join(process.cwd(), 'src', library);
    info(`Linting in directory [${srcDir}]`);

    const results = await eslint.lintFiles(await readdir(join(srcDir, 'src'), { extensions: ['.ts', '.tsx'] }));
    for (const result of results) {
      for (const message of result.messages) {
        const fn = message.severity === 1 ? warning : error;
        fn(`${result.filePath}:${message.line}:${message.column} [${message.ruleId}] :: ${message.message}`, {
          file: result.filePath,
          endColumn: message.endColumn,
          endLine: message.endLine,
          startColumn: message.column,
          startLine: message.line,
          title: `[${message.ruleId}] ${message.message}`
        });
      }
    }
  }
};

main().catch((ex) => {
  console.error(ex);
  process.exit(0);
});
