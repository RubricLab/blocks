import {ComponentProps} from 'react'
import * as Blocks from './components'

type BlockKeys = keyof typeof Blocks

interface BlockType<T extends BlockKeys> {
	type: T
	props: ComponentProps<(typeof Blocks)[T]>
}
export default function UI({blocks}: {blocks: BlockType<BlockKeys>[]}) {
	return <>{blocks.map(block => Blocks[block.type](block.props as any))}</>
}
