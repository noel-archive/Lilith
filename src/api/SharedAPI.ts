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

import { BaseComponent, BaseService, MetadataKeys, PendingSubscription } from '../types';
import type { Container } from '../Container';
import { Subscription } from '../Subscription';
import { isObject } from '@augu/utils';

export enum EntityType {
  Component = 'component',
  Service   = 'service'
}

export interface EventEmitterLike {
  removeListener(event: string, listener: (...args: any[]) => void): any;
  addListener(event: string, listener: (...args: any[]) => void): any;
  once(event: string, listener: (...args: any[]) => void): any;
  on(event: string, listener: (...args: any[]) => void): any;
}

function isEventEmitterLike(value: unknown): value is EventEmitterLike {
  return isObject<EventEmitterLike>(value) && (
    typeof value.addListener === 'function' ||
    typeof value.once === 'function' ||
    typeof value.on === 'function'
  );
}

/**
 * Represents an API for interacting with the container with a
 * simple API. You can inject references yourself, add subscriptions,
 * etc. Components will share the [[ComponentAPI]] and services will
 * share the [[ServiceAPI]], which extends this class.
 */
export class SharedAPI {
  private static _instance: SharedAPI;

  /**
   * The container instance for this [[SharedAPI]].
   */
  public container: Container;

  /**
   * Represents the entity itself
   */
  public entity!: BaseComponent | BaseService;

  /**
   * The shared API type
   */
  public type!: EntityType;

  constructor(container: Container) {
    this.container = container;

    if (!SharedAPI._instance)
      SharedAPI._instance = this;
  }

  /**
   * Returns a boolean value if this instance is [[ComponentAPI]].
   */
  static get isComponentAPI() {
    return this._instance.type === EntityType.Component;
  }

  /**
   * Returns a boolean if this instance is [[ServiceAPI]].
   */
  static get isServiceAPI() {
    return this._instance.type === EntityType.Service;
  }

  /**
   * Simplified method to retrieve the class reference of a component,
   * service, or singleton.
   *
   * > {{info}}
   * > This method is a proxy to [[Container.$ref]]
   * > {{/info}}
   *
   * @param ref The reference class to use
   */
  getReference<TReturn = any>(ref: any) {
    return this.container.$ref<TReturn>(ref);
  }

  /**
   * Return a component from the container's component tree.
   * @param name The name of the component
   * @throws {TypeError}: If the component couldn't be found.
   */
  getComponent(name: string) {
    if (!this.container.components.has(name))
      throw new TypeError(`Unable to find component with name ${name}.`);

    return this.container.components.get(name)!;
  }

  /**
   * Returns a service from the container's services tree.
   * @param name The name of the service
   * @throws {TypeError}: If the service couldn't be found.
   */
  getService(name: string) {
    if (!this.container.services.has(name))
      throw new TypeError(`Unable to find service with name ${name}.`);

    return this.container.services.get(name)!;
  }

  /**
   * Lazily adds a subscription to the component or service's subscription
   * tree. To forward multiple, use the [SharedAPI.forwardSubscriptions] function.
   *
   * @param emitter The event emitter to use.
   * @param name The name of the event to forward
   * @param listener The listener function to forward
   * @param thisCtx The `this` context to use for the listener function
   * @param once If this event should be emitted once and unsubscribed after it's called.
   */
  addSubscription<
    E extends EventEmitterLike,
    Events = {},
    K extends keyof Events = keyof Events
  >(emitter: E, name: K, listener: Events[K], thisCtx: any, once: boolean = false) {
    if (!isEventEmitterLike(emitter))
      throw new TypeError('EventEmitter passed didn\'t have the following functions: `addListener`, `on`, or `once`.');

    const subscription = new Subscription({
      listener: listener as any,
      emitter,
      thisCtx,
      name: name as string,
      once
    });

    this.entity.subscriptions.push(subscription);
    return subscription.subscribe();
  }

  /**
   * Lazily adds multiple subscriptions into this component or service tree.
   * To lazily forward once, use the [SharedAPI.addSubscription] function.
   *
   * @param emitter The event emitter to use.
   * @param childClass The child class to forward subscriptions to this component
   * or service tree.
   */
  forwardSubscriptions<E extends EventEmitterLike>(emitter: E, childClass: any) {
    if (!isEventEmitterLike(emitter))
      throw new TypeError('EventEmitter passed didn\'t have the following functions: `addListener`, `on`, or `once`.');

    const subscriptions: PendingSubscription[] = Reflect.getMetadata(MetadataKeys.Subscription, childClass) ?? [];
    const subs = subscriptions.map(sub => new Subscription({
      listener: sub.listener,
      thisCtx: childClass,
      emitter,
      name: sub.event,
      once: sub.once
    }));

    for (const sub of subs)
      sub.subscribe();

    this.entity.subscriptions = this.entity.subscriptions.concat(subs);
  }

  /**
   * Lazily add a single subscription with a pending subscription into this component
   * or service tree.
   *
   * @param emitter The emitter to use
   * @param sub The pending subscription to use
   */
  forwardSubscription<E extends EventEmitterLike>(emitter: E, subscription: PendingSubscription & { thisCtx: any; }) {
    if (!isEventEmitterLike(emitter))
      throw new TypeError('EventEmitter passed didn\'t have the following functions: `addListener`, `on`, or `once`.');

    const sub = new Subscription({
      listener: subscription.listener,
      emitter,
      thisCtx: subscription.thisCtx,
      name: subscription.event,
      once: subscription.once
    });

    this.entity.subscriptions.push(sub);
    return sub.subscribe();
  }
}
