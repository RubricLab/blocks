import { db } from "~/utils/db"

export default async function Page() {
	return <div>
		<h1>genuine</h1>
		{(await db.api.findMany({select: {name: true}})).map(api => <div key={api.name}> {api.name} </div>)}

		<form action={
			async (formData: FormData) => {
				'use server'
				const { name, baseUrl } = Object.fromEntries(formData) as {name: string, baseUrl: string}
				console.log('submit')
				await db.api.create({data: {name, baseUrl}})
			}
		}>
			<input type='text' name='name' placeholder="name" />
			<input type='text' name='baseUrl' placeholder="baseUrl" />
			<button type='submit'>Submit</button>
		</form>
	</div>
}
