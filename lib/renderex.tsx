// // // const contactList = createList({})

// // // render({
// // // 	block: 'list',
// // // 	props: {
// // // 		getItems: {
// // // 			action: 'getContacts',
// // // 			props: {}
// // // 		},
// // // 		item: {
// // // 			block: 'card',
// // // 			props: {}
// // // 		}
// // // 	}
// // // })

// // /* ----------------------------------------------------------------  deps */
// // import { z } from 'zod'

// // /* ───────────────────────── 1 · ACTIONS ────────────────────────────────*/
// // type Action<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
// // 	schema: { input: I; output: O }
// // 	exec: (p: z.infer<I>) => z.infer<O> | Promise<z.infer<O>>
// // }
// // export const createAction = <I extends z.ZodTypeAny, O extends z.ZodTypeAny>(def: Action<I, O>) =>
// // 	def

// // type Param<A extends Record<string, Action<any, any>>, Expect> =
// // 	| Expect
// // 	| {
// // 			[K in keyof A]: z.infer<A[K]['schema']['output']> extends Expect ? Invocation<A, K> : never
// // 	  }[keyof A]

// // type Invocation<A extends Record<string, Action<any, any>>, K extends keyof A> = {
// // 	action: K
// // 	params: {
// // 		[P in keyof z.infer<A[K]['schema']['input']>]: Param<A, z.infer<A[K]['schema']['input']>[P]>
// // 	}
// // }

// // export const createExecutor = <A extends Record<string, Action<any, any>>>(a: A) => {
// // 	type Inv = Invocation<A, keyof A>

// // 	const run = async (n: Inv): Promise<any> => {
// // 		const { action, params } = n
// // 		const def = a[action]
// // 		const parsed: any = {}
// // 		for (const k in params) {
// // 			const v = (params as any)[k]
// // 			parsed[k] = v && typeof v === 'object' && 'action' in v ? await run(v) : v
// // 		}
// // 		return def.exec(def.schema.input.parse(parsed))
// // 	}

// // 	return { execute: run }
// // }

// // /* ───────────────────────── 2 · BLOCKS ────────────────────────────────*/
// // type BlockDesc<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
// // 	schema: I
// // 	output: O
// // 	render: (p: z.infer<I>, emit: (v: z.infer<O>) => void) => void
// // }

// // export const createBlock = <
// // 	Arg extends z.ZodTypeAny,
// // 	I extends z.ZodTypeAny,
// // 	O extends z.ZodTypeAny
// // >(
// // 	make: (arg: Arg) => BlockDesc<I, O>
// // ) => make

// // type Instantiated<D extends (...a: any) => BlockDesc<any, any>> = ReturnType<D>

// // type BlockInvoke<B, Expect> = B extends BlockDesc<infer I, infer O>
// // 	? z.infer<O> extends Expect
// // 		? { block: B; props: z.infer<I> }
// // 		: never
// // 	: never

// // export const createRenderer = <B extends Record<string, BlockDesc<any, any>>>(blocks: B) => {
// // 	const render = <K extends keyof B>(inv: { block: B[K]; props: z.infer<B[K]['schema']> }) => {
// // 		inv.block.render(inv.props, () => {})
// // 	}
// // 	return { render }
// // }

// // /* ───────────────────────── 3 · FULLSTACK ─────────────────────────────*/
// // type Value<B, A, E> =
// // 	| E
// // 	| ActionInvoke<A, E>
// // 	| BlockInvoke<B[keyof B], E>
// // 	| (E extends object ? { [K in keyof E]: Value<B, A, E[K]> } : never)

// // type ActionInvoke<A extends Record<string, Action<any, any>>, Expect> = {
// // 	[K in keyof A]: z.infer<A[K]['schema']['output']> extends Expect ? Invocation<A, K> : never
// // }[keyof A]

// // export const createFullstack = <
// // 	A extends Record<string, Action<any, any>>,
// // 	B extends Record<string, BlockDesc<any, any>>
// // >(
// // 	actions: A,
// // 	blocks: B
// // ) => {
// // 	type ParamsOf<K extends keyof A> = z.infer<A[K]['schema']['input']>

