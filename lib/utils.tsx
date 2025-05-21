import type { ReactNode } from 'react'
import React from 'react'
import { z } from 'zod'

function createBlock<T extends z.AnyZodObject>(config: {
	schema: T
	render: (args: z.infer<T>) => ReactNode
}) {
	return config
}

function CreateList<Item extends z.AnyZodObject>(item: Item) {
	return createBlock({
		schema: z.object({
			items: z.array(item),
			search: z.function().args(z.string()).returns(z.array(item)),
			create: z.function().args(item).returns(z.void()),
			child: z.function().args(item).returns(z.void())
		}),
		render: ({ items, create, search, child }) => (
			<div>
				{items.map((item, index) => (
					<div key={index}>{child(item)}</div>
				))}
			</div>
		)
	})
}

function CreateCard<Item extends z.AnyZodObject>(item: Item) {
	return createBlock({
		schema: z.object({
			item: item,
			title: z.enum(Object.keys(item) as [string, ...string[]])
		}),
		render: ({ item, title }) => <div>{item?.[title]}</div>
	})
}

const List = CreateList(
	z.object({
		name: z.string(),
		title: z.string(),
		status: z.enum(['active', 'inactive'])
	})
)

const Card = CreateCard(
	z.object({
		name: z.string(),
		title: z.string(),
		status: z.enum(['active', 'inactive'])
	})
)

List.render({
	items: [
		{
			name: 'John Doe',
			title: 'Software Engineer',
			status: 'active'
		}
	],
	create: (name, title, status) => '',
	search: () => [],
	child: ({ name, title, status }) => Card.render({ item: { name, title, status }, title: 'name' })
})
