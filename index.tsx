import type { AnyAction } from '@rubriclab/actions'
import type { ReactNode } from 'react'
import z from 'zod/v4'

// const REACT_NODE = z.custom<ReactNode>()
export const REACT_NODE = z.literal('ReactNode')

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
		react: ReactNode
		state: z.infer<Output>
	}
	description: string | undefined
}) {
	return {
		description,
		render,
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
		state: z.infer<Output>
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
	return z.object({
		block: z.literal(name),
		props: z.object(input)
	})
}

export function createGenericTypeProviderBlock<
	TypeOptions extends Record<string, { type: z.ZodType; compatabilities: z.ZodType }>,
	ChildrenOptions extends z.ZodUnion,
	AdditionalInput extends z.ZodType
>({
	typeOptions,
	instantiate
}: {
	typeOptions: TypeOptions
	instantiate: <TypeKey extends keyof TypeOptions & string>({
		type
	}: {
		type: TypeKey
	}) => ReturnType<
		typeof createBlock<
			AdditionalInput & {
				hydrate: TypeOptions[keyof TypeOptions]['compatabilities']
				children: z.ZodArray<ChildrenOptions>
			}
		>
	>
}) {
	type Keys = keyof TypeOptions & string
	const keys = Object.keys(typeOptions) as Keys[]

	return {
		execute: async ({ type }: { type: Keys }) => {
			return instantiate({ type })
		},
		schema: {
			input: {
				type: z.enum(keys)
			},
			output: z.void()
		},
		type: 'action' as const
	}
}

export function createGenericActionExecutorBlock<ActionOptions extends Record<string, AnyAction>>({
	actionOptions,
	instantiate,
	description
}: {
	actionOptions: ActionOptions
	instantiate: <ActionKey extends keyof ActionOptions>({
		actionName
	}: {
		actionName: ActionKey
	}) => ReturnType<
		typeof createBlock<
			ActionOptions[keyof ActionOptions]['schema']['input']
			//  & {
			// 	onExecute: z.ZodArray<ChildrenOptions>
			// }
		>
	>
	description: string | undefined
}) {
	type Keys = keyof ActionOptions & string
	const keys = Object.keys(actionOptions) as Keys[]

	return {
		description,
		execute: async ({ actionName }: { actionName: Keys }) => {
			return instantiate({ actionName })
		},
		schema: {
			input: {
				actionName: z.enum(keys)
			},
			output: z.undefined()
		},
		type: 'action' as const
	}
}

// export function createGenericActionMapperBlock<ActionOptions extends Record<string, z.ZodType>>({
// 	actionOptions
// }: {
// 	actionOptions: ActionOptions
// }) {
// 	return {}
// }

// export function createGenericActionSelectorBlock<
// 	ActionOptions extends Record<string, z.ZodType>
// >() {}

export function createBlockRenderer<BlockMap extends Record<string, AnyBlock>>({
	blocks
}: {
	blocks: BlockMap
}) {
	return {
		render<BlockKey extends keyof BlockMap & string>({
			block,
			props
		}: z.infer<
			ReturnType<typeof createBlockProxy<BlockKey, BlockMap[BlockKey]['schema']['input']>>
		>) {
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
