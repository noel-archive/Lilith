# Lilith

> 🧵 **Simple application framework made in TypeScript (made for personal usage)**

## Usage

```ts
import { Container } from '@augu/lilith';

const container = new Container({
  componentsDir: __dirname,
  servicesDir: __dirname,
});

container.load().then(() => console.log('ready'));
```

> Components

```ts
import { Component } from '@augu/lilith';

@Component({
  priority: 0,
  name: 'component',
})
export default class Component {
  load() {
    console.log('lifecycle hook that this component is first being initialized.');
  }

  dispose() {
    console.log('lifecycle hook that this component is being unloaded.');
    console.log(
      "You also have access to the Component's API! You can use the `useApi(<name>)` hook to get the API between a component or service if you're not in the component itself."
    );
  }
}
```

## License

**Lilith** is released under [MIT](/LICENSE) License! 💖
