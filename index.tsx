import { custom } from "@rubriclab/chains/lib2/utils";
import type { ReactNode } from "react";
import z, { type ZodType } from "zod/v4";
import type { AnyBlock, Block, GenericBlock, StatefulBlock } from "./types";

const REACT_NODE = custom<ReactNode, "ReactNode">("ReactNode");

export function stateful<State extends z.ZodType>(state: State) {
	return z.tuple([state, REACT_NODE]);
}

export function createBlock<Input extends z.ZodType>({
	schema: { input },
	render,
	description,
}: {
	schema: { input: Input };
	render: (input: z.infer<Input>) => ReactNode;
	description: string | undefined;
}) {
	return {
		description,
		render,
		schema: { input, output: REACT_NODE },
		type: "block" as const,
	} satisfies Block<Input, z.infer<Input>>;
}

export function createStatefulBlock<
	Input extends z.ZodType,
	Output extends z.ZodType,
>({
	schema: { input, output },
	render,
	description,
}: {
	schema: {
		input: Input;
		output: Output;
	};
	render: (input: z.infer<Input>) => {
		initialState: z.infer<Output>;
		component: ({
			emit,
		}: {
			emit: (value: z.infer<Output>) => void;
		}) => ReactNode;
	};
	description: string | undefined;
}) {
	return {
		description,
		render: (input: z.infer<Input>) => {
			const { initialState, component: Component } = render(input);
			let state = initialState;
			return [
				(() => state) as typeof state,
				<Component
					emit={(emitted) => {
						state = emitted;
					}}
				/>,
			];
		},
		schema: {
			input,
			output: stateful(output),
		},
		type: "stateful-block" as const,
	} satisfies StatefulBlock<Input, Output, z.infer<Input>>;
}

export function createBlockProxy<Name extends string, Input extends z.ZodType>({
	name,
	input,
}: {
	name: Name;
	input: Input;
}) {
	return z.strictObject({
		block: z.literal(name),
		props: input,
	});
}

export function createGenericBlock<
	Types extends Record<string, { input: z.ZodType }>,
>({
	types,
	render,
	description,
}: {
	types: Types;
	render: <K extends keyof Types>(
		props: z.infer<Types[K]["input"]>,
	) => ReactNode;
	description: string;
}) {
	const input = z.enum(
		Object.fromEntries(Object.keys(types).map((k) => [k, k])),
	) as z.ZodEnum<{
		[K in keyof Types]: K & string;
	}>;

	return {
		description,
		instantiate<TypeKey extends keyof Types>(typeKey: TypeKey) {
			const type = types[typeKey];
			if (!type) throw "bad block";
			const block = createBlock<Types[TypeKey]["input"]>({
				description: "",
				render,
				schema: type,
			});

			return block;
		},
		schema: {
			input,
			output: z.null(),
		},
		type: "generic-block" as const,
		types,
	} satisfies GenericBlock<Types, Types>;
}

export function createGenericStatefulBlock<
	Types extends Record<string, { input: z.ZodType; output: z.ZodType }>,
	InstantiatedInput extends ZodType,
	InstantiatedOutput extends ZodType,
>({
	types,
	getSchema,
	render,
	description,
}: {
	types: Types;
	render: (props: z.infer<InstantiatedInput>) => {
		initialState: z.infer<InstantiatedOutput>;
		component: ({
			emit,
		}: {
			emit: (value: z.infer<InstantiatedOutput>) => void;
		}) => ReactNode;
	};
	getSchema: <TypeKey extends keyof Types>(
		typeKey: TypeKey,
	) => { input: InstantiatedInput; output: InstantiatedOutput };

	description: string;
}) {
	return {
		description,
		instantiate<TypeKey extends keyof Types>(typeKey: TypeKey) {
			const schema = getSchema(typeKey);
			const block = createStatefulBlock<
				(typeof schema)["input"],
				(typeof schema)["output"]
			>({
				description: "",
				render,
				schema,
			});
			return block;
		},
		schema: {
			input: z.enum(
				Object.fromEntries(Object.keys(types).map((k) => [k, k])),
			) as z.ZodEnum<{
				[K in keyof Types]: K & string;
			}>,
			output: z.null(),
		},
		type: "generic-stateful-block" as const,
	};
}

type StaticKeys<BM> = {
	[K in keyof BM]: BM[K] extends Block ? K : never;
}[keyof BM];
type StatefulKeys<BM> = {
	[K in keyof BM]: BM[K] extends StatefulBlock ? K : never;
}[keyof BM];
type GenericKeys<BM> = {
	[K in keyof BM]: BM[K] extends GenericBlock<infer _Types, infer Types>
		? `${K & string}<${keyof Types & string}>`
		: never;
}[keyof BM];

export function createBlockRenderer<BM extends Record<string, AnyBlock>>({
	blocks,
}: {
	blocks: BM;
}) {
	type SK = StaticKeys<BM>;
	type STK = StatefulKeys<BM>;
	type GK = GenericKeys<BM>;
	type BlockKey = SK | STK | GK;

	type PropsFor<K extends BlockKey> = K extends SK
		? z.infer<BM[K]["schema"]["input"]>
		: K extends STK
			? z.infer<BM[K]["schema"]["input"]>
			: K extends `${infer B}<${infer I}>`
				? BM[B] extends GenericBlock<any, any>
					? z.infer<BM[B]["types"][I]["input"]>
					: never
				: never;

	type ReturnFor<K extends BlockKey> = K extends SK
		? ReturnType<BM[K] extends Block ? BM[K]["render"] : never>
		: K extends STK
			? ReturnType<BM[K] extends StatefulBlock ? BM[K]["render"] : never>
			: K extends `${infer B}<${infer I}>`
				? BM[B] extends GenericBlock<infer _Types, infer Types>
					? ReturnType<
							Block<
								BM[B]["types"][I]["input"],
								z.infer<BM[B]["types"][I]["input"]>
							>["render"]
						>
					: never
				: never;

	function _render<K extends BlockKey>(opts: {
		block: K;
		props: PropsFor<K>;
	}): ReturnFor<K> {
		const { block, props } = opts;
		const match = (block as string).match(/^([^<]+)<([^>]+)>$/);

		if (match) {
			const [, outer, inner] = match;
			console.log({ inner, outer });

			if (!outer || !inner) throw "shit";

			return (blocks[outer] as GenericBlock<any, any>)
				.instantiate(inner)
				.render(props) as ReturnFor<K>;
		}

		const b = (blocks as any)[block];
		return b.render(props);

		// return b.render(b.schema.input.parse(props));
	}

	return { render: _render, t: undefined as unknown as BM };
}

export function createBlocksDocs<BlocksMap extends Record<string, AnyBlock>>({
	blocks,
}: {
	blocks: BlocksMap;
}) {
	return Object.entries(blocks)
		.map(
			([
				name,
				{
					schema: { input, output },
					description,
				},
			]) => `## ${String(name)}
### Description:
${description ?? "No description provided"}
### Input Schema:
${JSON.stringify(
	z.toJSONSchema(
		createBlockProxy({
			input,
			name,
		}),
		{ unrepresentable: "any" },
	),
	null,
	2,
)}
### Output Schema:
${JSON.stringify(z.toJSONSchema(output, { unrepresentable: "any" }), null, 2)}`,
		)
		.join("\n\n");
}
