# Lilith
> 🧵 **Simple application framework made in TypeScript (made for personal usage)**

## Usage
```ts
import { Container } from '@augu/lilith';

const container = new Container({
  componentsDir: __dirname,
  servicesDir: __dirname
});

container
  .load()
  .then(() => console.log('ready'));
```

## License
**Lilith** is released under [MIT](/LICENSE) License! 💖
