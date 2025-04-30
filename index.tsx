import { createHash } from 'node:crypto'
import type React from 'react'
import { type ReactNode, useState } from 'react'
import { z } from 'zod'

// biome-ignore lint/suspicious/noExplicitAny: single required "any" to not overwhelm generics
type BlockDefinition<In extends z.ZodRawShape = any, Out extends z.ZodTypeAny = any> = {
	schema: { input: z.ZodObject<In>; output: Out }
	render: (arg0: z.infer<z.ZodObject<In>>, arg1: { emit: (v: z.infer<Out>) => void }) => ReactNode
}

export type AnyBlocks = Record<string, BlockDefinition>

export function createBlock<In extends z.ZodRawShape, Out extends z.ZodTypeAny>(def: {
	schema: { input: z.ZodObject<In>; output: Out }
	render: (arg0: z.infer<z.ZodObject<In>>, arg1: { emit: (v: z.infer<Out>) => void }) => ReactNode
}): BlockDefinition<In, Out> {
	return def
}

const shortHash = (str: string) => createHash('sha1').update(str).digest('hex').slice(0, 8)
const stableName = (schema: z.ZodTypeAny) => `Schema_${shortHash(generateSignature(schema))}`
const stableDescribe = (schema: z.ZodTypeAny) =>
	schema._def.description ? schema : schema.describe(stableName(schema))

function makeNonEmptyUnion(schemas: z.ZodTypeAny[]) {
	if (!schemas.length) throw new Error('No schemas')
	return schemas.length === 1
		? (schemas[0] ?? (undefined as never))
		: z.union(schemas as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]])
}

function generateSignature(schema: z.ZodTypeAny): string {
	const def = schema?._def
	if (!def) return 'unknown'
	switch (def.typeName) {
		case z.ZodFirstPartyTypeKind.ZodString:
			return 'string'
		case z.ZodFirstPartyTypeKind.ZodNumber:
			return 'number'
		case z.ZodFirstPartyTypeKind.ZodBoolean:
			return 'boolean'
		case z.ZodFirstPartyTypeKind.ZodLiteral:
			return `literal_${JSON.stringify(def.value)}`
		case z.ZodFirstPartyTypeKind.ZodVoid:
			return 'void'
		case z.ZodFirstPartyTypeKind.ZodObject: {
			const shape = def.shape()
			const entries = Object.entries(shape)
				.map(([k, v]) => `${k}-${generateSignature(v as z.ZodTypeAny)}`)
				.sort()
			return `object_${entries.join('_')}`
		}
		case z.ZodFirstPartyTypeKind.ZodUnion:
			return `union_${(def.options as z.ZodTypeAny[]).map(generateSignature).sort().join('_or_')}`
		case z.ZodFirstPartyTypeKind.ZodEnum:
			return `enum_${def.values.sort().join('_')}`
		case z.ZodFirstPartyTypeKind.ZodArray:
			return `array_${generateSignature(def.type)}`
		case z.ZodFirstPartyTypeKind.ZodNativeEnum:
			return `native_enum_${Object.values(def.values).sort().join('_')}`
		default:
			return 'unknown'
	}
}