// // 	const exec = createExecutor(actions)
// // 	const rend = createRenderer(blocks)

// // 	const renderFullstack = async <K extends keyof A, P extends Value<B, A, ParamsOf<K>>>(plan: {
// // 		action: K
// // 		params: P
// // 	}) => {
// // 		// runtime: resolve nested action values
// // 		const resolved: any = {}
// // 		for (const k in plan.params) {
// // 			const v = (plan.params as any)[k]
// // 			resolved[k] = v && typeof v === 'object' && 'action' in v ? await exec.execute(v) : v
// // 		}
// // 		await exec.execute({ action: plan.action, params: resolved } as any)
// // 		// pretend render:
// // 		console.log('UI would render here')
// // 	}

// // 	return { renderFullstack }
// // }

// // /* ════════════════════  DEMO DOMAIN  ════════════════════════*/
// // // ---------- actions
// // const Contact = z.object({ id: z.string(), email: z.string() })

// // const getContacts = createAction({
// // 	schema: { input: z.object({}), output: z.array(Contact) },
// // 	exec: () => [{ id: '1', email: 'a@test.com' }]
// // })

// // const createContact = createAction({
// // 	schema: { input: Contact, output: Contact },
// // 	exec: async c => c
// // })

// // const actions = { getContacts, createContact }

// // // ---------- block factories
// // const list = createBlock(<T extends z.ZodTypeAny>(item: T) => ({
// // 	schema: z.object({ values: z.array(item) }),
// // 	output: item,
// // 	render: ({ values }, emit) => {
// // 		return (
// // 			<ul>
// // 				{values.map((v, i) => (
// // 					<li key={i}>{JSON.stringify(v)}</li>
// // 				))}
// // 			</ul>
// // 		)
// // 	}
// // }))
// // const card = createBlock(<T extends z.ZodTypeAny>(item: T) => ({
// // 	schema: item,
// // 	output: item,
// // 	render: p => {}
// // }))

// // const table = createBlock(<Row extends z.ZodTypeAny>(row: Row) => ({
// // 	schema: z.object({ rows: z.array(row) }),
// // 	output: z.void(),
// // 	render: p => {}
// // }))

// // // instantiate blocks
// // const ContactList = list(Contact)
// // const ContactCard = card(Contact)

// // // renderer registry
// // const blocks = { ContactList, ContactCard }

// // // ---------- fullstack
// // const { renderFullstack } = createFullstack(actions, blocks)

// // /* GOOD chain – compiles */
// // renderFullstack({
// // 	action: 'createContact',
// // 	params: {
// // 		block: ContactCard,
// // 		props: { id: 'tmp', email: 'draft@test.com' }
// // 	}
// // })

// // const Contact = z.object({
// //     id: z.string(),
// //     email: z.string(),
// //     title: z.string(),
// //     status: z.enum(['draft', 'published'])
// // })

// // const { renderFullstack } = createFullstack({
// //     getContacts,
// // }, {
// //     ContactList: list(Contact),
// //     ContactCard: card(Contact)
// // })

// // renderFullstack({
// // 	block: 'ContactList'
// //     props: {
// //         getItems: {
// //             action: 'getContacts',
// //             props: {}
// //         },
// //         item: {
// //             block: 'ContactCard',
// //             props: {
// //                 title: 'title',
// //                 content: ['email','status'],
// //             }
// //         }
// //     }
// // })

// // /* ---------------------------------------------------------- helpers */
// // import { z } from 'zod'
// // type Z<T> = z.ZodType<T> // shortcut

// // /* ---------------------------------------------------------- ACTIONS */
// // type Action<I, O> = {
// // 	schema: { input: Z<I>; output: Z<O> }
// // 	exec: (i: I) => Promise<O> | O
// // }
// // const createAction = <I, O>(a: Action<I, O>) => a

