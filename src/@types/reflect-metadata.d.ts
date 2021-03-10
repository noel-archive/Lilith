// Stub typings for adding generics to Reflect.getMetadata

declare namespace Reflect {
  /**
   * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
   * @param metdataKey A key used to store and retrieve metadata.
   * @param target The target object on which the metadata is defined.
   * @returns The metadata value for the metadata key if found; otherwise, undefined.
   */
  export function getMetadata<Val>(metdataKey: any, target: Object): Val; // eslint-disable-line
}
