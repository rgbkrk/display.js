export const $display = Symbol.for("Jupyter.display")

type Displayable = unknown;

interface DisplayOptions {
  raw?: boolean
}

type MediaBundle = {
  'text/plain'?: string
  'text/html'?: string
  'text/markdown'?: string
  'image/png'?: string // WISH: Uint8Array | ArrayBuffer
  'image/jpeg'?: string // WISH: Uint8Array | ArrayBuffer
  'image/gif'?: string // WISH: Uint8Array | ArrayBuffer
  'application/pdf'?: string // WISH: Uint8Array | ArrayBuffer
  'image/svg+xml'?: string
  'application/javascript'?: string
  'application/json'?: Object // Note: must be JSON serializable
  'application/geo+json'?: Object
  'application/vnd.plotly.v1+json'?: Object
  'application/vnd.vega.v5+json'?: Object
  'application/vnd.vegalite.v4+json'?: Object
  'application/vnd.vegalite.v5+json'?: Object

  // Must support a catch all for custom mime-types
  [key: string]: string | Object | undefined
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
export function display(obj: Displayable, options: DisplayOptions = { raw: true }): MediaBundle {
  if (!options.raw) {
    throw new Error("Only raw=true is supported at this time");
  }

  // If raw is true, return the object as-is; otherwise, you can add additional behavior
  const displayObject = obj;

  return {
    [Symbol.for("Jupyter.display")]: () => displayObject
  };
}