export function zodToJsonSchema(zodType: z.ZodTypeAny): unknown {
	const def = zodType?._def
	if (!def) return { type: 'unknown' }
	switch (def.typeName) {
		case z.ZodFirstPartyTypeKind.ZodString:
			return { type: 'string' }
		case z.ZodFirstPartyTypeKind.ZodNumber:
			return { type: 'number' }
		case z.ZodFirstPartyTypeKind.ZodBoolean:
			return { type: 'boolean' }
		case z.ZodFirstPartyTypeKind.ZodLiteral:
			return { type: typeof def.value, const: def.value }
		case z.ZodFirstPartyTypeKind.ZodVoid:
			return { type: 'null', description: 'Represents void/no return value' }
		case z.ZodFirstPartyTypeKind.ZodObject: {
			const shape = def.shape()
			const props: Record<string, unknown> = {}
			const req: string[] = []
			Object.entries(shape).map(([k, v]) => {
				props[k] = zodToJsonSchema(v as z.ZodTypeAny)
				req.push(k)
			})
			return { type: 'object', properties: props, required: req, additionalProperties: false }
		}
		case z.ZodFirstPartyTypeKind.ZodUnion: {
			const unionDef = def as z.ZodUnionDef
			return { anyOf: unionDef.options.map((opt: z.ZodTypeAny) => zodToJsonSchema(opt)) }
		}
		case z.ZodFirstPartyTypeKind.ZodEnum:
			return { type: 'string', enum: def.values }
		case z.ZodFirstPartyTypeKind.ZodArray:
			return { type: 'array', items: zodToJsonSchema(def.type) }
		case z.ZodFirstPartyTypeKind.ZodNativeEnum:
			return { type: 'string', enum: Object.values(def.values) }
		case z.ZodFirstPartyTypeKind.ZodOptional:
			return zodToJsonSchema(def.innerType)
		case z.ZodFirstPartyTypeKind.ZodDate:
			return { type: 'string', format: 'date-time' }
		case z.ZodFirstPartyTypeKind.ZodDefault:
			return zodToJsonSchema(def.innerType)
		case z.ZodFirstPartyTypeKind.ZodNullable:
			return zodToJsonSchema(def.innerType)
		default:
			throw `Should not see this. This is a blocks package error. Unknown type: ${def.typeName}`
	}
}

type InputOfBlock<B> = B extends BlockDefinition<infer S> ? z.infer<z.ZodObject<S>> : never
type OutputOfBlock<B> = B extends BlockDefinition<infer _, infer O> ? z.infer<O> : never

export type BlockInvocation<Blocks extends AnyBlocks, Name extends keyof Blocks> = {
	block: Name
	props: {
		[P in keyof InputOfBlock<Blocks[Name]>]:
			| InputOfBlock<Blocks[Name]>[P]
			| BlockChain<Blocks, InputOfBlock<Blocks[Name]>[P]>
	}
}

export type BlockChain<Blocks extends AnyBlocks, ExpectedOutput = unknown> = {
	[K in keyof Blocks]: OutputOfBlock<Blocks[K]> extends ExpectedOutput
		? BlockInvocation<Blocks, K>
		: never
}[keyof Blocks]

export type OutputOfBlockChain<
	Blocks extends AnyBlocks,
	Chain extends BlockChain<Blocks>
> = Chain extends BlockInvocation<Blocks, infer N> ? OutputOfBlock<Blocks[N]> : never

function makeCustomResponseFormat<ParsedT>(
	jsonSchema: Record<string, unknown>,
	parser: (c: string) => ParsedT
) {
	const openAIFormat = {
		type: 'json_schema' as const,
		name: 'ui_format',
		schema: jsonSchema
	}

	Object.defineProperties(openAIFormat, {
		$brand: { value: 'auto-parseable-response-format', enumerable: false },
		$parseRaw: { value: parser, enumerable: false }
	})

	return openAIFormat
}

