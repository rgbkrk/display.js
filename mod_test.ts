import {
  assertSpyCall,
  spy,
} from "https://deno.land/std@0.202.0/testing/mock.ts";

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.201.0/assert/mod.ts";

import { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";

import { $display, display } from "./mod.ts";

import { hasDisplaySymbol } from "./format.ts";

export async function fakeBroadcast(
  _msg_type: string,
  _content: { [key: string]: object },
  _extras?: {
    metadata?: { [key: string]: object };
    buffers?: ArrayBuffer[];
    [key: string]: unknown;
  }
): Promise<void> {
  await Promise.resolve();
}

export async function assertDisplayedAs(obj: unknown, result: object) {
  const mockedBroadcast = spy(fakeBroadcast);

  // @ts-ignore Deno.jupyter only exists when running the kernel
  Deno.jupyter = {
    broadcast: mockedBroadcast,
  };

  await display(obj);

  assertSpyCall(mockedBroadcast, 0, {
    args: ["display_data", { data: result, metadata: {}, transient: {} }],
  });

  // @ts-ignore Put Deno.jupyter back to undefined
  Deno.jupyter = undefined;
}

Deno.test(
  "display() returns a MediaBundle when Deno.jupyter.broadcast not defined",
  async () => {
    const bundle = await display(
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
  }
);

Deno.test("display() returns a MediaBundle with a canvas", async () => {
  const canvas = createCanvas(5, 5);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 5, 5);

  await assertDisplayedAs(canvas, {
    "image/png":
      "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAAVSURBVAiZY/zPwPCfAQ0woQtQQRAAzqkCCB/D3o0AAAAASUVORK5CYII=",
  });
});

Deno.test(
  "display() returns a MediaBundle from a class with the display symbol",
  async () => {
    class Example {
      x: number;

      constructor(x: number) {
        this.x = x;
      }

      [Symbol.for("Jupyter.display")]() {
        return { "application/json": { x: this.x } };
      }
    }

    const example = new Example(5);

    // Now to check on the broadcast call being made
    await assertDisplayedAs(example, { "application/json": { x: 5 } });
  }
);

Deno.test(
  "display() returns a MediaBundle from a class with an async displayable",
  async () => {
    class Example {
      x: number;

      constructor(x: number) {
        this.x = x;
      }

      async [Symbol.for("Jupyter.display")]() {
        await new Promise((resolve) => setTimeout(resolve, 0));

        return { "application/json": { x: this.x } };
      }
    }

    const example = new Example(3);

    // Now to check on the broadcast call being made
    await assertDisplayedAs(example, { "application/json": { x: 3 } });
  }
);
