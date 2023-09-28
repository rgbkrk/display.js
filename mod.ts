import {
  $display,
  Displayable,
  format,
  makeDisplayable,
  MediaBundle,
} from "./format.ts";

export { $display };

interface DisplayOptions {
  raw?: boolean;
  update?: boolean;
  display_id?: string;
}

type DenoJupyter = typeof Deno & {
  jupyter: {
    broadcast(
      msg_type: string,
      content: { [key: string]: object },
      metadata?: { [key: string]: object },
      buffers?: ArrayBuffer[]
    ): Promise<void>;
  };
};

function hasJupyterBroadcast(d: typeof Deno): d is DenoJupyter {
  return (
    "jupyter" in d &&
    d?.jupyter != null &&
    typeof d?.jupyter == "object" &&
    "broadcast" in d?.jupyter &&
    typeof d?.jupyter?.broadcast == "function"
  );
}

/**
 * This function creates a tagged template function for a given media type.
 * The tagged template function takes a template string and returns a displayable object.
 *
 * @param mediatype - The media type for the tagged template function.
 * @returns A function that takes a template string and returns a displayable object.
 */
function createTaggedTemplate(mediatype: string) {
  return (strings: TemplateStringsArray, ...values: unknown[]) => {
    const payload = strings.reduce(
      (acc, string, i) => acc + string + (values[i] || ""),
      ""
    );

    return makeDisplayable({ [mediatype]: payload });
  };
}

/**
 * Markdown Tagged Template Function.
 *
 * Takes a template string and returns a displayable object for Jupyter frontends.
 *
 * Example usage:
 *
 * md`# Notebooks in TypeScript via Deno ![Deno logo](https://github.com/denoland.png?size=32)
 *
 * * TypeScript ${Deno.version.typescript}
 * * V8 ${Deno.version.v8}
 * * Deno ${Deno.version.deno} 🔜 1.37.0
 *
 * Interactive compute with Jupyter _built into Deno_!
 * `
 */
export const md = createTaggedTemplate("text/markdown");

/**
 * HTML Tagged Template Function.
 *
 * Takes a template string and returns a displayable object for Jupyter frontends.
 *
 * Example usage:
 *
 * html`<h1>Hello, world!</h1>`
 */
export const html = createTaggedTemplate("text/html");

export const plain = createTaggedTemplate("text/plain");
export const js = createTaggedTemplate("application/javascript");

/**
 * SVG Tagged Template Function.
 *
 * Takes a template string and returns a displayable object for Jupyter frontends.
 *
 * Example usage:
 *
 * svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
 *      <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
 *    </svg>`
 */
export const svg = createTaggedTemplate("image/svg+xml");

function isMediaBundle(obj: unknown): obj is MediaBundle {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }

  // Check if all keys are strings
  for (const key in obj) {
    if (typeof key !== "string") {
      return false;
    }
  }

  return true;
}

// TODO: If possible, expose a synchronous display for Deno version 1.37.0 and an asynchronous display for 1.37.1
// Constraints: exports themselves can't be dynamically updated with ESM

/**
 * Display function for Jupyter Deno Kernel.
 * Mimics the behavior of IPython's display(obj, raw=True) while working with
 * the limitations of the 1.37 release of Deno (for now).
 *
 * Given that we don't have a direct way to create `display_data` (yet) in Deno,
 * at least from userspace, this function can only be used as the result in a cell.
 *
 * @param obj - The object to be displayed
 * @param options - Display options with a default { raw: true }
 * @returns An object that Deno can display
 */
export function display(
  obj: unknown,
  options: DisplayOptions = { raw: false, update: false }
): Displayable | Promise<void> | undefined {
  // Always format first to detect if we have a displayable object
  let displayable;

  if (options.raw && isMediaBundle(obj)) {
    displayable = makeDisplayable(obj);
  } else {
    displayable = format(obj);
  }

  // Type guards don't work on global namespaces so we have to grab `Deno`
  // as a separate variable then use the type guard
  const jeno = Deno;

  if (!hasJupyterBroadcast(jeno)) {
    // The "old" interface for `display()` was to return a Displayable
    // as the last expression in a cell in Deno 1.37.0.
    return displayable;
  }

  const bundle = displayable[$display]();

  let message_type = "display_data";

  if (options.update) {
    message_type = "update_display_data";
  }
  let transient = {};
  if (options.display_id) {
    transient = { display_id: options.display_id };
  }

  return jeno.jupyter.broadcast(message_type, {
    data: bundle,
    metadata: {},
    transient,
  });
}