export function createBlocksRenderer<Blocks extends AnyBlocks>(blocks: Blocks) {
	const blocksByOutputName: Record<string, string[]> = {}
	Object.entries(blocks).map(([name, block]) => {
		const outName = stableName(block.schema.output)
		if (!blocksByOutputName[outName]) blocksByOutputName[outName] = []
		blocksByOutputName[outName].push(name)
	})

	const blockSchemas: Record<string, z.ZodTypeAny> = {}

	const paramSchemaForType = (paramSchema: z.ZodTypeAny): z.ZodTypeAny => {
		const outName = stableName(paramSchema)
		const acts = (blocksByOutputName[outName] ?? [])
			.map(n => blockSchemas[n])
			.filter((x): x is z.ZodTypeAny => !!x)
		return stableDescribe(
			acts.length
				? z.union([paramSchema, ...acts] as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]])
				: paramSchema
		)
	}

	const blockSchemaBuilders: Record<string, () => z.ZodTypeAny> = {}
	Object.entries(blocks).map(([name, block]) => {
		blockSchemaBuilders[name] = () => {
			const shape = block.schema.input.shape
			const propsShape: Record<string, z.ZodTypeAny> = {}
			for (const key in shape) propsShape[key] = paramSchemaForType(shape[key])
			return z.object({ block: z.literal(name), props: z.object(propsShape).strict() })
		}
	})

	Object.keys(blocks).map(name => {
		blockSchemas[name] = z.lazy(blockSchemaBuilders[name] ?? (undefined as never))
	})

	const BlockUnion = z.lazy(() => stableDescribe(makeNonEmptyUnion(Object.values(blockSchemas))))
	const schemaBase = z.object({ ui: BlockUnion }).strict()
	const schema = schemaBase as z.ZodType<{ ui: z.infer<typeof BlockUnion> }>

	type AnyInvocation = BlockInvocation<Blocks, keyof Blocks>

	const InvocationComponent: React.FC<{
		invocation: AnyInvocation
		onEmit?: (v: unknown) => void
	}> = ({ invocation, onEmit }) => {
		const { block: blockName, props } = invocation as BlockInvocation<Blocks, keyof Blocks>
		const blockDef = blocks[blockName]
		if (!blockDef) return null

		const resolvedProps: Record<string, unknown> = {}
		const children: ReactNode[] = []

		Object.entries(props).map(([key, value]) => {
			if (value && typeof value === 'object' && 'block' in value) {
				const ChildInvocation = value as AnyInvocation
				const [childVal, setChildVal] = useState<unknown>()
				resolvedProps[key] = childVal as unknown
				children.push(
					<InvocationComponent
						key={`${String(blockName)}-${key}`}
						invocation={ChildInvocation}
						onEmit={setChildVal}
					/>
				)
			} else {
				resolvedProps[key] = value as unknown
			}
		})

		return (
			<>
				{blockDef.render(resolvedProps as never, { emit: onEmit ?? (() => {}) })}
				{/* Render any nested invocation components */}
				{children}
			</>
		)
	}

	function render<Chain extends BlockChain<Blocks>>(
		invocation: Chain,
		onEmit?: (v: OutputOfBlockChain<Blocks, Chain>) => void
	): ReactNode {
		return (
			<InvocationComponent
				invocation={invocation as AnyInvocation}
				onEmit={onEmit as (v: unknown) => void}
			/>
		)
	}

	async function getBlockSchema<K extends keyof Blocks>(
		blockName: K
	): Promise<Blocks[K]['schema']['input']['shape']> {
		const block = blocks[blockName]
		if (!block) throw new Error(`Unknown block: ${String(blockName)}`)
		const { shape } = block.schema.input
		return JSON.parse(JSON.stringify(shape))
	}

	async function getBlockNames(): Promise<Array<keyof Blocks>> {
		return Object.keys(blocks)
	}

	const definitions: Record<string, unknown> = {}
	const ensureOutputDefinition = (schema: z.ZodTypeAny) => {
		const name = stableName(schema)
		if (!definitions[name]) definitions[name] = zodToJsonSchema(schema)
		return name
	}

	Object.values(blocks).map(b => ensureOutputDefinition(b.schema.output))

	const paramToJsonSchema = (paramSchema: z.ZodTypeAny) => {
		const outName = stableName(paramSchema)
		const base = zodToJsonSchema(paramSchema)
		const refs = (blocksByOutputName[outName] ?? []).map(bName => ({
			$ref: `#/definitions/${bName}Block`
		}))
		return refs.length ? { anyOf: [base, ...refs] } : base
	}

	Object.entries(blocks).map(([blockName, block]) => {
		const shape = block.schema.input.shape
		const props: Record<string, unknown> = {}
		const req: string[] = []
		for (const key in shape) {
			props[key] = paramToJsonSchema(shape[key])
			req.push(key)
		}
		definitions[`${blockName}Block`] = {
			type: 'object',
			properties: {
				block: { type: 'string', const: blockName },
				props: { type: 'object', properties: props, required: req, additionalProperties: false }
			},
			required: ['block', 'props'],
			additionalProperties: false
		}
	})

	const blockUnion = {
		anyOf: Object.keys(blocks).map(bName => ({ $ref: `#/definitions/${bName}Block` }))
	}

	const jsonSchema = {
		$schema: 'http://json-schema.org/draft-07/schema#',
		type: 'object',
		properties: { ui: blockUnion },
		required: ['ui'],
		additionalProperties: false,
		definitions
	}

	const response_format = makeCustomResponseFormat<z.infer<typeof schema>>(jsonSchema, c =>
		schema.parse(JSON.parse(c))
	)

	return { render, getBlockSchema, getBlockNames, schema, response_format }
}
