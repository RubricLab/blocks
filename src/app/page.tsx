import {Form} from '~/components/form'
import {db} from '~/utils/db'

export default async function Page() {
	return (
		<div>
			<h1>genuine</h1>
			{(await db.api.findMany({select: {name: true}})).map(api => (
				<div key={api.name}> {api.name} </div>
			))}

			<Form
				table='api'
				operation='create'
				fields={[
					{name: 'name', type: 'STRING'},
					{name: 'baseUrl', type: 'STRING'}
				]}
			/>
		</div>
	)
}
