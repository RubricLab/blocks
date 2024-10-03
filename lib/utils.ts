import type { ReactNode } from 'react'
import type { z } from 'zod'

export function createBlock<TArgs extends z.ZodTypeAny>(config: {
	schema: TArgs
	render: (args: z.infer<TArgs>) => ReactNode
}) {
	return config
}

export function createBlockRenderer<T extends Record<string, ReturnType<typeof createBlock>>>(
	blocks: T
) {
	return {
		renderUI(schema: Partial<{ [key in keyof T]: z.infer<T[key]['schema']> }>) {
			return Object.entries(schema).map(([k, s]) => {
				return blocks[k]?.render(s)
			})
		}
	}
}
