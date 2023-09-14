export const $display = Symbol.for("Jupyter.display")

interface DisplayOptions {
  raw?: boolean
}

type MediaBundle = {
  'text/plain'?: string
  'text/html'?: string
  'image/svg+xml'?: string
  'text/markdown'?: string
  'application/javascript'?: string

  // Images (sadly, per Jupyter spec) must be base64 encoded. We could _allow_
  // accepting Uint8Array or ArrayBuffer within `display` calls, however we still
  // need to encode them for jupyter.
  'image/png'?: string // WISH: Uint8Array | ArrayBuffer
  'image/jpeg'?: string // WISH: Uint8Array | ArrayBuffer
  'image/gif'?: string // WISH: Uint8Array | ArrayBuffer
  'application/pdf'?: string // WISH: Uint8Array | ArrayBuffer

  // TODO(rgbkrk): File an issue on Deno to support `application/.*json` as objects
  //               as currently Deno is only sending strings.
  'application/json'?: Object // Note: must be JSON serializable
  'application/geo+json'?: Object
  'application/vdom.v1+json'?: Object
  'application/vnd.plotly.v1+json'?: Object
  'application/vnd.vega.v5+json'?: Object
  'application/vnd.vegalite.v4+json'?: Object
  'application/vnd.vegalite.v5+json'?: Object

  // Must support a catch all for custom mime-types
  [key: string]: string | Object | undefined
}

type Displayable = {
  [$display]: () => MediaBundle
};

function hasDisplaySymbol(obj: unknown): obj is Displayable {
  return obj !== null && typeof obj === "object" && $display in obj;
}

function isMediaBundle(obj: unknown, raw: boolean = true): obj is MediaBundle {
  if (obj !== null && typeof obj === "object") {
    return raw ? true : Object.keys(obj).every(key => typeof obj[key] === "string");
  }
  return false
}

/**
 * Display function for Jupyter Deno Kernel.
 * Mimics the behavior of IPython's display(obj, raw=True) while working with
 * the limitations of the 1.37 release of Deno (for now).
 *
 * @param obj - The object to be displayed
 * @param options - Display options with a default { raw: true }
 * @returns A media bundle object
 */
export function display(obj: unknown, options: DisplayOptions = { raw: true }): Displayable {
  // Check to see if the obj already has a Symbol.for("Jupyter.display") method on it
  // If so, just return it.
  if (hasDisplaySymbol(obj)) {
    return obj;
  }

  if (!options.raw) {
    throw new Error("Only raw=true is supported at this time.");
  }

  if (isMediaBundle(obj, options.raw)) {
    return {
      [$display]: () => obj
    }
  }

  throw new Error("When using raw=true, the object must be a collection of media types.")
}
