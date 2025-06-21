import { Form } from '@/utils/components/ps';

export function render(this: { msg: string }, ctx: { side: string | null; turn: string | null; text: string[] }) {
	return (
		<>
			<div>{ctx.text.join(', ')}</div>
			{ctx.side === ctx.turn ? (
				<Form value={`${this.msg} ! {text}`}>
					<input name="text" />
					<button>Go!</button>
				</Form>
			) : null}
		</>
	);
}
