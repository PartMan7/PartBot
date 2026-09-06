import { getMsg } from '@/ps/games/game';
import { GameHeader, LogEntry } from '@/ps/games/render';
import {
	ACTIONS,
	AllTokenTypes,
	MAX_TOKEN_COUNT,
	POST_TURN_ACTIONS,
	TOKEN_TYPE,
	TokenTypes,
	VIEW_ACTION_TYPE,
} from '@/ps/games/splendor/constants';
import metadata from '@/ps/games/splendor/metadata.json';
import { isAprilFoolsActive } from '@/ps/specialEvents';
import { Username } from '@/utils/components';
import { Button, Form } from '@/utils/components/ps';
import { Logger } from '@/utils/logger';

import type { TranslatedText, TranslationFn } from '@/i18n/types';
import type { Splendor } from '@/ps/games/splendor';
import type { Log } from '@/ps/games/splendor/logs';
import type { Board, Card, PlayerData, RenderCtx, TokenCount, Trainer, ViewType } from '@/ps/games/splendor/types';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

function getArtUrl(
	type: 'pokemon' | 'pokemon-afd' | 'trainers' | 'type' | 'other',
	path: string,
	tag: 'img' | 'bg' | 'attr' = 'bg'
): string {
	const routeType = type === 'pokemon' && tag !== 'attr' && isAprilFoolsActive() ? 'pokemon-afd' : type;
	const baseURL = path.startsWith('http') ? path : `${process.env.WEB_URL}/static/splendor/${routeType}/${path}`;
	return tag === 'bg' ? `url(${baseURL})` : baseURL;
}

const TOKEN_COLOURS: Record<TOKEN_TYPE, string> = {
	[TOKEN_TYPE.COLORLESS]: '#dddddd',
	[TOKEN_TYPE.DARK]: '#444444',
	[TOKEN_TYPE.DRAGON]: '#eebe4e',
	[TOKEN_TYPE.FIRE]: '#fe3e4e',
	[TOKEN_TYPE.GRASS]: '#00a900',
	[TOKEN_TYPE.WATER]: '#1996e2',
};

export function renderLog(logEntry: Log, game: Splendor): [ReactElement, { name: string }] {
	const playerName = game.players[logEntry.turn]?.name;
	const opts = { name: `${game.id}-chatlog` };
	switch (logEntry.action) {
		case ACTIONS.BUY:
		case ACTIONS.BUY_RESERVE: {
			const card = metadata.pokemon[logEntry.ctx.id];
			return [
				<LogEntry>
					<Username name={playerName} clickable /> bought {card.name}!
				</LogEntry>,
				opts,
			];
		}
		case ACTIONS.RESERVE: {
			const card = metadata.pokemon[logEntry.ctx.id];
			return [
				<LogEntry>
					<Username name={playerName} clickable /> reserved {logEntry.ctx.deck ? `a Tier ${logEntry.ctx.deck} card` : card.name}.
				</LogEntry>,
				opts,
			];
		}
		case POST_TURN_ACTIONS.CLAIM_TRAINER: {
			return [
				<LogEntry>
					{metadata.trainers[logEntry.ctx.trainerId].name} joined {<Username name={playerName} clickable />}!
				</LogEntry>,
				opts,
			];
		}
		case ACTIONS.DRAW:
		case POST_TURN_ACTIONS.TOO_MANY_TOKENS: {
			const tokens = logEntry.action === ACTIONS.DRAW ? logEntry.ctx.tokens : logEntry.ctx.discard;
			return [
				<LogEntry>
					<Username name={playerName} clickable /> {logEntry.action === ACTIONS.DRAW ? 'drew' : 'discarded'} tokens{' '}
					<span style={{ zoom: '16%' }}>
						{(Object.entries(tokens) as [TOKEN_TYPE, number][])
							.filter(([_type, count]) => count > 0)
							.map(([type, count]) => (
								<TypeTokenCount type={type} count={count} />
							))}
					</span>
					{logEntry.action === ACTIONS.DRAW && logEntry.ctx.totalTokens > 10 ? (
						<>
							<span style={{ opacity: 0.45, paddingTop: '0.5em', fontSize: '0.9em' }}>
								<br />
								{`They have ${logEntry.ctx.totalTokens} tokens and must discard ${logEntry.ctx.totalTokens - MAX_TOKEN_COUNT}`}.
							</span>
						</>
					) : (
						'.'
					)}
				</LogEntry>,
				opts,
			];
		}
		case ACTIONS.PASS:
			return [
				<LogEntry>
					<Username name={playerName} clickable /> passed.
				</LogEntry>,
				opts,
			];
		default:
			Logger.log('Splendor had some weird move', logEntry, game.players);
			return [
				<LogEntry>
					Well <i>something</i> happened, I think! Someone go poke PartMan
				</LogEntry>,
				opts,
			];
	}
}

