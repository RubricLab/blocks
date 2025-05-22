import type { ReactNode } from 'react'
import z from 'zod/v4'

export function createBlock<
	I extends Record<string, z.ZodType>,
	O extends z.ZodType
	// AdditionalOptions extends Record<string, unknown> = never
>({
	schema,
	render
}: {
	schema: { input: I; output: O }
	render: (
		input: { [K in keyof I]: z.infer<I[K]> },
		{ emit }: { emit: (output: z.infer<O>) => void }
		// & AdditionalOptions
	) => ReactNode
}) {
	return {
		type: 'block' as const,
		schema,
		render
	}
}

export type AnyBlock = ReturnType<typeof createBlock<Record<string, z.ZodType>, z.ZodType>>

export type BlockMap = Record<string, AnyBlock>

export function createBlockProxy<Name extends string, Block extends AnyBlock>({
	name,
	input
}: {
	name: Name
	input: Block['schema']['input']
}) {
	return z.strictObject({
		block: z.literal(`block_${name}` as const),
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

export function createGenericActionExecutorBlock<
	ActionOptions extends Record<string, Omit<AnyAction, 'execute'>>,
	ChildrenOptions extends z.ZodUnion
>({
	actionOptions,
	instantiate
}: {
	actionOptions: ActionOptions
	instantiate: <ActionKey extends keyof ActionOptions>({
		action
	}: {
		action: ActionKey
	}) => ReturnType<
		typeof createBlock<
			{
				inputs: z.ZodObject<ActionOptions[keyof ActionOptions]['schema']['input']>
				onExecute: z.ZodArray<ChildrenOptions>
			},
			z.ZodVoid
		>
	>
}) {
	type Keys = keyof ActionOptions & string
	const keys = Object.keys(actionOptions) as Keys[]

	return {
		type: 'action' as const,
		schema: {
			input: {
				action: z.enum(keys)
			},
			output: z.void()
		},
		execute: async ({ action }: { action: Keys }) => {
			return instantiate({ action })
		}
	}
}

export function createGenericActionMapperBlock<ActionOptions extends Record<string, z.ZodType>>() {}
