import { custom } from '@rubriclab/shapes'
import { createElement, type ReactNode } from 'react'
import { type ZodEnum, type ZodType, z } from 'zod/v4'
import type { Block, GenericBlock, GenericStatefulBlock, StatefulBlock } from './types'

export const REACT_NODE = custom<ReactNode, 'ReactNode'>('ReactNode')

export function stateful<State extends ZodType>(state: State) {
	return z.tuple([state, REACT_NODE])
}

export function createBlockProxy<Name extends string, Input extends ZodType>({
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

export function createBlock<Input extends ZodType>({
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
	} satisfies Block<Input, z.infer<Input>>
}

export function createStatefulBlock<Input extends ZodType, Output extends ZodType>({
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
			return [
				(() => state) as typeof state,
				createElement(component, {
					emit: (emitted: typeof state) => {
						state = emitted
					}
				})
			]
		},
		schema: {
			input,
			output: stateful(output)
		},
		type: 'stateful-block' as const
	} satisfies StatefulBlock<Input, Output, z.infer<Input>>
}

export function createGenericBlock<
	Types extends Record<string, { input: ZodType }>,
	InstantiatedInput extends ZodType
>({
	types,
	getSchema,
	render,
	description
}: {
	types: Types

	getSchema: (typeKey: keyof Types) => {
		input: InstantiatedInput
	}
	render: (props: z.infer<InstantiatedInput>) => ReactNode
	description: string
}) {
	const input = z.enum(Object.fromEntries(Object.keys(types).map(k => [k, k]))) as ZodEnum<{
		[K in keyof Types]: K & string
	}>

	return {
		description,
		instantiate<TypeKey extends keyof Types>(typeKey: TypeKey) {
			return createBlock<Types[TypeKey]['input']>({
				description: '',
				render,
				schema: getSchema(typeKey)
			})
		},
		schema: {
			input,
			output: z.null()
		},
		type: 'generic-block' as const,
		types
	} satisfies GenericBlock<Types, keyof Types>
}

export function createGenericStatefulBlock<
	Types extends Record<string, { input: ZodType; output: ZodType }>,
	InstantiatedInput extends ZodType,
	InstantiatedOutput extends ZodType
>({
	types,
	getSchema,
	render,
	description
}: {
	types: Types
	getSchema: (typeKey: keyof Types) => {
		input: InstantiatedInput
		output: InstantiatedOutput
	}
	render: (props: z.infer<InstantiatedInput>) => {
		initialState: z.infer<InstantiatedOutput>
		component: ({ emit }: { emit: (value: z.infer<InstantiatedOutput>) => void }) => ReactNode
	}

	description: string
}) {
	const input = z.enum(Object.fromEntries(Object.keys(types).map(k => [k, k]))) as ZodEnum<{
		[K in keyof Types]: K & string
	}>
	return {
		description,
		instantiate<TypeKey extends keyof Types>(typeKey: TypeKey) {
			const block = createStatefulBlock<Types[TypeKey]['input'], Types[TypeKey]['output']>({
				description: '',
				render,
				schema: getSchema(typeKey)
			})
			return block
		},
		schema: {
			input,
			output: z.null()
		},
		type: 'generic-stateful-block' as const,
		types
	} satisfies GenericStatefulBlock<Types, keyof Types>
}