function getCardStyles(imageSrc: string | null): CSSProperties {
	return {
		...(imageSrc ? { backgroundImage: imageSrc, backgroundSize: 'cover' } : {}),
		boxSizing: 'border-box',
		height: 280,
		width: 200,
		overflow: 'hidden',
		display: 'inline-block',
		verticalAlign: 'top',
		border: '1px solid black',
		borderRadius: 12,
		padding: 0,
		margin: 12,
	};
}

function TypeToken({ type, rectangle }: { type: TOKEN_TYPE; rectangle?: boolean | undefined }): ReactElement {
	const data = metadata.types[type];

	const imgUrl = rectangle && type === TOKEN_TYPE.DRAGON ? getArtUrl('other', 'question-mark.png') : getArtUrl('type', data.art);
	const size = rectangle ? '94%' : '77%';

	const dimensions = rectangle ? { height: 120, width: 96 } : { height: 108, width: 108 };

	return (
		<div
			style={{
				...dimensions,
				margin: 8,
				marginBottom: -12,
				borderRadius: rectangle ? 12 : 99,
				display: 'inline-block',
				background: `no-repeat center/${size} ${imgUrl}, ${TOKEN_COLOURS[type]}`,
			}}
		/>
	);
}

function TypeTokenCount({
	type,
	count,
	rectangle,
}: {
	type: TOKEN_TYPE;
	count: number;
	rectangle?: boolean | undefined;
}): ReactElement {
	return (
		<div style={{ display: 'inline-block', margin: '0 12px 0 0' }}>
			<TypeToken type={type} rectangle={rectangle} />
			<span style={{ position: 'relative', bottom: 18, color: count === 0 ? '#aaa' : undefined, fontSize: 72 }}>
				×<b>{count}</b>
			</span>
		</div>
	);
}

