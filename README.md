# @augu/lillith
> :thread: **Simple application framework made in TypeScript (made for personal usage)**

## Usage
```ts
import { Application } from '@augu/lillith';

const app = new Application();
app.findComponentsIn(__dirname); // find components
app.findSingletonsIn(__dirname); // find singletons
app.findServicesIn(__dirname);   // find services

app.verify(); // Verify all components, singletons, and services and implements them
// => Lillith.ApplicationState
```

## License
**Lillith** is released under [MIT](/LICENSE) License! :sparkling_heart:
