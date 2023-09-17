import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { createCanvas } from "https://deno.land/x/canvas/mod.ts";

import { display, $display } from "./mod.ts";
import { assertExists } from "https://deno.land/std@0.201.0/assert/assert_exists.ts";

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

Deno.test("display() returns a MediaBundle with a canvas", () => {
  const canvas = createCanvas(5, 5);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 5, 5);

  const bundle = display(canvas);

  const result = bundle[$display]();

  assertExists(result["image/png"]);

  assertEquals(result, {
    "image/png":
      "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAAVSURBVAiZY/zPwPCfAQ0woQtQQRAAzqkCCB/D3o0AAAAASUVORK5CYII=",
  });
});
