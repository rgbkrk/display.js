# display.js

Rich Displays for Jupyter JavaScript Kernels

`In[1]:`

```typescript
import { display } from "https://deno.land/x/display/mod.ts"
display({'text/markdown': 'Get ready for **denotebooks**! ![](https://github.com/denoland.png?size=32)'})
```

`Out[1]:`

Get ready for **denotebooks**! ![](https://github.com/denoland.png?size=32)

## Background

With Deno's 1.37 release comes a built in Jupyter kernel. You can create notebooks with JavaScript and TypeScript.

One key feature of Jupyter kernels is the ability to display objects as richer media types like HTML, Markdown, Images, Vega, JSON, and many more.

This module provides a simple API to display richer media types in the Deno kernel. Centering on this is the use of a `Symbol.for('Jupyter.display')` on an object to indicate to Deno that the object should be displayed.

```typescript
{
  [Symbol.for('Jupyter.display')]: () => ({
    'text/markdown': '# Hello from Deno'
  })
}
```

Obviously this isn't the most _fun_ interface which is why this module provides a `display` function to make it easier to use.

```typescript
display({'text/markdown': '# Hello from Deno'})
```