// // /* ---------------------------------------------------------- BLOCKS */
// // type Block<I, O> = {
// // 	schema: Z<I>
// // 	output: Z<O>
// // 	/* render : omitted */
// // }

// // /* 🏗️  generic factory */
// // const createBlock = <Arg, I, O>(maker: (arg: Arg) => Block<I, O>) => maker

// // /* ---------------------------------------------------------- 🪄 generic-slot magic */

// // /** Evaluate a Block factory with schema `S` to obtain its Output Zod type */
// // type Out<F, S> = F extends (s: S) => Block<any, infer O> ? O : never

// // /** A 'Value' can be: literal, nested action, or nested block -------------*/
// // type Value<
// // 	A extends Record<string, Action<any, any>>,
// // 	F extends Record<string, ReturnType<typeof createBlock>>,
// // 	Expect
// // > =
// // 	| Expect
// // 	| {
// // 			[K in keyof A]: z.infer<A[K]['schema']['output']> extends Expect
// // 				? { action: K; params: z.infer<A[K]['schema']['input']> }
// // 				: never
// // 	  }[keyof A]
// // 	| {
// // 			[K in keyof F]: z.infer<Out<F[K], any>> extends Expect
// // 				? { block: K; schema: any; props: any }
// // 				: never
// // 	  }[keyof F]

// // /* ---------------------------------------------------------- FACTORY DEMOS */

// // /* — card<Contact> emits Contact — */
// // const card = createBlock(<T extends Z<any>>(T) => ({
// // 	schema: z.object({ title: z.string(), content: z.array(z.string()) }),
// // 	output: T
// // }))

// // /* — list<Contact> emits void; consumes    */
// // /*      getItems: Contact[]                */
// // /*      item    : Block that emits Contact */
// // const list = createBlock(<T extends Z<any>>(T) => ({
// // 	schema: z.object({
// // 		getItems: z.any(), // filled in by Value<> later
// // 		item: z.any()
// // 	}),
// // 	output: z.void()
// // }))

// // /* ---------------------------------------------------------- DEV LAND  */

// // const Contact = z.object({ id: z.string(), email: z.string() })

// // // actions
// // const getContacts = createAction({
// // 	schema: { input: z.object({}), output: z.array(Contact) },
// // 	exec: async () => []
// // })
// // const createContact = createAction({
// // 	schema: { input: Contact, output: Contact },
// // 	exec: async x => x
// // })
// // const actions = { getContacts, createContact }

// // // blocks (instantiated)
// // const ContactCard = card(Contact)
// // const ContactList = list(Contact)
// // const blocks = { ContactCard, ContactList }

// // /* ---------------------------------------------------------- USAGE – the compiler checks slots 🎉 */

// // type Plan = {
// // 	block: 'ContactList'
// // 	schema: typeof Contact
// // 	props: {
// // 		getItems: Value<typeof actions, typeof blocks, z.infer<typeof Contact>[]> // Contact[]
// // 		item: Value<typeof actions, typeof blocks, z.infer<typeof Contact>> // Contact
// // 	}
// // }

// // /* ✅ compiles */
// // const good: Plan = {
// // 	block: 'ContactList',
// // 	schema: Contact,
// // 	props: {
// // 		getItems: { action: 'getContacts', params: {} },
// // 		item: { block: 'ContactCard', schema: Contact, props: { title: 't', content: ['email'] } }
// // 	}
// // }

// // /* ❌ ERROR – getItems returns number[] */
// // const bad: Plan = {
// // 	block: 'ContactList',
// // 	schema: Contact,
// // 	props: {
// // 		// @ts-expect-error
// // 		getItems: { action: 'createContact', params: { id: '1', email: 'x' } },
// // 		item: { block: 'ContactCard', schema: Contact, props: { title: 't', content: ['email'] } }
// // 	}
// // }

// // /* ------------------------------------------------ dependencies */
// // import { z } from 'zod'

// // /* ═══════════════════════════  ACTIONS  ══════════════════════════ */
// // type Action<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
// // 	schema: { input: I; output: O }
// // 	exec: (p: z.infer<I>) => z.infer<O> | Promise<z.infer<O>>
// // }

