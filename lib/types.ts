import type { ReactNode } from 'react'
import type z from 'zod/v4'
import type { REACT_NODE, stateful } from './utils'

export type Block<
	Input extends z.ZodType = z.ZodType,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
	Types extends Record<string, { input: z.ZodType }> = Record<string, { input: z.ZodType }>,
	TypeKeys extends keyof Types = any
> = {
	type: 'generic-block'
	schema: {
		input: z.ZodEnum<{
			[K in keyof Types]: K & string
		}>
		output: z.ZodNull
	}
	instantiate: <TypeKey extends TypeKeys>(typeKey: TypeKey) => Block<Types[TypeKey]['input']>
	description: string | undefined
	types: Types
}

export type GenericStatefulBlock<
	Types extends object,
	InstantiatedInput extends z.ZodType,
	InstantiatedOutput extends z.ZodType
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
	) => StatefulBlock<InstantiatedInput, InstantiatedOutput, z.infer<InstantiatedInput>>
	description: string | undefined
}

export type AnyBlock =
	| Block
	| StatefulBlock
	| GenericBlock
	| GenericStatefulBlock<object, z.ZodType, z.ZodType>
