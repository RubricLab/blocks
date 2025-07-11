import type { SupportedZodTypes } from '@rubriclab/chains/lib/types'
import type { ReactNode } from 'react'
import z from 'zod/v4'
import type { $strict } from 'zod/v4/core'

// const REACT_NODE = z.custom<ReactNode>()
export const REACT_NODE = z.literal('ReactNode')

export function statefulObject<Type extends z.ZodObject>(type: Type) {
	return z.strictObject(
		Object.fromEntries(
			Object.entries(type.def.shape).map(([key, field]) => [
				key,
				z.union([field, z.strictObject({ react: REACT_NODE, state: field })])
			])
		)
	) as z.ZodObject<
		{
			[K in keyof Type['def']['shape']]: z.ZodUnion<
				[
					Type['def']['shape'][K],
					z.ZodObject<{ react: typeof REACT_NODE; state: Type['def']['shape'][K] }, $strict>
				]
			>
		},
		$strict
	>
}

export function createBlock<Input extends z.ZodType>({
	schema: { input },
	render,
	description
}: {
	schema: { input: Input }
	render: (input: z.infer<Input>) => ReactNode
	description: string | undefined
}) {
	return {
		description,
		render,
		schema: { input, output: REACT_NODE },
		type: 'block' as const
	}
}

export function createStatefulBlock<Input extends z.ZodType, Output extends z.ZodType>({
	schema: { input, output },
	render,
	description
}: {
	schema: {
		input: Input
		output: Output
	}
	render: (input: z.infer<Input>) => {
		initialState: z.infer<Output>
		component: ({ emit }: { emit: (value: z.infer<Output>) => void }) => ReactNode
	}
	description: string | undefined
}) {
	return {
		description,
		render: (input: z.infer<Input>) => {
			const { initialState, component } = render(input)
			let state = initialState
			return {
				getState: () => state,
				react: component({
					emit: emitted => {
						state = emitted
					}
				})
			}
		},
		schema: {
			input,
			output: z.strictObject({
				react: REACT_NODE,
				state: output
			})
		},
		type: 'stateful-block' as const
	}
}

export type BlockWithoutRenderArgs<Input extends z.ZodType> = Omit<
	ReturnType<typeof createBlock<Input>>,
	'render'
> & {
	// biome-ignore lint/suspicious/noExplicitAny: this is required to support generic functions that need to extend a placeholder for Blocks.
	render: (input: any) => ReactNode
}

export type StatefulBlockWithoutRenderArgs<
	Input extends z.ZodType,
	Output extends z.ZodType
> = Omit<ReturnType<typeof createStatefulBlock<Input, Output>>, 'render'> & {
	// biome-ignore lint/suspicious/noExplicitAny: this is required to support generic functions that need to extend a placeholder for Blocks.
	render: (input: any) => {
		react: ReactNode
		getState: z.infer<Output>
	}
}

export type AnyBlock =
	| BlockWithoutRenderArgs<z.ZodType>
	| StatefulBlockWithoutRenderArgs<z.ZodType, z.ZodType>

export function createBlockProxy<Name extends string, Input extends z.ZodType>({
	name,
	input
}: {
	name: Name
	input: Input
}) {
	return z.strictObject({
		block: z.literal(name),
		props: input
	})
}

export function createGenericBlock<Types extends Record<string, { input: z.ZodType }>>({
	types,
	render,
	handleBlock,
	description
}: {
	types: Types
	render: <TypeKey extends keyof Types>(props: z.infer<Types[TypeKey]['input']>) => ReactNode
	handleBlock: <TypeKey extends keyof Types>({
		type,
		block
	}: {
		type: TypeKey
		block: ReturnType<typeof createBlock<Types[TypeKey]['input']>>
	}) => void
	description: string
}) {
	return {
		description,
		async execute<TypeKey extends keyof Types>(typeKey: TypeKey) {
			const schema = types[typeKey] ?? (undefined as never)
			const block = createBlock<(typeof schema)['input']>({
				description: '',
				render,
				schema
			})
			handleBlock({ block, type: typeKey })

			return null
		},
		async instantiate<TypeKey extends keyof Types>(typeKey: TypeKey) {
			const schema = types[typeKey] ?? (undefined as never)
			const block = createBlock<(typeof schema)['input']>({
				description: '',
				render,
				schema
			})

			return { block, type: typeKey }
		},
		schema: {
			input: z.enum(Object.fromEntries(Object.keys(types).map(k => [k, k]))) as z.ZodEnum<{
				[K in keyof Types]: K & string
			}>,
			output: z.null()
		},
		type: 'generic-block'
	}
}

