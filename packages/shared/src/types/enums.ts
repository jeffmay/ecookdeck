import { type, type Type } from "arktype";
import { type Companion } from "./companion";

/**
 * The expected shape of a companion object for generating and validating enums.
 * 
 * Satisfying this type signature allows you to use the functions in this module.
 */
export interface EnumCompanion<N extends string, V extends readonly unknown[]> extends Companion<N, Type<V[number]>> {
  readonly type: Type<V[number]>;
  readonly values: V;
}

/**
 * Constructs an EnumCompanion object with the given parameters. The type function is generated based on the provided name and values.
 *
 * @param name the name of the enumeration type.
 * @param values an array of the allowed values for the enumeration.
 * @param extend extend the default companion object with additional properties or methods.
 * @returns an EnumCompanion object with the specified name and values, and a type function that generates an Arktype enumerated type for the values.
 */
export function EnumCompanion<N extends string, const V extends readonly unknown[], R extends EnumCompanion<N, V> = EnumCompanion<N, V>>(name: N, values: V, extend?: (o: EnumCompanion<N, V>) => R): R {
  const base: EnumCompanion<N, V> = {
    name,
    type: type.enumerated(...values),
    values,
  };
  return extend ? extend(base) : base as R;
}
