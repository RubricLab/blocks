import {type} from 'prisma/prisma-client'

export type InputProps = {
	name: string
	type: type
}

export const Input = ({field}: {field: InputProps}) => {
	return (
		<label htmlFor={field.name}>
			{field.type === 'BOOLEAN' ? (
				<input
					type='checkbox'
					name={field.name}
				/>
			) : field.type === 'NUMBER' ? (
				<input
					type='number'
					name={field.name}
				/>
			) : field.type === 'STRING' ? (
				<input
					type='text'
					name={field.name}
				/>
			) : (
				<div> {field.name} </div>
			)}
		</label>
	)
}
