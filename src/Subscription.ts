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

import type { EventEmitterLike } from './api/SharedAPI';

interface SubscriptionInfo {
  listener(...args: any[]): any;

  thisCtx: any;
  emitter: EventEmitterLike;
  once: boolean;
  name: string;
}

/**
 * Represents a subscription that is handled by the component or service.
 */
export class Subscription {
  /**
   * If this subscription is ran once and unsubscribed after
   */
  public once: boolean;

  /**
   * The name of the subscription (which is the event name)
   */
  public name: string;

  #subscribedListener: any;
  #listener: (...args: any[]) => void;
  #emitter: EventEmitterLike;

  constructor({
    listener,
    emitter,
    thisCtx,
    name,
    once
  }: SubscriptionInfo) {
    this.#subscribedListener = (...args: any[]) => this.#listener.call(thisCtx, ...args);
    this.#listener = listener;
    this.#emitter = emitter;
    this.once = once;
    this.name = name;
  }

  /**
   * Subscribes to the emitter
   */
  subscribe() {
    this.#emitter[this.once ? 'once' : 'on'](this.name, this.#subscribedListener);
  }

  /**
   * Disposes the subscription
   */
  dispose() {
    this.#emitter.removeListener(this.name, this.#subscribedListener);
  }
}
