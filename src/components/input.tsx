import {type} from 'prisma/prisma-client'

export type InputProps = {
	name: string
	type: type
	value?: any
}

export const Input = ({field}: {field: InputProps}) => {
	return (
		<label htmlFor={field.name}>
			<input
				type={
					field.type === 'BOOLEAN'
						? 'checkbox'
						: field.type === 'NUMBER'
							? 'number'
							: 'text'
				}
				defaultValue={field.value || undefined}
				name={field.name}
			/>
		</label>
	)
}
