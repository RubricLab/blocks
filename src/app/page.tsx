import UI from '~/ui'
import {db} from '~/utils/db'

export default async function Page() {
	return (
		<div>
			<h1>genuine</h1>
			{(await db.api.findMany({select: {name: true}})).map(api => (
				<div key={api.name}> {api.name} </div>
			))}

			<UI blocks={[
				{type: 'Form', props: {table: 'api', operation: 'create', fields: 
					[
						{name: 'name', type: 'STRING'},
						{name: 'baseUrl', type: 'STRING'}
					]
				}}
			]}/>
		</div>
	)
}
