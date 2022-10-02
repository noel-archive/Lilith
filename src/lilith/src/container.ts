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

import { type Ctor, EventBus, hasOwnProperty, isObject, Lazy, readdir, isBrowser, readdirSync } from '@noelware/utils';
import { ContainerEvents, LifecycleEvents, Load, MetadataKeys, Service, Singleton } from './types';
import type { InjectInjectionMeta, ServiceDecoratorDeclaration, VariableInjectionMeta } from './decorators';
import { isService, isSingleton, singleton } from './functions';
import type { Constructor } from 'type-fest';
import { lstatSync } from 'fs';
import { lstat } from 'fs/promises';
import { randomBytes } from './crypto-utils';
import { isPromise } from 'util/types';

// this is only for #addService so it doesn't recurse. The max depth is 3 at the moment.
let NUMBER_OF_NESTED_CHILDREN = 0;

export interface ContainerOptions<Variables extends {} = {}> {
  singletons?: (Load<Singleton> | (() => any))[];
  variables?: Variables;
  services?: Load<Service>[];
}

export class Container<Variables extends {} = {}> extends EventBus<ContainerEvents> {
  private static readonly _instance: Container;

  #references: Map<any, string> = new Map();
  #singletons: Singleton<any>[] = [];
  #variables: Map<string, unknown> = new Map();
  #services: Map<string, Service> = new Map();
  #options: ContainerOptions<Variables>;

  constructor(options: ContainerOptions<Variables> = { services: [], singletons: [], variables: {} as any }) {
    super();

    this.#options = options;

    if (Container._instance)
      throw new Error('Only one container instance can be constructed. Use the #destory method to release.');

    // @ts-ignore i know!!!!!
    Container._instance = this;
  }

