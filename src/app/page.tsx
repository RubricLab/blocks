import UI from '~/ui'
import {db} from '~/utils/db'

export default async function Page() {
	return (
		<UI
			blocks={[
				{type: 'Heading', props: {text: 'GENUINE', strength: 1}},
				{
					type: 'Table',
					props: {
						headings: ['Name', 'Base URL'],
						rows: (await db.api.findMany({select: {name: true, baseUrl: true}})).map(
							api => [api.name, api.baseUrl]
						)
					}
				},
				{
					type: 'Form',
					props: {
						table: 'api',
						operation: 'create',
						fields: [
							{name: 'name', type: 'STRING'},
							{name: 'baseUrl', type: 'STRING'}
						]
					}
				}
			]}
		/>
	)
}
