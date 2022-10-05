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

import { colors, styles, supportsColour } from 'leeks.js';
import { hasOwnProperty } from '@noelware/utils';
import { basename } from 'path';
import { inspect } from 'util';

// I/O can be consuming a lot of cpu/memory, so this is caching the results.
//
// For now, it'll be a regular object but this might be changed to a LRU cache.
const cachedFileContents: Record<string, string> = {};

export const formatMessages = (showColors = supportsColour, ...messages: unknown[]) =>
  messages
    .map((message) => {
      if (message instanceof Date) return showColors ? styles.dim(message.toISOString()) : message.toISOString();
      if (message instanceof Error) return prettifyError(message, showColors, 3);
      if (!['function', 'object'].includes(typeof message)) return (message as any).toString();

      return inspect(message, { depth: 3, colors: showColors, showProxy: true });
    })
    .join('\n');

export const getCallSites = (error?: Error) => {
  const err = error ?? new Error();
  const _capture = Error.prepareStackTrace;

  Error.prepareStackTrace = (_, stack) => stack;
  const stack = (err.stack as any)?.slice(1) as unknown as NodeJS.CallSite[];

  Error.prepareStackTrace = _capture;
  return stack;
};

export const prettifyError = (
  error: Error,
  showColors = supportsColour,
  causeDepth = 3,
  showCode = !!process.env.NODE_ENV && process.env.NODE_ENV === 'development'
) => {
  const content = [`${error.name} :: ${error.message}`];
  const stack = getCallSites(error);
  const stackToFile: Record<string, boolean> = {};

  // Ignore node internals, might make them gray coloured.
  for (const s of stack.filter((s) => !s.getFileName()?.startsWith('node:'))) {
    const fileName = s.getFileName();
    if (hasOwnProperty(stackToFile, fileName ?? '<script>')) {
      content.push(
        `     ${showColors ? styles.dim('~') : '~'} ${
          showColors
            ? `${styles.italic(
                styles.bold(
                  styles.dim(`${fileName ?? '<script>'}:${s.getLineNumber() ?? -1}:${s.getColumnNumber() ?? -1}`)
                )
              )}`
            : fileName ?? '<script>'
        }`
      );
    } else {
      stackToFile[fileName ?? '<script>'] = true;
      content.push(
        `   * ${
          showColors
            ? `${styles.bold(styles.dim('in'))} ${styles.bold(
                styles.dim(fileName === null ? '<script>' : basename(fileName))
              )}`
            : `in ${fileName === null ? '<script>' : basename(fileName)}`
        }`
      );

      content.push(
        `     ${showColors ? styles.dim('~') : '~'} ${
          showColors
            ? `${styles.italic(
                styles.bold(
                  styles.dim(`${fileName ?? '<script>'}:${s.getLineNumber() ?? -1}:${s.getColumnNumber() ?? -1}`)
                )
              )}`
            : fileName ?? '<script>'
        }`
      );
    }

    let cause!: Error;
    let i = 0;
    while ((cause = error.cause as Error) !== undefined) {
      i++;
      if (i > causeDepth) break;

      const callsites = getCallSites(cause);
      content.push(`  -> caused by: ${cause.name} :: ${cause.message}`);
      for (const s of callsites.filter((s) => !s.getFileName()?.startsWith('node:'))) {
        const fileName = s.getFileName();
        const key = `cause:${i}:${fileName ?? '<script>'}`;

        if (hasOwnProperty(stackToFile, key)) {
          content.push(
            `     ${showColors ? styles.dim('~') : '~'} ${
              showColors
                ? `${styles.italic(
                    styles.bold(
                      styles.dim(`${fileName ?? '<script>'}:${s.getLineNumber() ?? -1}:${s.getColumnNumber() ?? -1}`)
                    )
                  )}`
                : fileName ?? '<script>'
            }`
          );
        } else {
          stackToFile[key] = true;
          content.push(
            `   * ${
              showColors
                ? `${styles.bold(styles.dim('in'))} ${styles.bold(
                    styles.dim(fileName === null ? '<script>' : basename(fileName))
                  )}`
                : `in ${fileName === null ? '<script>' : basename(fileName)}`
            }`
          );

          content.push(
            `     ${showColors ? styles.dim('~') : '~'} ${
              showColors
                ? `${styles.italic(
                    styles.bold(
                      styles.dim(`${fileName ?? '<script>'}:${s.getLineNumber() ?? -1}:${s.getColumnNumber() ?? -1}`)
                    )
                  )}`
                : fileName ?? '<script>'
            }`
          );
        }
      }
    }

    // const line = s.getLineNumber();
    // const column = s.getColumnNumber();
    // const file = s.getFileName();
    // if (showCode && line !== null && column !== null && file !== null) {
    //   if (canOpen(file)) {
    //     const contents = hasOwnProperty(cachedFileContents, file)
    //       ? cachedFileContents[file]
    //       : (cachedFileContents[file] = readFileSync(file, { encoding: 'utf-8' }));

    //     const lines = contents.split(/\r?\n/);
    //     const start = Math.max(line - 5, 0);
    //     const end = Math.min(column + 2, lines.length);
    //     const maxWidth = String(end).length;
    //     const embedded = lines
    //       .slice(start, end)
    //       .map((l, index) => {
    //         const idx = start + 1 + index;
    //         const gutter = ' ' + (' ' + idx).slice(-maxWidth) + ' | ';
    //         if (idx === line) {
    //           const spacing = showColors
    //             ? styles.dim(gutter.replace(/\d/g, '')) + l.slice(0, column - 1).replace(/[^\t]/g, '')
    //             : gutter.replace(/\d/g, '') + l.slice(0, column - 1).replace(/[^\t]/g, '');

    //           return showColors
    //             ? styles.dim(gutter) + lines[idx] + '\n ' + spacing + styles.bold(colors.red('^'))
    //             : gutter + lines[idx] + '\n ' + spacing + '^';
    //         }

    //         return showColors ? styles.dim(gutter) + lines[idx] : gutter + lines[idx];
    //       })
    //       .join('\n');

    //     content.push('\n', embedded);
    //   }
    // }
  }

  return content.join('\n');
};

// const canOpen = (path: string) => {
//   try {
//     return readFileSync(path, { encoding: 'utf-8' });
//   } catch (e) {
//     assertIsError(e);
//     if (e.message.includes('no such file or directory')) return null;

//     throw e;
//   }
// };