  #debug(message: string) {
    this.emit('debug', message);
  }

  async #loadFromFiles(path: string, callback: (file: string, now: number) => Promise<void>) {
    // Check if we are in a browser environment. If so, { path: string }
    // should not be supported.
    if (isBrowser)
      throw new Error(`Using a object containing path [${path}] is not supported in a browser environment.`);

    let now = Date.now();
    this.#debug(`Loading files from path ${path}!`);

    const stat = await lstat(path);
    if (!stat.isDirectory()) throw new Error(`Path [${path}] was not a directory.`);

    const files = await readdir(path, { exclude: ['.js.map'] });
    this.#debug(`Found ${files.length} files in ${Date.now() - now}ms!`);

    for (const file of files) {
      await callback(file, now);
      now = Date.now();
    }
  }

  /**
   * Returns the container instance, if it was ever initialized. Returns `undefined`
   * if the container was never constructed.
   */
  static get instance(): Container | undefined {
    return Container._instance;
  }

  // used for testing (for now)
  private get singletons() {
    return this.#singletons;
  }

  /**
   * Starts the container and does the proper initialization for all Lilith objects.
   */
  async start() {
    this.#debug("( ★ ≧ ▽ ^)) ★ ☆ Let's get started!");

    // Load singletons first
    for (const thisImport of this.#options.singletons ?? []) {
      if (isObject(thisImport)) {
        // Check if it is a singleton (from the `singleton` function)
        if (isSingleton(thisImport)) {
          this.#debug(`Found singleton object ${thisImport.name}, registering!`);
          this.addSingleton(thisImport);

          continue;
        }

        if (hasOwnProperty<any>(thisImport, 'path')) {
          await this.#loadFromFiles((thisImport as any).path, async (file, now) => {
            const singletonImport: Ctor<any> = await import(file);
            if (!singletonImport.default) throw new Error(`Object in file ${file} didn't export a default instance.`);
            if (!isObject(singletonImport.default)) throw new Error(`Default export must be a object.`);

            const singleton_ = singleton({
              onDestroy: hasOwnProperty<any>(singletonImport, 'teardown')
                ? ((singletonImport as any).teardown as any)
                : undefined,

              provide() {
                return singletonImport.default as any;
              }
            });

            this.addSingleton(singleton_);
            this.#debug(`Registered singleton ${singleton_.name} in ${Date.now() - now}ms!`);
          });

          continue;
        }

        this.addSingleton(() => thisImport);
      }

      if (typeof thisImport === 'function') {
        this.addSingleton(() => {
          const $ref = new (thisImport as Constructor<any>)();
          const variables: VariableInjectionMeta[] = Reflect.getMetadata(MetadataKeys.Variable, thisImport) ?? [];
          this.#debug(`found ${variables.length} variables to inject into singleton ${thisImport.name}`);
          for (const { property, key } of variables) {
            this.#debug(`Injecting variable property ${$ref.name}#${String(property)} from variable ${String(key)}`);
            const reference = this.variable(String(key) as keyof Variables);
            if (reference === null) {
              this.#debug(`Variable ${String(key)} was not found, skipping!`);
              continue;
            }

            Object.defineProperty(thisImport, property, {
              get() {
                return reference;
              },

              set() {
                throw new SyntaxError(`Cannot mutate reference property [${String(property)}]`);
              },

              enumerable: true,
              configurable: true
            });
          }

          const injections: InjectInjectionMeta[] = Reflect.getMetadata(MetadataKeys.Injections, thisImport) ?? [];
          this.#debug(`found ${injections.length} injections for singleton ${thisImport.name}!`);
          for (const inject of injections) {
            this.#debug(`Injecting property ${$ref.name}#${String(inject.property)} of instance ${inject.$ref.name}`);
            const reference = this.inject(inject.$ref);
            if (reference === null) {
              this.#debug(`Reference ${inject.$ref.name} was not found, skipping!`);
              continue;
            }

            Object.defineProperty(thisImport, inject.property, {
              get() {
                return reference;
              },

              set() {
                throw new SyntaxError(`Cannot mutate reference property [${String(inject.property)}]`);
              },

              enumerable: true,
              configurable: true
            });
          }

          return $ref;
        });
      } else {
        throw new Error('Singleton must be a function or a object.');
      }
    }

    for (const thisImport of this.#options.services ?? []) {
      if (isObject(thisImport)) {
        if (isService(thisImport)) {
          this.#debug(`Found existing service [${thisImport.name}], registering...`);
          this.addService(thisImport);

          continue;
        }

        if (hasOwnProperty<any>(thisImport, 'path')) {
          await this.#loadFromFiles((thisImport as any).path, async (file, now) => {
            const serviceImport: Ctor<any> = await import(file);
            if (!serviceImport.default) throw new Error(`Object in file ${file} didn't export a default class.`);

            // Services require the `@Service` attribute.
            const attr: ServiceDecoratorDeclaration | undefined = Reflect.getMetadata(
              MetadataKeys.Service,
              serviceImport.default!
            );

            if (!attr)
              throw new Error(
                `Class instance ${serviceImport.default} in path [${file}] doesn't use the @Service decorator.`
              );

            await this.addService({
              priority: attr.priority ?? 0,
              children: attr.children ?? [],
              $ref: serviceImport.default,
              type: 'service',
              name: attr.name
            });

            this.#debug(`Validated and registed service ${attr.name} in ${Date.now() - now}ms!`);
          });

          continue;
        }

        this.#debug(`Found instance ${thisImport.constructor.name}, now trying to load!`);

        // Services require the `@Service` attribute.
        const attr: ServiceDecoratorDeclaration | undefined = Reflect.getMetadata(
          MetadataKeys.Service,
          thisImport.constructor
        );

        if (!attr) throw new Error(`Object ${thisImport} doesn't use the @Service decorator.`);
        await this.addService({
          priority: attr.priority ?? 0,
          children: attr.children ?? [],
          $ref: thisImport,
          type: 'service',
          name: attr.name
        });

        continue;
      }

      let now = Date.now();
      if (typeof (thisImport as any) !== 'function')
        throw new Error(
          `Services must be a class constructor, received \`${
            typeof thisImport === 'object' ? 'array/null' : typeof thisImport
          }\``
        );

      const attr: ServiceDecoratorDeclaration | undefined = Reflect.getMetadata(MetadataKeys.Service, thisImport);
      if (!attr)
        throw new Error(`Class instance ${(thisImport as any).constructor.name} doesn't contain a @Service decorator!`);

      this.#debug(`Took ${Date.now() - now}ms to get service metadata`);
      await this.addService({
        priority: attr.priority ?? 0,
        children: attr.children ?? [],
        $ref: thisImport,
        type: 'service',
        name: attr.name
      });
    }

    this.#debug('We are all set! (ㅇㅅㅇ❀) (* ^ ω ^)');
  }

  destroy() {
    this.#debug('Destroying container...');

    for (const service of this.#services.values()) {
      this.emit('service:destroy', service);

      // Destroy the main service
      service.onDestroy?.();

      // Destroy children services
      for (const child of service.children) {
        this.emit('service:child:destroy', service, child);
        service.onChildDestroy?.call(service.$ref ?? service, child);
      }
    }

    // Clear it all.
    this.#services.clear();

    for (const singleton of this.#singletons.values()) {
      this.emit('singleton:destroy', singleton);
      singleton.onDestroy?.call(singleton, singleton.$ref.get());
    }

    // clear it all!
    this.#singletons = [];

    // clear all variables.
    this.#variables = {} as any;

    // Release the resources from this Container so other containers
    // can be created. This won't probably be needed, but it's here
    // for testing.
    // @ts-expect-error
    Container._instance = undefined;
  }

  /**
   * Inject a service or singleton based off the constructor that it was
   * injected from.
   *
   * @param ctor The constructor.
   * @return The singleton or service, or `null` if nothing was found.
   */
  inject<T>(ctor: Constructor<T>): T | null;

  /**
   * Inject a variable based off the variable name.
   * @param key The name of the variable.
   * @return The variable, or `null` if none was found.
   */
  inject<K extends keyof Variables>(key: K): Variables[K] | null;

  /**
   * Inject a service based off the name.
   * @param name The name of the service.
   * @return The service, or `null` if nothing was found.
   */
  inject<T>(name: string): T | null;
  inject(value: any) {
    if (typeof value === 'string') {
      if (this.#services.has(value)) {
        const service = this.#services.get(value)!;
        if (!service.$ref) {
          delete service.$ref;
          return service;
        }

        return service.$ref;
      }

      if (this.#variables.has(value)) return this.#variables.get(value);
      return null;
    }

    const singleton = this.#singletons.find((i) => {
      const $ref = i.$ref.get();
      if ($ref === value) return $ref;

      return $ref.constructor === value ? $ref : undefined;
    });

    if (singleton !== undefined) return singleton.$ref.get();
    const $ref = this.#references.get(value) ?? null;
    return $ref === null ? null : this.#services.get($ref)!.$ref;
  }

  /**
   * Adds a singleton to the container.
   * @param singleton The singleton object.
   */
  addSingleton<T extends {}>(singleton: Singleton<T>): void;

  /**
   * Adds a singleton based off the {@link Singleton} object.
   * @param singleton The singleton object.
   */
  addSingleton<T extends {}>(singleton: Omit<Singleton<T>, '$ref' | 'type' | 'name'> & { provide: () => T }): void;

  /**
   * Adds a singleton at runtime. The function that is used as the parameter is lazily evaluated.
   * @param value The lazily evaluated value that is used to act as a singleton.
   */
  addSingleton<T extends {}>(value: () => T): void;
  addSingleton(value: any) {
    if (isSingleton(value)) return void this.#singletons.push(value);
    if (hasOwnProperty(value as any, 'provide')) {
      const name = randomBytes(4);
      const singleton: Singleton<any> = {
        ...value,

        name,
        type: 'singleton',
        $ref: new Lazy(() => {
          const $val = (value as any).provide();
          if (!isObject($val))
            throw new Error(
              `Value ${$val} is not a object, received \`${typeof $val === 'object' ? 'array or null' : typeof $val}\``
            );

          (value as LifecycleEvents<[any]>).onLoad?.($val);
          return $val;
        })
      };

      this.#singletons.push(singleton);
      this.#references.set(singleton, name);

      return;
    }

    if (typeof value !== 'function') throw new TypeError(`Expected function, but received \`${typeof value}\``);
    const singleton_ = singleton(() => {
      const $val = value();
      if (!isObject($val))
        throw new Error(
          `Value ${$val} is not a object, received \`${typeof $val === 'object' ? 'array or null' : typeof $val}\``
        );

      return $val;
    });

    this.#references.set(singleton_, singleton_.name);
    this.#singletons.push(singleton_);
  }

  /**
   * Adds a service to this {@link Container}, and attach all the IoC hooks to the service.
   * @param service The service to add
   */
  async addService(service: Service) {
    if (this.#services.has(service.name)) throw new TypeError(`Service with name ${service.name} exists`);
    this.#debug(`Now registering service ${service.name}`);

    // $ref now should only be a class definition, if any.
    if (service.$ref !== undefined) {
      if (typeof service.$ref === 'function') {
        this.#debug(`Found class ${service.$ref.name}! Now creating instance...`);
        const oldRef = service.$ref;
        const $ref = new service.$ref();
        for (const event of ['onLoad', 'onDestroy', 'onChildLoad', 'onChildDestroy']) {
          this.#debug(`trying to bind event ${event} to service ${$ref.constructor.name}!`);
          service[event] =
            $ref[event] !== undefined && typeof $ref[event] === 'function' ? $ref[event].bind($ref) : service[event];
        }

        const variables: VariableInjectionMeta[] = Reflect.getMetadata(MetadataKeys.Variable, oldRef) ?? [];
        this.#debug(`found ${variables.length} variables to inject into service ${$ref.constructor.name}`);
        for (const { property, key } of variables) {
          this.#debug(`Injecting variable property ${$ref.name}#${String(property)} from variable ${String(key)}`);
          const reference = this.variable(String(key) as keyof Variables);
          if (reference === null) {
            this.#debug(`Variable ${String(key)} was not found, skipping!`);
            continue;
          }

          Object.defineProperty($ref, property, {
            get() {
              return reference;
            },

            set() {
              throw new SyntaxError(`Cannot mutate reference property [${String(property)}]`);
            },

            enumerable: true,
            configurable: true
          });
        }

        // Load in all the injections, because onLoad might call the injectable
        // properties!
        const injections: InjectInjectionMeta[] = Reflect.getMetadata(MetadataKeys.Injections, oldRef) ?? [];
        this.#debug(`found ${injections.length} injections from service ${service.name} (${$ref.constructor.name})`);
        for (const inject of injections) {
          this.#debug(
            `Injecting property ${service.$ref.name}#${String(inject.property)} with instance of ${inject.$ref.name}`
          );

          const reference = this.inject(inject.$ref as Ctor<any>);
          if (reference === null) {
            this.#debug(`Reference ${inject.$ref.name} was not found, skipping!`);
            continue;
          }

          Object.defineProperty($ref, inject.property, {
            get() {
              return reference;
            },

            set() {
              throw new SyntaxError(`Cannot mutate reference property [${String(inject.property)}]`);
            },

            enumerable: true,
            configurable: true
          });
        }

        // switch out to instance instead to call onLoad!
        service.$ref = $ref;
      } else {
        for (const event of ['onLoad', 'onDestroy', 'onChildLoad', 'onChildDestroy']) {
          this.#debug(`trying to bind event ${event} to service ${service.$ref.constructor.name}!`);
          service[event] =
            service.$ref[event] !== undefined && typeof service.$ref[event] === 'function'
              ? service.$ref[event]
              : service[event];
        }
      }
    }

    this.emit('service:register', service);

    // call the onLoad method.
    this.#debug('Now loading the service via #onLoad()');
    await service.onLoad?.call(service.$ref);

    this.#services.set(service.name, service);
    this.#references.set(service.$ref.constructor, service.name);

    // Load all the children instances. Children that are added with #addService
    // will be Load<?> instances, or it should be. I don't know!
    this.#debug(`Initializing ${service.children.length} children!`);
  }

  /**
   * Gets a variable from this {@link Container} instance. This is the recommended way
   * to get variables than {@link Container.inject} since this is more type-safe and
   * fast way.
   *
   * @param key The variable's name.
   * @return The variable, or `null` if no variable was found.
   */
  variable<K extends keyof Variables>(key: K): Variables[K] | null;
  variable(key: string) {
    return this.#variables.get(key) || null;
  }

  /**
   * Adds a variable at runtime.
   * @param key The variable name
   * @param value The variable value
   */
  addVariable<K extends keyof Variables>(key: K, value: Variables[K]) {
    this.#variables.set(key as string, value);
  }
}
