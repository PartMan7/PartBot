import { Button, Form } from '@/utils/components/ps';
import { repeat } from '@/utils/repeat';

import type { Mastermind } from '@/ps/games/mastermind/index';
import type { Guess, GuessResult, State } from '@/ps/games/mastermind/types';
import type { ReactElement } from 'react';

export function renderCloseSignups(this: Mastermind): ReactElement {
	const hasGuessed = this.state.board.length > 0;
	const player = Object.values(this.players)[0].name;
	return (
		<>
			<hr />
			{player} is playing a round of {this.meta.name}!
			<Button value={`${this.renderCtx.simpleMsg} watch ${this.id}`} style={{ marginLeft: 16 }}>
				Watch
			</Button>
			{this.setBy || !hasGuessed ? (
				<>
					<br />
					<br />
				</>
			) : null}
			{this.setBy ? (
				`${this.setBy.name} has set a code for ${player}.`
			) : !hasGuessed ? (
				<Form value={`${this.renderCtx.simpleMsg} audience {code}`}>
					<label htmlFor="choosecode">Set Code: </label>
					<input type="text" id="choosecode" name="code" style={{ width: 30 }} /> &nbsp;&nbsp;
					<input type="submit" value="Set" />
				</Form>
			) : null}
			<hr />
		</>
	);
}

const COLORS: { color: string; text: string; index: number }[] = [
	{ color: 'white', text: 'black', index: 0 },
	{ color: 'red', text: 'white', index: 1 },
	{ color: 'orange', text: 'black', index: 2 },
	{ color: 'yellow', text: 'black', index: 3 },
	{ color: 'green', text: 'white', index: 4 },
	{ color: 'blue', text: 'white', index: 5 },
	{ color: 'purple', text: 'white', index: 6 },
	{ color: 'pink', text: 'black', index: 7 },
];

const scale = 3.5;

type This = { msg: string; simpleMsg: string };
function Pin({ red, white }: { red?: boolean; white?: boolean }): ReactElement {
	return (
		<div
			style={{
				width: 3 * scale,
				height: 3 * scale,
				background: red ? '#e60000' : white ? 'white' : 'none',
				verticalAlign: 'middle',
				display: 'inline-block',
				borderRadius: '50%',
				border: red || white ? '0.5px solid black' : 'none',
				textAlign: 'center',
			}}
		>
			<div
				style={{
					height: '40%',
					width: '40%',
					top: '30%',
					left: '30%',
					borderRadius: '50%',
					border: 'none',
					background: red ? '#800000' : white ? '#b3b3b3' : '#4d4d4d',
					position: 'relative',
				}}
			/>
		</div>
	);
}
function Entry({ data }: { data: { guess: Guess; result: GuessResult } | null }): ReactElement {
	const entry = data
		? data.guess.map(num => (
				<div
					style={{
						display: 'inline-block',
						marginLeft: 2 * scale,
						marginRight: 2 * scale,
						width: 10 * scale,
						height: 10 * scale,
						borderRadius: '50%',
						color: COLORS[num].text,
						background: COLORS[num].color,
						fontWeight: 'bold',
						fontSize: '1.8em',
						textAlign: 'center',
						border: '1px solid black',
						position: 'relative',
						float: 'left',
					}}
				>
					{num}
				</div>
			))
		: repeat(
				<div
					style={{
						display: 'inline-block',
						margin: 2 * scale,
						width: 10 * scale,
						height: 10 * scale,
						borderRadius: '50%',
						background: 'none',
						verticalAlign: 'middle',
					}}
				>
					&nbsp;
				</div>,
				4
			);
	const result = data
		? [
				...repeat(<Pin red />, data.result.exact),
				...repeat(<Pin white />, data.result.moved),
				...repeat(<Pin />, 4 - data.result.exact - data.result.moved),
			]
		: repeat(<div style={{ width: 14 * scale, display: 'inlineBlock' }} />, 4);

	return (
		<>
			<div
				style={{
					display: 'inline-block',
					marginTop: 2 * scale,
					marginBottom: 2 * scale,
					height: 10 * scale,
					verticalAlign: 'middle',
					textAlign: 'left',
				}}
			>
				{entry}
			</div>
			<div style={{ display: 'inline-block', paddingLeft: 5, paddingRight: 5 }}>{result}</div>
		</>
	);
}
export function render(this: This, data: State, mode: 'playing' | 'over' | 'spectator'): ReactElement {
	return (
		<div style={{ marginLeft: 50, marginTop: 20 }}>
			<div
				style={{
					margin: 'auto',
					width: 76 * scale,
					background: '#222',
					border: '2px solid black',
					marginTop: 5,
					display: 'inline-block',
				}}
			>
				<div
					style={{
						marginLeft: 5 * scale,
						marginRight: 22 * scale,
						marginTop: 4 * scale,
						marginBottom: 4 * scale,
						background: '#111111',
						border: '1px solid black',
						fontSize: `${0.5 * scale}em`,
						fontWeight: 'bold',
						color: 'red',
						textAlign: 'center',
						display: 'table',
					}}
				>
					{repeat(
						<div
							style={{
								display: 'table-cell',
								width: 10 * scale,
								height: 10 * scale,
								marginLeft: 2 * scale,
								marginRight: 2 * scale,
								verticalAlign: 'middle',
							}}
						>
							?
						</div>,
						4
					)}
				</div>
				<hr style={{ color: 'black' }} />
				{[...data.board.map(entry => <Entry data={entry} />), ...repeat(<Entry data={null} />, data.cap - data.board.length)]
					.space(<hr style={{ color: 'black' }} />)
					.reverse()}
			</div>
			{mode !== 'spectator' ? (
				<div style={{ border: '1px solid', padding: 20, display: 'inline-block', verticalAlign: 'top' }}>
					{mode === 'over' ? (
						<Button value={`${this.simpleMsg} create ${data.cap}`}>Play Again</Button>
					) : (
						<Form value={`${this.simpleMsg} play {guess}`}>
							<input type="text" name="guess" placeholder="Your guess!" />
							<br />
							<br />
							<center>
								<input type="submit" value="Submit" />
							</center>
						</Form>
					)}
				</div>
			) : null}
		</div>
	);
}
