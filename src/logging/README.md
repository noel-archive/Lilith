# 🧵 @lilith/logging

**@lilith/config** is a service library that acts like a logging facade that is injectable to any service. Read more on the [root repository](https://github.com/Noelware/Lilith/blob/master/README.md) to know more.

## Available Backends

- [@lilith/logging-winston](../logging-winston)
<!-- - [@lilith/logging-pino](../logging-pino)
- [@lilith/logging-tslog](../logging-tslog) -->

## Implementing your own backend

This library exposes a **BaseBackend** abstract class, in which, you can use any logger with it. You will need to add it to the `backendClass` property in **LoggingServiceOptions**:

```ts
import { LogRecord, BaseBackend, LogService, Log, Logger, LoggerFactory } from '@lilith/logging';
import { Service, Inject, createLilith } from '@lilith/core';

class MyBackend extends BaseBackend<{}> {
  constructor(options: {} = {}) {
    // do stuff here
  }

  override write({ name, timestamp, message, extra }: LogRecord) {
    // write to the logger of your choice
  }
}

class MyService {
  // @Log is a custom decorator to create a logger by the logger factory
  // to give the name of `<project name>::MyService`
  @Log private readonly log!: Logger;

  // directly create a logger
  constructor() {
    this.log = LoggerFactory.get('name of logger');
  }

  onLoad() {
    log.info('Hello, world!');
  }
}

const container = createLilith({
  services: [
    MyService,
    new LogService({
      backend: {
        cls: MyBackend,
        opts: {
          /* options that the backend has! */
        }
      }
    })
  ]
});

container.start();
// You should get no logs if you copied this, but please use a backend!
```
