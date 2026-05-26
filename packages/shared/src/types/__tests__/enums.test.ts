import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { unionOf } from "../enums";

describe("enums", () => {
  describe("unionOf", () => {
    it("should not allow an empty array", () => {
      // @ts-expect-error test invalid input
      unionOf([]);
    });

    const tests = [
      [
        "strings",
        {
          values: ["1", "2", "3"],
          expected: "'1' | '2' | '3'",
          firstType: "string",
          excluded: "4",
        },
      ],
      [
        "numbers",
        { values: [1, 2.2, -3.33], expected: "1 | 2.2 | -3.33", firstType: "number", excluded: 3 },
      ],
      ["booleans", { values: [true], expected: "true", firstType: "boolean", excluded: false }],
      [
        "mixed",
        {
          values: [null, "A", 0, 1, true, false],
          expected: "null | 'A' | 0 | 1 | true | false",
          firstType: "object",
          excluded: undefined,
        },
      ],
    ] as const;

    for (const [group, { values, firstType, expected, excluded }] of tests) {
      describe(group, () => {
        it("should produce the correct type", () => {
          const union = type(unionOf(values));
          const first = values[0];
          expect(union(first)).toBeTypeOf(firstType);
          expect(union(excluded)).toBeInstanceOf(type.errors);
        });

        it("should produce the correct value at run-time", () => {
          const def = unionOf(values);
          expect(def).toEqual(expected);
        });
      });
    }
  });
});
