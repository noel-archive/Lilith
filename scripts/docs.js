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
  promises: { mkdir, writeFile },
} = require('fs');

const { version, devDependencies } = require('../package.json');
const { join, basename, dirname } = require('path');
const rimraf = require('rimraf');
const typedoc = require('typedoc');
const leeks = require('leeks.js');
const ts = require('typescript');

const logger = {
  error: (...messages) => console.error(leeks.hex('', '!'), ...messages),
  info: (...messages) => console.log(leeks.hex('', '+'), ...messages),
  warn: (...messages) => console.log(leeks.hex('', '?'), ...messages),
};

const main = async () => {
  logger.info(`Generating documentation for ${leeks.colors.gray('@augu/lilith')} v${version}`);
  logger.info(
    `Using Typedoc ${leeks.colors.green('v' + devDependencies.typedoc)} with TypeScript ${leeks.colors.green(
      'v' + ts.version
    )}`
  );

  const DOCS_PATH = join(process.cwd(), 'docs');
  if (existsSync(DOCS_PATH)) rimraf.sync(DOCS_PATH);

  await mkdir(DOCS_PATH);

  const app = new typedoc.Application();
  app.bootstrap({
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    entryPoints: ['src/index.ts'],
    tsconfig: join(process.cwd(), 'tsconfig.json'),
    pretty: true,
  });

  // I don't trust Typedoc to find the configuration file,
  // so this will do. This is taken from typedoc.
  // Source: https://github.com/TypeStrong/typedoc/blob/master/src/lib/utils/options/readers/tsconfig.ts#L46-L63
  let isFatal = false;
  const tsconfig = ts.getParsedCommandLineOfConfigFile(
    join(process.cwd(), 'tsconfig.json'),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic(error) {
        logger.error('Unable to recover config file:');
        console.error(error);

        isFatal = true;
      },
    }
  );

  if (!tsconfig || isFatal) throw new Error(`Unable to find tsconfig.json in ${app.options.getValue('tsconfig')}`);
  app.options.setCompilerOptions(tsconfig.fileNames, tsconfig.options, tsconfig.projectReferences);

  logger.info('Generating sources...');
  const reflection = app.convert();
  if (!reflection) throw new Error('Unable to return project reflection.');

  const out = join(DOCS_PATH, 'docs.json');
  const docs = [];
  logger.info(`Received ${reflection.children.length} children to traverse over.`);

  for (const c of reflection.children) {
    const block = traverseChildren(c);
    docs.push(block);
  }

  await writeFile(out, JSON.stringify(docs, null, '\t'));
  logger.info('Done :3');

  return 0;
};

main()
  .then((code) => process.exit(code))
  .catch((ex) => {
    logger.error('Unable to run `docs` script:');
    console.error(ex);

    process.exit(1);
  });

/**
 * Traverses children throughout typedoc declaration references.
 * @param {import('typedoc/dist/lib/models/reflections/declaration').DeclarationReflection} data The data to convert to a readable structure
 * @returns The block of data that the main documentation page can read.
 */
function traverseChildren(data) {
  const block = {
    name: data.name,
    kind: data.kindString,
    flags: {
      public: data.flags.hasFlag(typedoc.ReflectionFlag.Public),
    },
  };

  // If the child has a comment
  if (data.hasComment()) {
    const comment = {
      text: data.comment.text,
      tags: data.comment.tags.map((s) => ({
        paramName: s.paramName,
        text: s.text,
        tag: s.tagName,
      })),
    };

    if (data.comment.returns !== undefined) comment.returns = data.comment.returns;
    block.comment = comment;
  }

  if (data.getSignature !== undefined) {
    const getter = {
      name: data.getSignature.name,
      flags: {
        public: data.getSignature.flags.hasFlag(typedoc.ReflectionFlag.Public),
      },
      type: {},
    };

    if (data.getSignature.hasComment()) {
      const comment = {
        text: data.getSignature.comment.text ?? data.getSignature.comment.shortText,
        tags: data.getSignature.comment.tags.map((s) => ({
          paramName: s.paramName,
          text: s.text,
          tag: s.tagName,
        })),
      };

      if (data.getSignature.comment.returns !== undefined) comment.returns = data.getSignature.comment.returns;
      getter.comment = comment;
    }

    // TODO: type shit here
    block.getter = getter;
  }

  // i don't do set signatures, nor never will :sunglasses:

  if (data.kind === 'Constructor') {
    block.constructor = [];
  }

  // traverse the children if needed
  if (data.children !== undefined) {
    // Include a children array IF there is any children.
    block.children = [];
    for (const c of data.children) block.children.push(traverseChildren(c));
  }

  return block;
}

/*
      static: data.flags.hasFlag(typedoc.ReflectionFlag.Static),
      optional: data.flags.hasFlag(typedoc.ReflectionFlag.Optional),
      rest: data.flags.hasFlag(typedoc.ReflectionFlag.Rest),
      abstract: data.flags.hasFlag(typedoc.ReflectionFlag.Abstract),
      constant: data.flags.hasFlag(typedoc.ReflectionFlag.Const),
      let: data.flags.hasFlag(typedoc.ReflectionFlag.Let),
      readonly: data.flags.hasFlag(typedoc.ReflectionFlag.Readonly),
*/
