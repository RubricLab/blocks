# @rubriclab/blocks
The Blocks package aims to provide a powerful and simple way to define blocks (which are essentially UI primitives) and execute them safely with JSON serializable payloads.

It is part of Rubric's architecture for Generative UI when used with:
- [@rubriclab/actions](https://github.com/rubriclab/actions)
- [@rubriclab/blocks](https://github.com/rubriclab/blocks)
- [@rubriclab/chains](https://github.com/rubriclab/chains)
- [@rubriclab/agents](https://github.com/rubriclab/agents)
- [@rubriclab/events](https://github.com/rubriclab/events)

[Demo](https://chat.rubric.sh)

## Get Started
### Installation
`bun add @rubriclab/blocks`

> @rubriclab scope packages are not built, they are all raw typescript. If using in a next.js app, make sure to transpile.

```ts
// next.config.ts
import type { NextConfig } from  'next' 
export default {
	transpilePackages: ['@rubriclab/blocks'],
	reactStrictMode: true
} satisfies  NextConfig
```

> If using inside the monorepo (@rubric), simply add `{"@rubriclab/blocks": "*"}` to dependencies and then run `bun i`

### Define Blocks
To get started, define a few blocks.

```tsx
import { createBlock } from '@rubriclab/blocks'
import { Heading } from '~/ui/heading'
import { z } from 'zod/v4'

const heading = createBlock({
	schema: {
		input: z.object({
			text: z.string()
		})
	},
	render: ({ text }) => <h1>{text}</h1>,
	description: "Renders a heading"
})

export const blocks = { heading }
```

### Create a Renderer
Pass all your blocks into an render to get a function to render it.

```ts
'use client'

import { createBlockRenderer } from '@rubriclab/blocks'
import { blocks } from './blocks'

export const { render } = createBlockRenderer({ blocks })
```

### Render a Block

```ts
const block = await render({
    block: 'heading',
    props: {
        text: 'Hello World'
    }
})
```

