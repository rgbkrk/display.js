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
      "",
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
  options: DisplayOptions = { raw: true },
): Displayable | unknown {
  // Pass undefined and null through
  if (obj == null) {
    return obj;
  }

  const displayable = format(obj);

  if (displayable) {
    return displayable;
  }

  if (isMediaBundle(obj) && options.raw) {
    return makeDisplayable(obj);
  }

  throw new Error(
    "Object not supported. Please file an issue on https://github.com/rgbkrk/display.js",
  );
}
