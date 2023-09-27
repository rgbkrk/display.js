export const $display = Symbol.for("Jupyter.display");

export type MediaBundle = {
  "text/plain"?: string;
  "text/html"?: string;
  "image/svg+xml"?: string;
  "text/markdown"?: string;
  "application/javascript"?: string;

  // Images (sadly, per Jupyter spec) must be base64 encoded. We could _allow_
  // accepting Uint8Array or ArrayBuffer within `display` calls, however we still
  // need to encode them for jupyter.
  "image/png"?: string; // WISH: Uint8Array | ArrayBuffer
  "image/jpeg"?: string; // WISH: Uint8Array | ArrayBuffer
  "image/gif"?: string; // WISH: Uint8Array | ArrayBuffer
  "application/pdf"?: string; // WISH: Uint8Array | ArrayBuffer

  // TODO(rgbkrk): File an issue on Deno to support `application/.*json` as objects
  //               as currently Deno is only sending strings.
  "application/json"?: object; // Note: must be JSON serializable and an object (no arrays, strings, or other primitives)
  "application/geo+json"?: object;
  "application/vdom.v1+json"?: object;
  "application/vnd.plotly.v1+json"?: object;
  "application/vnd.vega.v5+json"?: VegaObject;
  "application/vnd.vegalite.v4+json"?: VegaObject;
  "application/vnd.vegalite.v5+json"?: VegaObject;

  // Must support a catch all for custom mime-types
  [key: string]: string | object | undefined;
};

/** VEGA **/

type VegaObject = {
  $schema: string;
  [key: string]: unknown;
};

type PossibleVega = {
  toSpec: () => VegaObject;
};

function isVegaLike(obj: unknown): obj is PossibleVega {
  return obj !== null && typeof obj === "object" && "toSpec" in obj;
}

function extractVega(obj: PossibleVega): MediaBundle | null {
  const spec = obj.toSpec();

  if (!("$schema" in spec)) {
    return null;
  }
  if (typeof spec !== "object") {
    return null;
  }

  // Default to Vega 5
  let mediaType = "application/vnd.vega.v5+json";

  // Determine spec based on spec.$schema
  // https://vega.github.io/vega-lite/docs/spec.html#top-level-properties
  if (spec.$schema === "https://vega.github.io/schema/vega-lite/v4.json") {
    mediaType = "application/vnd.vegalite.v4+json";
  } else if (
    spec.$schema === "https://vega.github.io/schema/vega-lite/v5.json"
  ) {
    mediaType = "application/vnd.vegalite.v5+json";
  }

  return {
    [mediaType]: spec,
  };
}

/** Polars */

// This is a quick and dirty version to show a prototype before
// showing the nodejs-polars folks or others.

type ColType = {
  toJSON: () => { DataType: string };
};

type PossibleDataFrame = {
  schema: {
    [key: string]: ColType;
  };

  head: (n: number | undefined) => PossibleDataFrame;
  toRecords: () => Array<Record>;
};

type Field = {
  name: string;
  type: string;
};

type Record = {
  [key: string]: unknown;
};

type Schema = {
  fields: Array<Field>;
};

function isDataFrameLike(obj: unknown): obj is PossibleDataFrame {
  const isObject = obj !== null && typeof obj === "object";

  if (!isObject) {
    return false;
  }

  // For some reason we can't perform the typical "schema" in obj
  // check. To make typescript ok with this though, we
  // need to assert the object as PossibleDataFrame before checking its properties.
  const df = obj as PossibleDataFrame;

  return df.schema !== undefined &&
    typeof df.schema === "object" &&
    df.head !== undefined &&
    typeof df.head === "function" &&
    df.toRecords !== undefined &&
    typeof df.toRecords === "function";
}

/**
 * Map Polars DataType to JSON Schema data types.
 * @param dataType - The Polars DataType.
 * @returns The corresponding JSON Schema data type.
 */
function mapPolarsTypeToJSONSchema(colType: ColType): string {
  const typeMapping: { [key: string]: string } = {
    "Null": "null",
    "Bool": "boolean",
    "Int8": "integer",
    "Int16": "integer",
    "Int32": "integer",
    "Int64": "integer",
    "UInt8": "integer",
    "UInt16": "integer",
    "UInt32": "integer",
    "UInt64": "integer",
    "Float32": "number",
    "Float64": "number",
    "Date": "string",
    "Datetime": "string",
    "Utf8": "string",
    "Categorical": "string",
    "List": "array",
    "Struct": "object",
  };
  // These colTypes are weird. When you console.dir or console.log them
  // they show a `DataType` field, however you can't access it directly until you
  // convert it to JSON
  // #justRustNodeDenoThings
  const dataType = colType.toJSON()["DataType"];
  return typeMapping[dataType] || "string";
}

