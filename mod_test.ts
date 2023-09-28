import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.201.0/assert/mod.ts";

import { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";

import { $display, display } from "./mod.ts";

import { hasDisplaySymbol } from "./format.ts";

Deno.test("display() returns a MediaBundle", () => {
  const bundle = display(
    {
      "image/png": "data:image/png;base64,abc123",
      "text/plain": "hello world",
    },
    { raw: true }
  );

  assert(bundle != null && typeof bundle == "object");

  assert(hasDisplaySymbol(bundle));

  const result = bundle[$display]();

  assertEquals(result, {
    "image/png": "data:image/png;base64,abc123",
    "text/plain": "hello world",
  });
});

Deno.test("display() returns a MediaBundle with a canvas", () => {
  const canvas = createCanvas(5, 5);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 5, 5);

  const bundle = display(canvas);
  assert(hasDisplaySymbol(bundle));

  const result = bundle[$display]();

  assertExists(result["image/png"]);

  assertEquals(result, {
    "image/png":
      "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAAVSURBVAiZY/zPwPCfAQ0woQtQQRAAzqkCCB/D3o0AAAAASUVORK5CYII=",
  });
});
