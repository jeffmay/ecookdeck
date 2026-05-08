import { type } from "arktype";

export function is_type_error(result: unknown): result is type.errors {
  return result instanceof type.errors;
}

export function assert_valid<T>(result: T | type.errors, options?: { message?: string }): asserts result is T {
  if (result instanceof type.errors) {
    throw new Error(`${options?.message ? `${options.message}\n` : ""}\n${Object.entries(result.byAncestorPath).join("\n")}`);
  }
}

export function valid_or_throw<T>(result: T | type.errors, options?: { message?: string }): T {
  assert_valid(result, options);
  return result;
}
