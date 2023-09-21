# display.js

Rich Displays for Jupyter JavaScript Kernels

`In[1]:`

```typescript
import { display } from "https://deno.land/x/display/mod.ts";
display({
  "text/markdown":
    "Get ready for **denotebooks**! ![](https://github.com/denoland.png?size=32)",
});
```

`Out[1]:`

Get ready for **denotebooks**! ![](https://github.com/denoland.png?size=32)

---

For more examples, check out
[the test notebooks](https://github.com/rgbkrk/display.js/tree/main/test-notebooks).

## Background

With Deno's 1.37 release comes a built in Jupyter kernel. You can create
notebooks with JavaScript and TypeScript.

One key feature of Jupyter kernels is the ability to display objects as richer
media types like HTML, Markdown, Images, Vega, JSON, and many more.

This module provides a simple API to display richer media types in the Deno
kernel. Centering on this is the use of a `Symbol.for('Jupyter.display')` on an
object to indicate to Deno that the object should be displayed.

```typescript
{
  [Symbol.for('Jupyter.display')]: () => ({
    'text/markdown': '# Hello from Deno'
  })
}
```

Obviously this isn't the most _fun_ interface which is why this module provides
a `display` function to make it easier to use.

```typescript
display({ "text/markdown": "# Hello from Deno" });
```

## Usage

### `display`

NOTE: `display` must always be used as the last expression in a cell until
`display_data` is supported (see
[denoland/deno#20591](https://github.com/denoland/deno/issues/20591))

`In[2]:`

```typescript
import { display } from "https://deno.land/x/display/mod.ts";
import * as pl from "npm:nodejs-polars";

let df = new pl.DataFrame({
  fruit: ["Apples", "Oranges"],
  comparability: [0, 1],
});

display(df);
```

`Out[2]`:

<table><thead><tr><th>fruit</th><th>comparability</th></tr></thead><tbody><tr><td>Apples</td><td>0</ td></tr><tr><td>Oranges</td><td>1</td></tr></tbody></table>

### Tagged templates

#### `html`

```typescript
import { html } from "https://deno.land/x/display/mod.ts";
html`<h1>Hello Deno!</h1>`;
```

#### `md`

```typescript
import { md } from "https://deno.land/x/display/mod.ts";
md`## Hello Deno!`;
```

## Roadmap

- [x] Create a `display` function to provide deno functionality like
      `IPython.display(obj, raw=True)`
- [ ] Adapt `display` function to hook into sending `display_data` on the Deno
      kernel (xref:
      [denoland/deno#20591](https://github.com/denoland/deno/issues/20591))
- [x] Duck type common objects and determine a decent representation
  - [x] `Canvas` -> `image/png`
  - [x] Polar's `DataFrame` ->
        `{ text/html, application/vnd.dataresource+json }`
  - [x] SVGElement -> `image/svg+xml`
  - [x] HTMLElement -> `text/html`
  - [ ] React.Element -> `text/html` and/or `application/vdom.v1+json`
