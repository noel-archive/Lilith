# 🧵 Lilith

> _Application framework for TypeScript to build robust, and simple services_

**Lilith** is Noelware's framework to build JavaScript-based microservices with TypeScript! It is used to build robust applications with TypeScript with the tools you need to build it! Lilith comes with pre-built libraries that makes it easy to work with:

- `@lilith/logging` **~** Package to handle logging scenarios, combined with the `@lilith/config` package also!
- `@lilith/config` **~** Package to handle different configuration sources, that are easily injectable with the `@Variable` decorator.
<!-- - `@lilith/http` **~** Package for creating a minimal HTTP server with Lilith's functionality. It also includes Next.js, Nuxt.js, and Vite integration to combine your backend and frontend together. -->

## Usage

> **Warning** — Lilith v6 and above is not compatible with older versions of **Lilith**, so you will need to
> refractor your whole application that was built upon Lilith. You can read up on the [migration](#migrating-to-v6) section.

```sh
$ npm install @lilith/core
$ yarn add @lilith/core
$ pnpm install @lilith/core
```

```ts
import { createLilith, singleton, service, inject } from '@lilith/core';

const container = createLilith({
  singletons: [
    // Defines a path to load singletons from
    { path: './path/to/singletons' },
    singleton<Logger>({
      provide() { return Logger.create(); }
      onLoad(logger /*: Logger */) { /* ran once singleton is loaded into the container */ },
      onDestroy(logger /*: Logger */) { /* destroy singleton */ }
    })
  ],

  services: [
    // Defines a path to load services from
    { path: './path/to/services' },
    service({
      name: 'myservice',
      children: [/* list of children that this service has control over */],
      onLoad() { /* called for loading the service (i.e, start http server/load config) */ },
      onDestroy() { /* called for destroying the service (i.e, stopping http service) */ },
      onChildLoad(child /*: any */) { /* called for loading children into the service scope */ },
      onChildDestroy(child /*: any */) { /* called for destroying children into the service scope */ },
    })
  ]
});

const logger = inject('logger');
// => Logger

const service = inject('myservice');
// => Service
```

## Packages

### @lilith/core

**@lilith/core** is the main library that ties together with the new packages like **@lilith/logging**. You use **@lilith/core** to manage the lifecycle of the managed IoC container to do dependency injection out of the box.

**@lilith/core** doesn't need any peer dependencies, but you will need to have `reflect-metadata` loaded before using **@lilith/core** because it depends on it!

```sh
$ npm install @lilith/core
$ yarn add @lilith/core
$ pnpm install @lilith/core
```

```ts
import { Service, Inject, createLilith } from '@lilith/core';

@Service({ name: 'a name' })
class MyService {
  @Inject
  private readonly other!: OtherService;

  onLoad() {
    console.log('I have loaded!');
  }
}

@Service({ name: 'another name', priority: 10 })
class OtherService {
  private readonly lucky: number = 42;

  get luckyNumber() {
    return this.lucky;
  }
}

const container = createLilith({
  services: [MyService, OtherService]
});

container.start();
```

- **Lilith** will construct the container as a export of **Container**,
- When you call **start**, the IoC hooks will be attached to the services in this minimal example,
- Since services can be a higher priority, the services that have a high priority will be initialized first
  - You can't inject components that are even a higher priority in a high priority service since services are not
    lazily constructed (i.e, needed when it needs to be used). They're loaded automatically, only **singletons** are
    lazily loaded.
  - You can't have service names with the same name, you will get a `TypeError` thrown.

```
| ~~~~~~~~~~~~~~ |  /----> | another name |
| ioc container  | -             / \
| ~~~~~~~~~~~~~~ |  \----> |    a name    |
```

### @lilith/logging

**@lilith/logging** is a service package that lets you inject a `LoggerFactoryService` into your services and creates a **Logger** for using logging. This package requires a peer dependency on **winston**:

```sh
$ npm install @lilith/core @lilith/logging @lilith/logging-winston winston
$ yarn add @lilith/core @lilith/logging @lilith/logging-winston winston
$ pnpm install @lilith/core @lilith/logging @lilith/logging-winston winston
```

```ts
import { Service, Inject, createLilith } from '@lilith/core';
import { LogService, type Logger } from '@lilith/logging';
import { WinstonBackend } from '@lilith/logging-winston';
import winston from 'winston';

@Service({ name: 'my service name' })
class MyService {
  @Inject
  private readonly logging!: LogService<WinstonBackend>;
  private readonly logger!: Logger;

  onLoad() {
    this.logger = this.logging.loggerFactory.get('my', 'service', 'info');
    this.logger.info('I am loading stuff!');
  }
}

const container = createLilith({
  services: [
    new LogService({
      defaultLevel: 'debug',
      backend: new WinstonBackend({
        transports: [new winston.transports.Console()]
      })
    }),
    MyService
  ]
});

container.start();
```

### @lilith/config

**@lilith/config** is a service that gives you a way to simplify configuration files with a **Zod** schema. It has loaders for:

- YAML (requires `js-yaml`)
- JSON (no extra dependencies)
- TOML (requires `@ltd/j-toml`)
<!-- - HCL (requires `@noelware/hcl`) -->

**@lilith/config** has a peer dependency on **zod** if you wish to have schema validation. It is not required to have **zod** installed, it'll just ignore the configuration schema if provided.

```sh
$ npm install @lilith/core @lilith/config zod
$ yarn add @lilith/core @lilith/config zod
$ pnpm install @lilith/core @lilith/config zod
```

```ts
import { Service, Inject, createLilith } from '@lilith/core';
import { ConfigService, YamlLoader } from '@lilith/config';
import z from 'zod';

export interface Config {
  lol: boolean;
}

@Service({ name: 'my service' })
class MyService {
  @Inject
  private readonly config!: ConfigService<Config>;

  onLoad() {
    const shouldLol = this.config.get('lol');
    if (shouldLol) {
      console.log('lol!!!!');
    }
  }
}

const container = createLilith({
  services: [
    new ConfigService<Config>({
      schema: z
        .object({
          lol: z.boolean()
        })
        .strict(),

      loader: new YamlLoader()
    }),
    MyService
  ]
});

container.start();
const service = container.inject(MyService);
```

<!-- ### @lilith/http

**@lilith/http** is a service library that helps you build a HTTP server with HTTP frameworks like:

- Express (requires `express` peer dependency)
- fastify (requires `fastify` peer dependency)

Also has support for React frameworks, Vue support might come soon:

- Next.js **(React)** (requires `next` & `react` peer dependency)
- Vite (client-side) (requires `vite` peer dependency)

It also supports request body, query, and path parameter validation out of the box with **Zod**. Also, the HTTP service comes with OpenAPI support, it's under the `openapi: boolean` option in the **HttpService**'s constructor.

This example uses **fastify** as the backend HTTP library, and **zod** for simple validation.

```sh
$ npm install @lilith/core @lilith/http fastify zod
$ yarn add @lilith/core @lilith/http fastify zod
$ pnpm install @lilith/core @lilith/http fastify zod
```

```ts
import { Router, FastifyBackend, HttpService, Get, Post, OpenAPI, Request, Response } from '@lilith/http';
import { Service, Inject, createLilith } from '@lilith/core';
import z from 'zod';

@Service({ name: 'my service' })
class MyService {
  @Inject
  readonly http: HttpService;

  onLoad() {
    // Using `MyRouter` will register the dependency injections
    // in the constructor or class properties
    this.http.register(MyRouter);
  }
}

// router for handling routing
class MyRouter extends Router {
  constructor() {
    super('/');

    // method inline
    this.get<{ query: { key: string } }>({
      path: '/method',
      validation: {
        query: z.object({ key: z.string() }).strict()
      },
      openapi: {
        description: 'Returns a GET request for /',
        contentTypes: ['application/json'],
        responses: {
          200: '#/components/schemas/Main'
        }
      },
      async handle(req, res) {
        // req: Request<{ query: { key: string } }, res: Response
        res.status(200).send({
          hello: 'world',
          query: req.query
        });
      }
    });
  }

  // decorator way
  @Get({
    path: '/decorator',
    query: z
      .object({
        key: z.string()
      })
      .strict()
  })
  @OpenAPI({
    description: 'Returns a GET request for /',
    contentTypes: ['application/json'],
    responses: {
      200: '#/components/schemas/Main'
    }
  })
  async main(req: Request<{ query: { key: string } }>, res: Response) {
    res.status(200).send({
      hello: 'world',
      query: req.query
    });
  }
}

const container = createLilith({
  services: [
    new HttpService({
      openapi: true,
      host: '0.0.0.0',
      port: 12345,

      // if `logger` is set to true, it will find
      // the @lilith/logging service or disables it
      // if there is no @lilith/logging service. You can also
      // use the logger options in the `fastify` function.
      backend: new FastifyBackend({ logger: true }),
      routers: [
        // Find all the routes in `./path/to/routers`
        { path: './path/to/routers' }

        // This is commented out since it'll error since `MyService` already
        // added it via HttpService.
        //MyRouter
      ]
    }),
    MyService
  ]
});

// Starts the HTTP server.
container.start();
``` -->

## Contributing

Thanks for considering contributing to **Lilith**! Before you boop your heart out on your keyboard ✧ ─=≡Σ((( つ•̀ω•́)つ, we recommend you to do the following:

- Read the [Code of Conduct](./.github/CODE_OF_CONDUCT.md)
- Read the [Contributing Guide](./.github/CONTRIBUTING.md)

If you read both if you're a new time contributor, now you can do the following:

- [Fork me! ＊\*♡( ⁎ᵕᴗᵕ⁎ ）](https://github.com/Noelware/Lilith/fork)
- Clone your fork on your machine: `git clone https://github.com/your-username/Lilith`
- Create a new branch: `git checkout -b some-branch-name`
- BOOP THAT KEYBOARD!!!! ♡┉ˏ͛ (❛ 〰 ❛)ˊˎ┉♡
- Commit your changes onto your branch: `git commit -am "add features （｡>‿‿<｡ ）"`
- Push it to the fork you created: `git push -u origin some-branch-name`
- Submit a Pull Request and then cry! ｡･ﾟﾟ･(థ Д థ。)･ﾟﾟ･｡

## License

**Lilith** is released under the **MIT License** with love by Noelware. :3
