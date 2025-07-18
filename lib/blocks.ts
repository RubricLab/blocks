import z from 'zod/v4'
import type { AnyBlock, Block, GenericBlock, StatefulBlock } from './types'
import { createBlockProxy } from './utils'

type StaticKeys<BM> = {
	[K in keyof BM]: BM[K] extends Block ? K : never
}[keyof BM]

type StatefulKeys<BM> = {
	[K in keyof BM]: BM[K] extends StatefulBlock ? K : never
}[keyof BM]

type GenericKeys<BM> = {
	[K in keyof BM]: BM[K] extends GenericBlock<infer Types>
		? `${K & string}<${keyof Types & string}>`
		: never
}[keyof BM]

export function createBlockRenderer<BM extends Record<string, AnyBlock>>({
	blocks
}: {
	blocks: BM
}) {
	type SK = StaticKeys<BM>
	type STK = StatefulKeys<BM>
	type GK = GenericKeys<BM>
	type BlockKey = SK | STK | GK

	type PropsFor<K extends BlockKey> = K extends SK
		? z.infer<BM[K]['schema']['input']>
		: K extends STK
			? z.infer<BM[K]['schema']['input']>
			: K extends `${infer B}<${infer I}>`
				? BM[B] extends GenericBlock
					? z.infer<BM[B]['types'][I]['input']>
					: never
				: never

	type ReturnFor<K extends BlockKey> = K extends SK
		? ReturnType<BM[K] extends Block ? BM[K]['render'] : never>
		: K extends STK
			? ReturnType<BM[K] extends StatefulBlock ? BM[K]['render'] : never>
			: K extends `${infer B}<${infer I}>`
				? BM[B] extends GenericBlock
					? ReturnType<Block<BM[B]['types'][I]['input'], z.infer<BM[B]['types'][I]['input']>>['render']>
					: never
				: never

	function render<K extends BlockKey>(opts: { block: K; props: PropsFor<K> }): ReturnFor<K> {
		const { block, props } = opts
		const match = (block as string).match(/^([^<]+)<([^>]+)>$/)

		if (match) {
			const [, outer, inner] = match
			console.log({ inner, outer })

			if (!outer || !inner) throw 'shit'

			return (blocks[outer] as GenericBlock).instantiate(inner).render(props) as ReturnFor<K>
		}

		const b = (blocks as any)[block]
		return b.render(props)

		// return b.render(b.schema.input.parse(props));
	}
	return { render }
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
		}),
		{ unrepresentable: 'any' }
	),
	null,
	2
)}
### Output Schema:
${JSON.stringify(z.toJSONSchema(output, { unrepresentable: 'any' }), null, 2)}`
		)
		.join('\n\n')
}