export function createGenericStatefulBlock<
	Types extends Record<string, { input: z.ZodType; output: z.ZodType }>
>({
	types,
	render,
	handleBlock,
	description
}: {
	types: Types
	render: <TypeKey extends keyof Types>(
		props: z.infer<Types[TypeKey]['input']>
	) => {
		initialState: z.infer<Types[TypeKey]['output']>
		component: ({ emit }: { emit: (value: z.infer<Types[TypeKey]['output']>) => void }) => ReactNode
	}
	handleBlock: <TypeKey extends keyof Types>({
		type,
		block
	}: {
		type: TypeKey
		block: ReturnType<typeof createStatefulBlock<Types[TypeKey]['input'], Types[TypeKey]['output']>>
	}) => void
	description: string
}) {
	return {
		description,
		async execute<TypeKey extends keyof Types>(typeKey: TypeKey) {
			const schema = types[typeKey] ?? (undefined as never)
			const block = createStatefulBlock<(typeof schema)['input'], (typeof schema)['output']>({
				description: '',
				render,
				schema
			})
			handleBlock({ block, type: typeKey })

			return null
		},
		async instantiate<TypeKey extends keyof Types>(typeKey: TypeKey) {
			const schema = types[typeKey] ?? (undefined as never)
			const block = createStatefulBlock<(typeof schema)['input'], (typeof schema)['output']>({
				description: '',
				render,
				schema
			})
			return { block, type: typeKey }
		},
		schema: {
			input: z.enum(Object.fromEntries(Object.keys(types).map(k => [k, k]))) as z.ZodEnum<{
				[K in keyof Types]: K & string
			}>,
			output: z.null()
		},
		type: 'generic-stateful-block'
	}
}

export function createBlockRenderer<BlockMap extends Record<string, AnyBlock>>({
	blocks
}: {
	blocks: BlockMap
}) {
	return {
		render<BlockKey extends keyof BlockMap & string>({
			block,
			props
		}: {
			block: BlockKey
			props: z.infer<BlockMap[BlockKey]['schema']['input']>
		}) {
			const { render } = blocks[block] ?? (undefined as never)
			return render(props)
		}
	}
}

export function createBlocksDocs<BlocksMap extends Record<string, AnyBlock>>({
	blocks
}: {
	blocks: BlocksMap
}) {
	return Object.entries(blocks)
		.map(
			([
				name,
				{
					schema: { input, output },
					description
				}
			]) => `## ${String(name)}
### Description:
${description ?? 'No description provided'}
### Input Schema:
${JSON.stringify(
	z.toJSONSchema(
		createBlockProxy({
			input,
			name
		})
	),
	null,
	2
)}
### Output Schema:
${JSON.stringify(z.toJSONSchema(output), null, 2)}`
		)
		.join('\n\n')
}

function orReact(type: z.ZodType) {
	return z.union([type, z.object({ react: REACT_NODE, state: type })])
}

export function getStateful(type: SupportedZodTypes) {
	switch (type.def.type) {
		case 'object': {
			return z.object(
				Object.fromEntries(Object.entries(type.def.shape).map(([key, field]) => [key, orReact(field)]))
			)
		}
		case 'array': {
			return z.array(orReact(type.def.element))
		}
		case 'union': {
			return z.union(type.def.options.map(orReact))
		}
		default: {
			return orReact(type)
		}
	}
}