// // export const createAction = <I extends z.ZodTypeAny, O extends z.ZodTypeAny>(def: Action<I, O>) =>
// // 	def

// // /* recursive “param can be another action” helper */
// // type Param<A, Expect> =
// // 	| Expect
// // 	| {
// // 			[K in keyof A]: A[K] extends Action<any, infer Out>
// // 				? Out extends Expect
// // 					? Invocation<A, K>
// // 					: never
// // 				: never
// // 	  }[keyof A]

// // type Invocation<A, K extends keyof A> = A[K] extends Action<infer I, any>
// // 	? { action: K; params: { [P in keyof z.infer<I>]: Param<A, z.infer<I>[P]> } }
// // 	: never

// // export const createExecutor = <A extends Record<string, Action<any, any>>>(actions: A) => {
// // 	type Inv = Invocation<A, keyof A>

// // 	const run = async (node: Inv): Promise<any> => {
// // 		const { action, params } = node as any
// // 		const def = actions[action]
// // 		const resolved: any = {}
// // 		for (const [k, v] of Object.entries(params))
// // 			resolved[k] = v && typeof v === 'object' && 'action' in v ? await run(v as any) : v
// // 		return def.exec(def.schema.input.parse(resolved))
// // 	}

// // 	return { execute: run }
// // }

// // /* ═══════════════════════════  BLOCKS  ══════════════════════════ */
// // type BlockDesc<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
// // 	schema: I
// // 	output: O
// // 	render: (p: z.infer<I>, emit: (v: z.infer<O>) => void) => void
// // }

// // /* generic factory */
// // export const createBlockFactory = <Arg extends z.ZodTypeAny, I extends z.ZodTypeAny>(
// // 	make: (arg: Arg) => BlockDesc<I, Arg>
// // ) => {
// // 	return <S extends Arg>(schema: S) => make(schema) as BlockDesc<I, S>
// // }

// // /* registry entry keeps the descriptor & the display string key */
// // type BlockEntry<D extends BlockDesc<any, any>> = {
// // 	key: string
// // 	desc: D
// // }

// // type Registry = Record<string, BlockEntry<any>>

// // /* renderer with single-hop type safety */
// // export const createRenderer = <R extends Registry>(reg: R) => {
// // 	type Entry<K extends keyof R> = R[K]['desc']
// // 	const render = <K extends keyof R, Props extends z.infer<Entry<K>['schema']>>(inv: {
// // 		block: K
// // 		props: Props
// // 	}) => {
// // 		const { desc } = reg[inv.block]
// // 		const safe = desc.schema.parse(inv.props)
// // 		desc.render(safe, () => {})
// // 	}
// // 	return { render }
// // }

// // /* ═══════════════════════════  DEMO DOMAIN  ═════════════════════ */

// // /* 1. data schema */
// // const Contact = z.object({ id: z.string(), email: z.string() })

// // /* 2. actions */
// // const getContacts = createAction({
// // 	schema: { input: z.object({}), output: z.array(Contact) },
// // 	exec: () => [{ id: '1', email: 'a@test.com' }]
// // })
// // const createContact = createAction({
// // 	schema: { input: Contact, output: Contact },
// // 	exec: async c => c
// // })
// // const actions = { getContacts, createContact }
// // const { execute } = createExecutor(actions)

// // /* 3. block factories */
// // const list = createBlockFactory(<T extends z.ZodTypeAny>(item: T) => ({
// // 	schema: z.object({
// // 		values: z.array(item),
// // 		item: z.any() // another block/literal of ONE item
// // 	}),
// // 	output: item,
// // 	render: ({ values }) => console.log('render list with', values.length, 'items')
// // }))

// // const card = createBlockFactory(<T extends z.ZodTypeAny>(item: T) => ({
// // 	schema: z.object({ title: z.string(), content: z.array(z.string()) }),
// // 	output: item,
// // 	render: () => {}
// // }))