export function extractDataFrame(df: PossibleDataFrame) {
  const fields: Array<Field> = [];
  const schema: Schema = {
    fields,
  };
  let data = [];

  // Convert DataFrame schema to Tabular DataResource schema
  for (const [colName, colType] of Object.entries(df.schema)) {
    const dataType = mapPolarsTypeToJSONSchema(colType);

    schema.fields.push({
      name: colName,
      type: dataType,
    });
  }

  // Convert DataFrame data to row-oriented JSON
  //
  // TODO: Determine how to get the polars format max rows
  //       Since pl.setTblRows just sets env var POLARS_FMT_MAX_ROWS,
  //       we probably just have to pick a number for now.
  //
  data = df.head(50).toRecords();

  // Enough generated for the Tabular Data Resource Schema, on to
  // creating an HTML table

  let htmlTable = "<table>";

  // Add table headers
  htmlTable += "<thead><tr>";
  schema.fields.forEach((field) => {
    htmlTable += `<th>${field.name}</th>`;
  });
  htmlTable += "</tr></thead>";

  // Add table data
  htmlTable += "<tbody>";
  df.head(10).toRecords().forEach((row) => {
    htmlTable += "<tr>";
    schema.fields.forEach((field) => {
      htmlTable += `<td>${row[field.name]}</td>`;
    });
    htmlTable += "</tr>";
  });
  htmlTable += "</tbody></table>";

  return {
    "application/vnd.dataresource+json": { data, schema },
    "text/html": htmlTable,
  };
}

/** CANVAS **/

type PossibleCanvas = {
  toDataURL: () => string;
};

function isCanvasLike(obj: unknown): obj is PossibleCanvas {
  return obj !== null && typeof obj === "object" && "toDataURL" in obj;
}

/** SVG **/

type PossibleSVG = {
  outerHTML: string;
};

function isSVGElementLike(obj: unknown): obj is PossibleSVG {
  return obj !== null &&
    typeof obj === "object" &&
    "outerHTML" in obj &&
    typeof obj.outerHTML === "string" &&
    obj.outerHTML.startsWith("<svg");
}
/** HTML **/

type PossibleHTML = {
  outerHTML: string;
};

function isHTMLElementLike(obj: unknown): obj is PossibleHTML {
  return obj !== null &&
    typeof obj === "object" &&
    "outerHTML" in obj &&
    typeof obj.outerHTML === "string";
  // NOTE: Unlike the SVG check, we will allow any HTML Fragment
}

/**
 * Displayable Interface
 */

export type Displayable = {
  [$display]: () => MediaBundle;
};

export function hasDisplaySymbol(obj: unknown): obj is Displayable {
  return (
    obj !== null &&
    typeof obj === "object" &&
    $display in obj &&
    typeof obj[$display] === "function"
  );
}

export function makeDisplayable(obj: MediaBundle) {
  return {
    [$display]: () => obj,
  };
}

/**
 * Format an object for displaying in Deno
 *
 * @param obj - The object to be displayed
 * @returns Displayable or undefined
 */
export function format(obj: unknown): Displayable | undefined {
  if (obj === null) {
    return makeDisplayable({
      "text/plain": "null",
    });
  }

  if (typeof obj === "boolean" || typeof obj === "number") {
    return makeDisplayable({
      "text/plain": obj.toString(),
    });
  }

  if (typeof obj === "string") {
    return makeDisplayable({
      "text/plain": `"${obj}"`,
    });
  }

  // Check to see if the obj already has a Symbol.for("Jupyter.display") method on it
  // If so, just return it.
  if (hasDisplaySymbol(obj)) {
    return obj;
  }

  if (isCanvasLike(obj)) {
    return {
      // Lazy convert from canvas to image only on display
      [$display]: () => {
        const dataURL = obj.toDataURL();
        const parts = dataURL.split(",");

        const mime = parts[0].split(":")[1].split(";")[0];
        const data = parts[1];

        return {
          [mime]: data,
        };
      },
    };
  }

  if (isVegaLike(obj)) {
    const vegaBundle = extractVega(obj);
    if (vegaBundle) {
      return makeDisplayable(vegaBundle);
    }
  }

  if (isDataFrameLike(obj)) {
    const dataFrameBundle = extractDataFrame(obj);
    if (dataFrameBundle) {
      return makeDisplayable(dataFrameBundle);
    }
  }

  // Since SVG is valid HTML, we first check for an SVG element
  // Then check for an HTML element
  if (isSVGElementLike(obj)) {
    return makeDisplayable({
      "image/svg+xml": obj.outerHTML,
    });
  }

  if (isHTMLElementLike(obj)) {
    return makeDisplayable({
      "text/html": obj.outerHTML,
    });
  }

  throw new Error(
    "Object not supported. Please file an issue on https://github.com/rgbkrk/display.js",
  );
}
