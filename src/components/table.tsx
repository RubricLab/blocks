export function Table({
	headings,
	rows
}: {
	headings: string[]
	rows: string[][]
}) {
	return (
		<table>
			<thead>
				<tr>
					{headings.map(heading => (
						<th key={heading}>{heading}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map(row => (
					<tr key={row.join()}>
						{row.map(cell => (
							<td key={cell}>{cell}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	)
}
