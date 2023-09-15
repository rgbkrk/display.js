import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { display, $display } from "./mod.ts";

Deno.test("display() returns a MediaBundle", () => {
  const bundle = display({
    "image/png": "data:image/png;base64,abc123",
    "text/plain": "hello world",
  });

  const result = bundle[$display]();

  assertEquals(result, {
    "image/png": "data:image/png;base64,abc123",
    "text/plain": "hello world",
  });
});