export function TrainerCard({ data }: { data: Trainer }): ReactElement {
	const trainersToScooch = ['flint', 'gardenia', 'grimsley'];
	return (
		<div
			style={{
				background: `no-repeat right${trainersToScooch.includes(data.id) ? ' -50%' : ''} bottom/80% ${getArtUrl('trainers', data.art)} #eee8`,
				borderRadius: 16,
				border: '1px solid black',
				height: 144,
				width: 144,
				position: 'relative',
				overflow: 'hidden',
				color: 'white',
				display: 'inline-block',
				margin: 8,
			}}
		>
			<div style={{ background: '#1119', borderBottom: '1px solid black', textAlign: 'right' }}>
				<strong style={{ fontSize: '32px', marginRight: 12, position: 'relative', top: 4 }}>{data.points}</strong>
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						padding: '8px 36px 0 18px',
						background: '#0009',
						borderTopRightRadius: 24,
						zoom: '25%',
					}}
				>
					{(Object.entries(data.types) as [TOKEN_TYPE, number][]).map(([tokenType, cost]) => (
						<div>
							<TypeTokenCount type={tokenType} count={cost} rectangle />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function CardWrapper({
	onClick,
	style,
	children,
}: {
	onClick: string | undefined;
	style?: CSSProperties;
	children?: ReactNode;
}): ReactElement {
	if (!onClick) return <div style={style}>{children}</div>;
	return (
		<Button value={onClick} style={{ cursor: 'pointer', ...style }}>
			{children}
		</Button>
	);
}

export function ArtOnlyCard({ data, afd }: { data: Card; afd?: boolean | undefined }): ReactElement {
	return (
		<img
			src={getArtUrl(afd ? 'pokemon-afd' : 'pokemon', data.art, 'attr')}
			height={280}
			width={200}
			style={{ margin: 12 }}
			alt={data.name}
		/>
	);
}

export function PokemonCard({
	data,
	reserved,
	onClick,
	stackIndex,
}: {
	data: Card;
	reserved?: boolean | undefined;
	onClick?: string | undefined;
	stackIndex?: number | undefined;
}): ReactElement {
	return (
		<CardWrapper
			onClick={onClick ? `${onClick} ${data.id}` : undefined}
			style={{
				...getCardStyles(getArtUrl('pokemon', data.art)),
				color: 'white',
				textShadow: '0 0 2px #000',
				position: 'relative',
				cursor: onClick ? 'pointer' : undefined,
				...(stackIndex
					? {
							position: 'absolute',
							top: stackIndex * 42,
							left: stackIndex * 12,
						}
					: undefined),
			}}
		>
			<div
				style={{
					background: '#1119',
					borderBottom: '1px solid black',
					textAlign: 'left',
					position: 'absolute',
					top: 0,
					width: '100%',
				}}
			>
				<strong style={{ fontSize: '54px', marginLeft: 12, position: 'relative', top: 4, color: reserved ? '#aaa' : undefined }}>
					{data.points || '\u200b'}
				</strong>
				<img
					src={getArtUrl('type', metadata.types[data.type].art, 'img')}
					height="48"
					width="48"
					style={{
						float: 'right',
						margin: 4,
						borderRadius: 99,
						outline: '0.5px solid #eeee',
						outlineOffset: -2,
					}}
					alt={metadata.types[data.type].name}
				/>
			</div>
			{reserved ? (
				<div
					style={{
						textAlign: 'center',
						marginTop: 24,
						fontSize: 32,
						color: 'yellow',
						fontWeight: 'bolder',
						position: 'absolute',
						bottom: -16,
						transform: 'rotate(90deg)',
						transformOrigin: 'right 0',
					}}
				>
					<span
						style={{
							padding: 4,
							background: '#1119',
							borderRadius: 8,
						}}
					>
						RESERVED
					</span>
				</div>
			) : null}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					padding: '8px 8px 0',
					background: '#0009',
					borderTopRightRadius: 12,
					zoom: '40%',
				}}
			>
				{(Object.entries(data.cost) as [TOKEN_TYPE, number][]).map(([tokenType, cost]) => (
					<div>
						<TypeTokenCount type={tokenType} count={cost} />
					</div>
				))}
			</div>
		</CardWrapper>
	);
}

function FlippedCard({
	data,
	count,
	onClick,
}: {
	data: { tier: number };
	count: number | null;
	onClick?: string | undefined;
}): ReactElement {
	return (
		<CardWrapper style={getCardStyles(getArtUrl('other', `back-${data.tier}.png`))} onClick={onClick}>
			{count ? (
				<div
					style={{
						background: '#1119',
						borderRadius: 12,
						color: 'white',
						textShadow: '0 0 2px #000',
						display: 'inline-block',
						padding: '0 8px 8px',
						fontSize: 72,
						...(!onClick ? { position: 'relative', top: 96 } : {}),
					}}
				>
					×<b>{count}</b>
				</div>
			) : null}
		</CardWrapper>
	);
}

function PlaceholderCard(): ReactElement {
	return <div style={{ ...getCardStyles(null), background: '#1115', border: '2px dashed #eee5' }} />;
}

export function Stack({
	cards,
	hidden,
	reserved,
	onClick,
	style,
}: {
	cards: Card[];
	hidden?: boolean | undefined;
	reserved?: boolean | undefined;
	onClick?: string | undefined;
	style?: CSSProperties | undefined;
}): ReactElement {
	return (
		<div style={{ display: 'inline-block', boxSizing: 'border-box', ...style }}>
			<div style={{ position: 'relative', display: 'inline-block' }}>
				{cards.length === 0 ? (
					<PlaceholderCard />
				) : (
					cards.map((card, index) =>
						hidden ? (
							index === 0 ? (
								<FlippedCard data={card} count={cards.length} onClick={onClick} />
							) : null
						) : (
							<PokemonCard data={card} reserved={reserved} onClick={onClick} stackIndex={index} />
						)
					)
				)}
				{!hidden && cards.length > 1 ? <div style={{ height: (cards.length - 1) * 42 }} /> : null}
			</div>
			{!hidden && cards.length > 1 ? <div style={{ display: 'inline-block', width: (cards.length - 1) * 12 }} /> : null}
		</div>
	);
}

function TokenInput({
	types: _types,
	allowDragon,
	preset,
	label,
	onClick,
}: {
	types?: TOKEN_TYPE[];
	allowDragon?: boolean;
	preset: TokenCount | null;
	label: TranslatedText | string;
	onClick: string;
}): ReactElement {
	const types = _types ?? (allowDragon ? AllTokenTypes : TokenTypes);
	return (
		<Form
			value={`${onClick} ${types.map(type => `${type}{${type}}`).join(' ')}`}
			style={{ border: '1px solid', display: 'inline-block', padding: 12, borderRadius: 12, margin: 12 }}
			autoComplete="off"
		>
			{types.map(type => (
				<div style={{ display: 'inline-block' }}>
					<div style={{ zoom: '70%' }}>
						<TypeToken type={type} />
					</div>
					<input value={preset?.[type]} placeholder="0" style={{ width: 36, zoom: '200%' }} name={type} />
				</div>
			))}
			<div style={{ zoom: '240%', verticalAlign: 'top', marginTop: 18 }}>
				<button type="submit">{label}</button>
			</div>
		</Form>
	);
}

function WildCardInput({ action, onClick, $T }: { action: ViewType; onClick: string; $T: TranslationFn }): ReactElement {
	if (!action.active || action.action !== VIEW_ACTION_TYPE.CLICK_WILD) return <></>;
	const card = metadata.pokemon[action.id];
	const typesToInclude = (Object.keys(card.cost) as TOKEN_TYPE[]).concat([TOKEN_TYPE.DRAGON]);
	const typesToShow = AllTokenTypes.filter(type => typesToInclude.includes(type));
	return (
		<div style={{ borderRadius: 12, padding: 12, background: '#1119' }}>
			<PokemonCard data={card} />
			{action.canBuy ? (
				<TokenInput
					types={typesToShow}
					preset={action.preset}
					label={$T('GAME.SPLENDOR.LABELS.BUY')}
					onClick={`${onClick} ! ${ACTIONS.BUY} ${card.id}`}
				/>
			) : null}
			{action.canReserve ? (
				<div
					style={{
						display: 'inline-block',
						verticalAlign: 'top',
						border: '1px solid',
						borderRadius: 12,
						padding: 24,
						margin: 12,
					}}
				>
					<Button
						value={`${onClick} ! ${ACTIONS.RESERVE} ${card.id}`}
						style={{
							zoom: '240%',
						}}
					>
						{$T('GAME.SPLENDOR.LABELS.RESERVE')}
					</Button>
				</div>
			) : null}
		</div>
	);
}

function DeckReserveInput({ action, onClick, $T }: { action: ViewType; onClick: string; $T: TranslationFn }): ReactElement {
	if (!action.active || action.action !== VIEW_ACTION_TYPE.CLICK_DECK) return <></>;
	return (
		<div style={{ borderRadius: 12, padding: 12, background: '#1119' }}>
			<FlippedCard data={{ tier: action.tier }} count={null} />
			<div
				style={{
					display: 'inline-block',
					verticalAlign: 'top',
					border: '1px solid',
					borderRadius: 12,
					padding: 24,
					margin: 12,
				}}
			>
				<Button
					value={`${onClick} ! ${ACTIONS.RESERVE} ${action.tier}`}
					style={{
						zoom: '240%',
					}}
				>
					{$T('GAME.SPLENDOR.LABELS.RESERVE')}
				</Button>
			</div>
		</div>
	);
}

function ReservedCardInput({
	card,
	preset,
	onClick,
	$T,
}: {
	preset: TokenCount;
	card: Card;
	onClick: string;
	$T: TranslationFn;
}): ReactElement {
	const typesToInclude = (Object.keys(card.cost) as TOKEN_TYPE[]).concat([TOKEN_TYPE.DRAGON]);
	const typesToShow = AllTokenTypes.filter(type => typesToInclude.includes(type));
	return (
		<TokenInput
			types={typesToShow}
			preset={preset}
			label={$T('GAME.SPLENDOR.LABELS.BUY_CARD', { card: card.name })}
			onClick={`${onClick} ${card.id}`}
		/>
	);
}

function ChooseTrainerInput({
	onClick,
	affordableTrainers,
	label,
}: {
	onClick: string;
	affordableTrainers: Trainer[];
	label: string;
}): ReactElement {
	return (
		<Form
			value={`${onClick} {selectedTrainer}`}
			style={{ border: '1px solid', display: 'inline-block', padding: 12, borderRadius: 12, textAlign: 'left' }}
		>
			{affordableTrainers.map(trainer => (
				<>
					<input style={{ zoom: '180%' }} type="radio" value={trainer.id} name="selectedTrainer" id={trainer.id} required />
					<label htmlFor={trainer.id}>
						<span style={{ zoom: '67%', display: 'inline-block', transform: 'translateY(1em)' }}>
							<TrainerCard data={trainer} />
						</span>
						<span style={{ marginTop: '-1 em' }}>{trainer.name}</span>
					</label>
					<br />
				</>
			))}
			<button style={{ display: 'block', margin: '1em auto' }}>{label}</button>
		</Form>
	);
}

export function BaseBoard({
	board,
	view,
	onClick,
	$T,
}: {
	board: Board;
	view: ViewType;
	onClick?: string | undefined;
	$T: TranslationFn;
}): ReactElement {
	return (
		<>
			<div>
				{board.trainers.map(trainer => (
					<TrainerCard data={trainer} />
				))}
			</div>
			<div style={{ zoom: '60%' }}>
				{view.active && view.action === VIEW_ACTION_TYPE.CLICK_TOKENS ? (
					<Form value={`${onClick} ! ${ACTIONS.DRAW} ${TokenTypes.map(type => `${type}{${type}}`).join(' ')}`}>
						{AllTokenTypes.map(tokenType => (
							<div style={{ display: 'inline-block' }}>
								<TypeTokenCount type={tokenType} count={board.tokens[tokenType]} />
								<br />
								<input
									placeholder="0"
									style={{ width: 36, zoom: '300%' }}
									name={tokenType}
									disabled={tokenType === TOKEN_TYPE.DRAGON || board.tokens[tokenType] === 0}
								/>
							</div>
						))}
						<div style={{ display: 'inline-block', verticalAlign: 'top', paddingTop: 72 }}>
							<button type="submit" style={{ zoom: '320%' }}>
								Draw!
							</button>
						</div>
					</Form>
				) : (
					<>
						{AllTokenTypes.map(tokenType => (
							<TypeTokenCount type={tokenType} count={board.tokens[tokenType]} />
						))}
						{view.active ? (
							<Button
								value={`${onClick} ! ${VIEW_ACTION_TYPE.CLICK_TOKENS}`}
								style={{ zoom: '360%', position: 'relative', bottom: 6 }}
							>
								Draw Tokens
							</Button>
						) : null}
					</>
				)}
			</div>
			{view.active && view.action === VIEW_ACTION_TYPE.CLICK_WILD ? <WildCardInput action={view} onClick={onClick!} $T={$T} /> : null}
			{view.active && view.action === VIEW_ACTION_TYPE.CLICK_DECK ? (
				<DeckReserveInput action={view} onClick={onClick!} $T={$T} />
			) : null}
			<div style={{ height: 48 }} />
			{([3, 2, 1] as const).map(tier => {
				const { wild, deck } = board.cards[tier];
				return (
					<div style={{ whiteSpace: 'nowrap', overflow: 'auto' }}>
						{wild.map(card => (
							<PokemonCard
								data={card}
								onClick={
									onClick && !(view.active && view.action === VIEW_ACTION_TYPE.CLICK_WILD && card.id === view.id)
										? `${onClick} ! ${VIEW_ACTION_TYPE.CLICK_WILD}`
										: undefined
								}
							/>
						))}
						<Stack
							cards={deck}
							hidden
							onClick={
								onClick && !(view.active && view.action === VIEW_ACTION_TYPE.CLICK_DECK && view.tier === tier)
									? `${onClick} ! ${VIEW_ACTION_TYPE.CLICK_DECK} ${tier}`
									: undefined
							}
						/>
					</div>
				);
			})}
		</>
	);
}

const RESOURCE_STYLES: CSSProperties = {
	zoom: '40%',
	overflowX: 'auto',
	fontSize: 24,
	background: '#1119',
	borderRadius: 8,
	padding: '8px 12px',
	margin: 12,
	width: 960,
};

export function ActivePlayer({
	data,
	action,
	onClick,
	cap,
	$T,
}: {
	data: PlayerData;
	action: ViewType & { type: 'player' };
	onClick: string;
	cap: number;
	$T: TranslationFn;
}): ReactElement {
	const cardsGroup = data.cards.groupBy(card => card.type);
	const cards = AllTokenTypes.filterMap<[TOKEN_TYPE, Card[]]>(type => {
		const cards = cardsGroup[type];
		if (cards?.length) return [type, cards];
	});
	const tokensEl = AllTokenTypes.filterMap(type => {
		const count = data.tokens[type];
		if (count) return <TypeTokenCount type={type} count={count} />;
	});

	return (
		<div style={{ fontSize: 36 }}>
			<div style={{ display: 'inline-block', verticalAlign: 'top' }}>
				<div className="header" style={{ height: 'auto', position: 'initial', borderRadius: 12, padding: '8px 12px', margin: 12 }}>
					<Username name={data.name} clickable />(<b style={{ fontSize: 48 }}>{data.points}</b>
					<small>/{cap}</small>)
				</div>
				<div style={{ zoom: '75%' }}>
					{data.trainers.map(trainer => (
						<TrainerCard data={trainer} />
					))}
				</div>
			</div>
			<div style={{ display: 'inline-block', verticalAlign: 'top', color: 'white' }}>
				<div style={RESOURCE_STYLES}>
					<div style={{ textAlign: 'start', fontSize: 48 }}>Tokens:{tokensEl.length === 0 ? ' - ' : null}</div>
					{tokensEl}
				</div>
			</div>
			{cards.length || data.reserved.length ? (
				<div style={{ display: 'inline-block', verticalAlign: 'top', margin: '0 8px', color: 'white' }}>
					{cards.length ? (
						<details open style={{ display: 'inline-block', verticalAlign: 'top' }}>
							<summary style={{ ...RESOURCE_STYLES, cursor: 'pointer' }}>
								{cards.map(([tokenType, { length: count }]) => (
									<TypeTokenCount type={tokenType} count={count} rectangle />
								))}
							</summary>
							<div style={{ zoom: '75%', display: 'inline' }}>
								{cards.map(([_tokenType, card]) => (
									<Stack cards={card} />
								))}
							</div>
						</details>
					) : null}
					{data.reserved.map(card => (
						<PokemonCard
							data={card}
							onClick={
								action.active &&
								action.action !== POST_TURN_ACTIONS.TOO_MANY_TOKENS &&
								!(action.action === VIEW_ACTION_TYPE.CLICK_RESERVE && card.id === action.id)
									? `${onClick} ! ${VIEW_ACTION_TYPE.CLICK_RESERVE}`
									: undefined
							}
							reserved
						/>
					))}
				</div>
			) : null}
			{action.active && action.action === VIEW_ACTION_TYPE.CLICK_RESERVE ? (
				action.preset ? (
					<ReservedCardInput
						card={metadata.pokemon[action.id]}
						preset={action.preset}
						onClick={`${onClick} ! ${ACTIONS.BUY_RESERVE}`}
						$T={$T}
					/>
				) : (
					<div>{`You can't afford ${metadata.pokemon[action.id].name}...`}</div>
				)
			) : null}
			{action.active && action.action === POST_TURN_ACTIONS.TOO_MANY_TOKENS ? (
				<div style={{ color: 'white' }}>
					<p>{$T('GAME.SPLENDOR.TOO_MANY_TOKENS_MESSAGE', { max: MAX_TOKEN_COUNT, discard: action.discard })}</p>
					<TokenInput
						allowDragon
						preset={null}
						label={$T('GAME.LABELS.DISCARD')}
						onClick={`${onClick} ! ${POST_TURN_ACTIONS.TOO_MANY_TOKENS}`}
					/>
				</div>
			) : null}
			{action.active && action.action === POST_TURN_ACTIONS.CLAIM_TRAINER ? (
				<div style={{ color: 'white', width: '80%' }}>
					<p>{$T('GAME.SPLENDOR.CLAIM_TRAINER_MESSAGE')}</p>
					<ChooseTrainerInput
						affordableTrainers={action.canAfford}
						onClick={`${onClick} ! ${POST_TURN_ACTIONS.CLAIM_TRAINER}`}
						label={$T('GAME.SPLENDOR.LABELS.CHOOSE')}
					/>
				</div>
			) : null}
		</div>
	);
}

export function PlayerSummary({ data }: { data: PlayerData }): ReactElement {
	const cards = data.cards.groupBy(card => card.type);
	if (data.reserved.length > 0) cards[TOKEN_TYPE.DRAGON] = data.reserved;

	const cardsEl = AllTokenTypes.filterMap(type => {
		const count = cards[type]?.length;
		if (count) return <TypeTokenCount type={type} count={count} rectangle />;
	});
	const tokensEl = AllTokenTypes.filterMap(type => {
		const count = data.tokens[type];
		if (count) return <TypeTokenCount type={type} count={count} />;
	});

	return (
		<div style={{ border: '1px solid', display: 'inline-block', borderRadius: 8 }}>
			<div style={{ display: 'inline-block', verticalAlign: 'top' }}>
				<div style={{ margin: 12 }}>
					<span
						className="header"
						style={{
							height: 'auto',
							position: 'initial',
							fontWeight: 'bold',
							fontSize: 36,
							borderRadius: 8,
							padding: '8px 12px',
							textDecoration: data.out ? 'line-through' : undefined,
							display: 'inline-block',
							width: 600,
						}}
					>
						<Username name={data.name} clickable /> ({data.points})
					</span>
				</div>
				<div style={{ zoom: '60%' }}>
					{data.trainers.map(trainer => (
						<TrainerCard data={trainer} />
					))}
				</div>
			</div>
			<div style={{ display: 'inline-block', color: 'white' }}>
				<div style={RESOURCE_STYLES}>
					<div style={{ textAlign: 'start', fontSize: 48 }}>Cards:{cardsEl.length === 0 ? ' - ' : null}</div>
					{cardsEl}
				</div>
				<div style={RESOURCE_STYLES}>
					<div style={{ textAlign: 'start', fontSize: 48 }}>Tokens:{tokensEl.length === 0 ? ' - ' : null}</div>
					{tokensEl}
				</div>
			</div>
		</div>
	);
}

export function render(ctx: RenderCtx): ReactElement {
	const msg = getMsg();
	return (
		<center>
			<GameHeader header={ctx.header} dimHeader={ctx.dimHeader} />
			<div style={{ zoom: '50%' }}>
				<BaseBoard board={ctx.board} onClick={ctx.view.active ? msg : undefined} view={ctx.view} $T={ctx.$T} />
				<div style={{ height: 48 }} />
				{ctx.view.type === 'player' ? (
					<>
						<ActivePlayer data={ctx.players[ctx.view.self]} action={ctx.view} onClick={msg} cap={ctx.cap} $T={ctx.$T} />
						<hr />
					</>
				) : null}
				{ctx.turns.map(turn => <PlayerSummary data={ctx.players[turn]} />).space(<div style={{ height: 12 }} />)}
			</div>
		</center>
	);
}
