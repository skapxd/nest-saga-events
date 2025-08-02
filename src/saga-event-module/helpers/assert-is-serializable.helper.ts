// src/saga-event-module/helpers/assert-is-serializable.helper.ts

/**
 * Recursively traverses an object to find values that are not serializable to JSON.
 * This checks for types that JSON.stringify handles poorly or not at all.
 * @param obj The object to check.
 * @param path The current path for building meaningful error messages.
 * @param seen A WeakSet to detect circular references.
 */
function deepCheck(obj: any, path: string, seen: WeakSet<object>): void {
  if (obj === null || typeof obj !== 'object') {
    return; // Primitives are generally safe
  }

  // 1. Check for circular references
  if (seen.has(obj)) {
    throw new TypeError(`Circular reference found at path: '${path}'`);
  }
  seen.add(obj);

  // 2. Check for specific object types that are problematic
  if (obj instanceof Buffer) {
    throw new TypeError(
      `Raw Buffer found at path: '${path}'. Please use a DTO with Base64 transformation.`,
    );
  }
  if (obj instanceof Map || obj instanceof Set) {
    throw new TypeError(
      `'${obj.constructor.name}' found at path: '${path}', which is not safely serializable without a DTO.`,
    );
  }

  // 3. Recurse into array elements or object properties
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newPath = Array.isArray(obj) ? `${path}[${key}]` : `${path}.${key}`;

      // 4. Check for non-serializable primitive types
      if (typeof value === 'function' || typeof value === 'symbol') {
        throw new TypeError(
          `Non-serializable type '${typeof value}' found at path: '${newPath}'.`,
        );
      }

      // 5. Continue traversal
      if (typeof value === 'object' && value !== null) {
        deepCheck(value, newPath, seen);
      }
    }
  }
}

/**
 * Asserts that the given data is safely serializable to JSON by performing a deep check.
 * Throws a TypeError if the data contains non-serializable values.
 *
 * @param data The data to check.
 * @param context A string providing context for error messages (e.g., 'ClassName.methodName').
 */
export function assertIsSerializable(data: any, context: string): void {
  try {
    // Perform the deep traversal first, starting the path at 'data'
    deepCheck(data, 'data', new WeakSet());

    // As a final check for types not covered by our deep check (e.g., BigInt),
    // we still call JSON.stringify.
    JSON.stringify(data);
  } catch (error) {
    throw new Error(
      `Failed to serialize event payload for ${context}. Reason: ${error.message}`,
    );
  }
}
