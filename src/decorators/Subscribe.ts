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

import { MetadataKeys, PendingSubscription } from '..';

/**
 * Adds a subscription to this method with type-safety included
 * @param event The event name to use
 * @param emitter The event emitter to use
 * @param once If this subscription should be pushed to the callstack
 * and popped off after emittion.
 */
export function Subscribe<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T
>(event: K, emitter?: string, once?: boolean): MethodDecorator;

/**
 * Adds a subscription to this method without type-safety included
 * @param event The event name to use
 * @param emitter The event emitter to define
 * @param once If this subscription should be pushed to the callstack
 * and popped off after emittion.
 */
export function Subscribe(event: string, emitter?: string, once?: boolean): MethodDecorator;
export function Subscribe(event: string, emitterCls?: any, once: boolean = false): MethodDecorator {
  return (target, prop, descriptor: TypedPropertyDescriptor<any>) => {
    const subscriptions: PendingSubscription[] = Reflect.getMetadata(MetadataKeys.Subscription, target) ?? [];
    subscriptions.push({
      listener: descriptor.value!,
      emitterCls,
      event,
      once,

      target,
      prop
    });

    Reflect.defineMetadata(MetadataKeys.Subscription, subscriptions, target);
  };
}
