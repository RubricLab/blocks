import type { ReactNode } from 'react'
import type z from 'zod/v4'
import type { stateful } from '.'
import type { REACT_NODE } from './utils'

export type Block<
	Input extends z.ZodType = z.ZodType,
	// biome-ignore lint/suspicious/noExplicitAny: need this for some reason
	InferredInput extends z.infer<Input> = any
> = {
	type: 'block'
	description: string | undefined
	schema: { input: Input; output: typeof REACT_NODE }
	render: (input: InferredInput) => ReactNode
}

export type StatefulBlock<
	Input extends z.ZodType = z.ZodType,
	Output extends z.ZodType = z.ZodType,
	// biome-ignore lint/suspicious/noExplicitAny: need this for some reason
	InferredInput extends z.infer<Input> = any
> = {
	type: 'stateful-block'
	description: string | undefined
	schema: {
		input: Input
		output: ReturnType<typeof stateful<Output>>
	}
	render: (input: InferredInput) => z.infer<ReturnType<typeof stateful<Output>>>
}

export type GenericBlock<
	_Types extends object,
	Types extends Record<keyof _Types, { input: z.ZodType }>
> = {
	type: 'generic-block'
	schema: {
		input: z.ZodEnum<{
			[K in keyof Types]: K & string
		}>
		output: z.ZodNull
	}
	// biome-ignore lint/suspicious/noExplicitAny: need this for some reason
	instantiate: <TypeKey extends keyof Types>(typeKey: any) => Block<Types[TypeKey]['input']>
	description: string | undefined
	types: Types
}

export type GenericStatefulBlock<
	Types extends object = object,
	InstantiatedInput extends z.ZodType = z.ZodType,
	InstantiatedOutput extends z.ZodType = z.ZodType,
	// biome-ignore lint/suspicious/noExplicitAny: need this for some reason
	InferredInstantiatedInput extends z.infer<InstantiatedInput> = any
> = {
	type: 'generic-stateful-block'
	schema: {
		input: z.ZodEnum<{
			[K in keyof Types]: K & string
		}>
		output: z.ZodNull
	}
	instantiate: <TypeKey extends keyof Types>(
		typeKey: TypeKey
	) => StatefulBlock<InstantiatedInput, InstantiatedOutput, InferredInstantiatedInput>
	description: string | undefined
}

export type AnyBlock =
	| Block
	| StatefulBlock
	| GenericBlock<Record<string, { input: z.ZodType }>, Record<string, { input: z.ZodType }>>
	| GenericStatefulBlock
