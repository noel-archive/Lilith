#!/bin/bash

# 🧵 Lilith: Application framework for TypeScript to build robust, and simple services
# Copyright (c) 2021-2022 Noelware <team@noelware.org>
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "Missing NPM_TOKEN environment variable!"
  exit 1
fi

npm config set '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}"

LIBRARIES=(
  "core"
  "vite"
  "nextjs"
  "config"
  "fastify"
  "logging"
  "http"
)

for lib in "${LIBRARIES[@]}"; do
  echo "$ npm publish $(realpath ./dist/$lib) --access=public"
  npm publish $(realpath ./dist/$lib) --access=public
done
