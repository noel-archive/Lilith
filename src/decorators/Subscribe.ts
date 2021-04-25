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

import { SubscriptionDefinition, ReferredObjectDefinition, MetadataKeys } from '../types';
import { isObject } from '@augu/utils';

/**
 * Represents a object that is structured like a event emitter
 */
export interface EventEmitterLike {
  on(event: string, listener: (...args: any[]) => void): any;
  once(event: string, listener: (...args: any[]) => void): any;
  addListener: EventEmitterLike['on'];
}

export function isEventEmitterLike(value: unknown): value is EventEmitterLike {
  return isObject(value) && (
    typeof (value as EventEmitterLike).on === 'function' &&
    typeof (value as EventEmitterLike).once === 'function' &&
    typeof (value as EventEmitterLike).addListener === 'function'
  );
}

/**
 * Marks this method as a Subscription, a method to run from the target class
 * @param event The event to use
 * @param once If the method should be called with `.once` instead of `.on`
 */
export function Subscribe(event: string, once?: boolean): MethodDecorator;

/**
 * Marks this method as a Subscription, a method to run from it's [emitterCls] or the
 * property to infer of the event emitter.
 *
 * @param event The event name to use
 * @param once If the method should be using `.once` instead of `.on`
 * @param emitterCls The event emitter class, this can be omitted if
 * the superclass is an [[EventEmitterLike]] object or a string of the
 * property to use for the emitter class if the target class is a Component
 * or Service.
 */
export function Subscribe(event: string, once?: boolean, emitterCls?: any): MethodDecorator {
  if (emitterCls !== undefined) {
    return (target, _, descriptor: TypedPropertyDescriptor<any>) => {
      const component: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Component, target);
      const service: ReferredObjectDefinition | undefined = Reflect.getMetadata(MetadataKeys.Service, target);

      if (component !== undefined || service !== undefined) {
        if (typeof emitterCls !== 'string')
          throw new TypeError('Missing property name to find');

        const prop = target[emitterCls];
        if (typeof prop !== 'function')
          throw new TypeError(`Event emitter was not in property ${emitterCls}.`);

        if (!isEventEmitterLike(prop))
          throw new TypeError('Event emitter didn\'t match the criteria.');

        const subscriptions: SubscriptionDefinition[] = Reflect.getMetadata(MetadataKeys.Subscriptions, global) ?? [];
        subscriptions.push({
          emitterCls: prop,
          handler: descriptor.value!,
          isOnce: typeof once === 'boolean' && once === true,
          event
        });

        return Reflect.defineMetadata(MetadataKeys.Subscriptions, subscriptions, global);
      }

      if (typeof emitterCls !== 'function')
        throw new TypeError('Event emitter class wasn\'t a Function (which it should be!)');

      if (emitterCls.prototype === undefined || typeof emitterCls.prototype !== 'object')
        throw new TypeError('Event emitter class shouldn\'t be instances of that class or the prototype wasn\'t a object');

      if (!isEventEmitterLike(emitterCls.prototype))
        throw new TypeError('Event emitter didn\'t match the criteria.');

      const subscriptions: SubscriptionDefinition[] = Reflect.getMetadata(MetadataKeys.Subscriptions, global) ?? [];
      subscriptions.push({
        emitterCls,
        handler: descriptor.value!,
        isOnce: typeof once === 'boolean' && once === true,
        event
      });

      return Reflect.defineMetadata(MetadataKeys.Subscriptions, subscriptions, global);
    };
  } else {
    return (target, _, descriptor: TypedPropertyDescriptor<any>) => {
      if (!isEventEmitterLike(target))
        throw new TypeError('The target prototype must be a event emitter');

      const subscriptions: SubscriptionDefinition[] = Reflect.getMetadata(MetadataKeys.Subscriptions, global) ?? [];
      subscriptions.push({
        emitterCls: target,
        handler: descriptor.value!,
        isOnce: typeof once === 'boolean' && once === true,
        event
      });

      return Reflect.defineMetadata(MetadataKeys.Subscriptions, subscriptions, global);
    };
  }
}
