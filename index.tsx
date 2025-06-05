import type { AnyAction } from '@rubriclab/actions'
import type { ReactNode } from 'react'
import z from 'zod/v4'
import type { $strict } from 'zod/v4/core'

export function createBlock<Input extends Record<string, z.ZodType>, Output extends z.ZodType>({
	schema,
	render,
	description
}: {
	schema: { input: Input; output: Output }
	render: (
		input: {
			[key in keyof Input]: z.infer<Input[key]>
			// | { react: ReactNode; value: z.infer<Input[key]> }
		},
		{ emit }: { emit: (output: z.infer<Output>) => void }
	) => ReactNode
	description: string | undefined
}) {
	return {
		type: 'block' as const,
		schema,
		render,
		description
	}
}

export function createStatefulBlock<
	Input extends Record<string, z.ZodType>,
	Output extends z.ZodType
>({
	schema,
	render,
	description
}: {
	schema: { input: Input; output: Output }
	render: (input: z.infer<z.ZodObject<Input, $strict>>) => {
		react: ReactNode
		state: z.infer<Output>
	}
	description: string | undefined
}) {
	return {
		type: 'stateful-block' as const,
		schema,
		render,
		description
	}
}

export type BlockWithoutRenderArgs<
	Input extends Record<string, z.ZodType>,
	Output extends z.ZodType
> = Omit<ReturnType<typeof createBlock<Input, Output>>, 'render'> & {
	// biome-ignore lint/suspicious/noExplicitAny: this is required to support generic functions that need to extend a placeholder for Blocks.
	render: (input: any, { emit }: { emit: (output: z.infer<Output>) => void }) => ReactNode
}

export type StatefulBlockWithoutRenderArgs<
	Input extends Record<string, z.ZodType>,
	Output extends z.ZodType
> = Omit<ReturnType<typeof createStatefulBlock<Input, Output>>, 'render'> & {
	// biome-ignore lint/suspicious/noExplicitAny: this is required to support generic functions that need to extend a placeholder for Blocks.
	render: (input: any) => {
		react: ReactNode
		state: z.infer<Output>
	}
}

export type AnyBlock =
	| BlockWithoutRenderArgs<Record<string, z.ZodType>, z.ZodType>
	| StatefulBlockWithoutRenderArgs<Record<string, z.ZodType>, z.ZodType>

export function createBlockProxy<Name extends string, Input extends Record<string, z.ZodType>>({
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
	AdditionalInput extends Record<string, z.ZodType>
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
			},
			z.ZodVoid
		>
	>
}) {
	type Keys = keyof TypeOptions & string
	const keys = Object.keys(typeOptions) as Keys[]

	return {
		type: 'action' as const,
		schema: {
			input: {
				type: z.enum(keys)
			},
			output: z.void()
		},
		execute: async ({ type }: { type: Keys }) => {
			return instantiate({ type })
		}
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
			ActionOptions[keyof ActionOptions]['schema']['input'],
			//  & {
			// 	onExecute: z.ZodArray<ChildrenOptions>
			// }
			z.ZodUndefined
		>
	>
	description: string | undefined
}) {
	type Keys = keyof ActionOptions & string
	const keys = Object.keys(actionOptions) as Keys[]

	return {
		type: 'action' as const,
		schema: {
			input: {
				actionName: z.enum(keys)
			},
			output: z.undefined()
		},
		execute: async ({ actionName }: { actionName: Keys }) => {
			return instantiate({ actionName })
		},
		description
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
			props,
			emit
		}: z.infer<
			ReturnType<typeof createBlockProxy<BlockKey, BlockMap[BlockKey]['schema']['input']>>
		> & {
			emit: (output: z.infer<BlockMap[BlockKey]['schema']['output']>) => void
		}) {
			const { render } = blocks[block] ?? (undefined as never)
			// biome-ignore lint/suspicious/noExplicitAny: Fix this
			return render(props, { emit: emit as any })
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
			name,
			input
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
