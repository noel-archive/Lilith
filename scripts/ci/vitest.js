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

const { info, error } = require('@actions/core');
const { colors } = require('leeks.js');
const { spawn } = require('child_process');
const { join } = require('path');

async function main() {
  // for (const project of ['lilith', 'config', 'fastify', 'http', 'logging', 'nextjs', 'vite']) {
  for (const project of ['lilith', 'config', 'logging']) {
    const proc = spawn('yarn', ['vitest', '--run', '--reporter=json'], { cwd: join(process.cwd(), 'src', project) });
    const chunks = [];
    let code = 0;

    proc.stdout.on('data', (chunk) => chunks.push(chunk));
    proc.stderr.on('data', (chunk) => console.error(chunk.toString()));

    // let vitest run, and wait for exit.
    await new Promise((resolve) => proc.on('exit', resolve));

    const buf = chunks[0];
    if (buf === undefined || buf === null) throw new Error('Missing vitest report!');

    const json = JSON.parse(buf.toString('utf-8').trim());
    info(
      [
        `Ran all tests with ${colors.gray('vitest')} in project ${colors.gray(
          `@lilith/${project === 'lilith' ? 'core' : project}`
        )}!`,
        `   - Total Test Suites: ${json.numTotalTestSuites}`,
        `   - Successful Tests:  ${json.numPassedTests}`,
        `   - Failed Tests:      ${json.numFailedTests}`,
        '',
        `It took ${Date.now() - json.startTime}ms to complete all tests!`,
        ''
      ].join('\n')
    );

    for (const result of json.testResults) {
      info(`Suite in path [${result.name}] has ${result.status} in ${result.endTime - result.startTime}ms.`);
      for (const assertion of result.assertionResults) {
        if (assertion.status === 'failed') {
          for (const message of assertion.failureMessages) {
            code = 1;

            error(`${assertion.title} in suite ${assertion.ancestorTitles[1]} :: FAILED [${message}]`, {
              file: result.name,
              startLine: assertion.location.line,
              startColumn: assertion.location.column
            });
          }
        } else {
          info(`✔️  ${assertion.title} :: PASSED`);
        }
      }
    }

    return code;
  }
} // (x/y)*100

main()
  .then(process.exit)
  .catch((ex) => {
    error(ex);
    process.exit(1);
  });