// // /* 4. instantiate concrete blocks */
// // const ContactList = list(Contact)
// // const ContactCard = card(Contact)

// // /* 5. registry with human-friendly keys */
// // const blocks = {
// // 	ContactList: { key: 'ContactList', desc: ContactList },
// // 	ContactCard: { key: 'ContactCard', desc: ContactCard }
// // } as const

// // const { render } = createRenderer(blocks)

// // /* ═══════════════════════════  GOOD PLAN  ═══════════════════════ */
// // render({
// // 	block: 'ContactList',
// // 	props: {
// // 		values: { action: 'getContacts', params: {} }, // ✅ emits Contact[]
// // 		item: { block: 'ContactCard', props: { title: 'Title', content: ['email'] } } // ✅ consumes Contact
// // 	}
// // })

// // /* ═══════════════════════════  BAD PLAN  – uncomment to see TS error ═══
// // render({
// //   block:'ContactList',
// //   props:{
// //     values:[42],                                           // ❌ number[] ≠ Contact[]
// //     item: { block:'ContactCard', props:{ title:'t', content:['id'] } }
// //   }
// // })
// // */

// // /* purely for completeness – run an action chain --------------------------------*/
// // execute({ action: 'createContact', params: { id: 'x', email: 'x@test.com' } }).then(r =>
// // 	console.log('action result', r)
// // )

// import { z } from 'zod'

// /*─────────────────────────────── 1 · ACTIONS ─────────────────────────────*/
// type Action<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
// 	schema: { input: I; output: O }
// 	exec: (p: z.infer<I>) => Promise<z.infer<O>> | z.infer<O>
// }
// export const createAction = <I extends z.ZodTypeAny, O extends z.ZodTypeAny>(d: Action<I, O>) => d

// /* Type helper: a parameter can be a literal or another action producing it */
// type Param<A extends Record<string, Action<any, any>>, Expect> =
// 	| Expect
// 	| {
// 			[K in keyof A]: z.infer<A[K]['schema']['output']> extends Expect ? Invocation<A, K> : never
// 	  }[keyof A]

// type Invocation<A extends Record<string, Action<any, any>>, K extends keyof A> = {
// 	action: K
// 	params: {
// 		[P in keyof z.infer<A[K]['schema']['input']>]: Param<A, z.infer<A[K]['schema']['input']>[P]>
// 	}
// }

// export const createExecutor = <A extends Record<string, Action<any, any>>>(actions: A) => {
// 	const run = async (node: Invocation<A, keyof A>): Promise<any> => {
// 		const { action, params } = node
// 		const d = actions[action]
// 		const parsed: any = {}
// 		for (const k in params) {
// 			const v = (params as any)[k]
// 			parsed[k] = v && typeof v === 'object' && 'action' in v ? await run(v) : v
// 		}
// 		return d.exec(d.schema.input.parse(parsed))
// 	}

// 	return { execute: run }
// }

// /*─────────────────────────────── 2 · BLOCKS ─────────────────────────────*/
// type BlockDesc<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
// 	schema: I
// 	output: O
// 	render: (p: z.infer<I>, emit: (v: z.infer<O>) => void) => void
// }

// /* factory: developer passes a Zod schema when *invoking* the block */
// export const createBlockFactory =
// 	<Arg extends z.ZodTypeAny, I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
// 		make: (arg: Arg) => BlockDesc<I, O>
// 	) =>
// 	<S extends Arg>(schema: S) =>
// 		make(schema) as BlockDesc<I, S>

// /*───────────────────────── 3 · RENDERER (blocks only) ───────────────────*/
// type Registry = Record<string, BlockDesc<any, any>>

// export const createRenderer = <R extends Registry>(reg: R) => {
// 	function render<K extends keyof R, Props extends z.infer<R[K]['schema']>>(inv: {
// 		block: K
// 		props: Props
// 	}) {
// 		const desc = reg[inv.block]
// 		const safe = desc.schema.parse(inv.props)
// 		desc.render(safe, () => {})
// 	}
// 	return { render }
// }

