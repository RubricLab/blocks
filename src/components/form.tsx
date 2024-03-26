import {db} from '~/utils/db'
import {Input, InputProps} from './input'

type Props = {
	table: keyof typeof db
	operation:
		| 'create'
		| 'delete'
		| 'deleteMany'
		| 'findMany'
		| 'findUnique'
		| 'update'
		| 'updateMany'
	fields: InputProps[]
}

export const Form = ({fields, table, operation}: Props) => {
	return (
		<form
			action={async (formData: FormData) => {
				'use server'
				const data = Object.fromEntries(formData)
				console.log(await db[table][operation]({data}))
			}}>
			{fields.map(field => (
				<Input
					key={field.name}
					field={field}
				/>
			))}
			<button type='submit'>Submit</button>
		</form>
	)
}