// /*────────────────────────── 4 · FULLSTACK GLUE  ─────────────────────────*/
// type Value<B extends Registry, A extends Record<string, Action<any, any>>, Expect> =
// 	| Expect
// 	| {
// 			[K in keyof A]: z.infer<A[K]['schema']['output']> extends Expect ? Invocation<A, K> : never
// 	  }[keyof A]
// 	| {
// 			[K in keyof B]: z.infer<B[K]['output']> extends Expect
// 				? { block: K; props: z.infer<B[K]['schema']> }
// 				: never
// 	  }[keyof B]

// export const createFullstack = <A extends Record<string, Action<any, any>>, B extends Registry>(
// 	actions: A,
// 	blocks: B
// ) => {
// 	const exec = createExecutor(actions)
// 	const rend = createRenderer(blocks)

// 	const renderFullstack = async <
// 		K extends keyof A,
// 		P extends Value<B, A, z.infer<A[K]['schema']['input']>>
// 	>(plan: { action: K; params: P }) => {
// 		const resolved: any = {}
// 		for (const k in plan.params) {
// 			const v = (plan.params as any)[k]
// 			resolved[k] = v && typeof v === 'object' && 'action' in v ? await exec.execute(v) : v
// 		}
// 		await exec.execute({ action: plan.action, params: resolved } as any)
// 		const uiBlock = plan.params as any
// 		if (uiBlock && 'block' in uiBlock) rend.render(uiBlock)
// 	}

// 	return { renderFullstack }
// }

// /*══════════════ 5 · DEMO DOMAIN  ══════════════*/
// // Zod entities
// const Contact = z.object({ id: z.string(), email: z.string() })

// // Actions
// const getContacts = createAction({
// 	schema: { input: z.object({}), output: z.array(Contact) },
// 	exec: async () => [{ id: '1', email: 'a@test.com' }]
// })

// const createContact = createAction({
// 	schema: { input: Contact, output: Contact },
// 	exec: async c => c
// })

// const actions = { getContacts, createContact }

// // Block factories
// const list = createBlockFactory(<T extends z.ZodTypeAny>(item: T) => ({
// 	schema: z.object({
// 		getItems: z.function().returns(z.array(item)), // not called here
// 		item: z.function().returns(item) // render callback sig.
// 	}),
// 	output: z.void(),
// 	render: () => {}
// }))

// const card = createBlockFactory(<T extends z.ZodTypeAny>(item: T) => ({
// 	schema: z.object({
// 		title: z.string(),
// 		content: z.array(z.string())
// 	}),
// 	output: item,
// 	render: () => {}
// }))

// // Instantiate blocks
// const ContactList = list(Contact)
// const ContactCard = card(Contact)

// // Registry literal
// const blocks = { ContactList, ContactCard } as const

// // Fullstack
// const { renderFullstack } = createFullstack(actions, blocks)

// /*══════════════ 6 · GOOD CALL  ══════════════*/
// renderFullstack({
// 	action: 'createContact',
// 	params: {
// 		block: 'ContactList',
// 		props: {
// 			getItems: async () => getContacts.exec({}), // literal fn returning Contact[]
// 			item: () => ({ id: '42', email: 'x@test.com' })
// 		}
// 	}
// })

// /*══════════════ 7 · BAD CALLS (uncomment to see TS errors) ═════════════*/
// // -- getItems returns numbers, incompatible with Contact[] ---
// // renderFullstack({
// //   action:'createContact',
// //   params:{
// //     block:'ContactList',
// //     props:{
// //       getItems: async () => [1,2,3],        // ❌ TS
// //       item: ()=>({ id:'x', email:'y' })
// //     }
// //   }
// // })

// // -- item returns a string, incompatible with Contact ---
// // renderFullstack({
// //   action:'createContact',
// //   params:{
// //     block:'ContactList',
// //     props:{
// //       getItems: async ()=>getContacts.exec({}),
// //       item: ()=>"hello"                      // ❌ TS
// //     }
// //   }
// // })
