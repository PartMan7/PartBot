import { pokedex } from 'ps-client/data';

import { PSCommands } from '@/cache';
import { i18n } from '@/i18n';
import { TimeZone } from '@/ps/handlers/cron/constants';
import { sample } from '@/utils/random';
import { sleep } from '@/utils/sleep';

import type { PSCronJobManager } from '@/ps/handlers/cron/index';
import type { PSCommandContext } from '@/types/chat';
import type { RecursivePartial } from '@/types/common';
import type { PSMessage } from '@/types/ps';
import type { Client, User } from 'ps-client';

function _preGGSSEvent(this: Client, eventType: string) {
	const hindiRoom = this.getRoom('hindi');
	const ggssRoom = this.getRoom('galligallisimsim');
	if (!hindiRoom || !ggssRoom) return;

	hindiRoom.send(`/wall ${eventType} in <<galligallisimsim>>!`);
	ggssRoom.send('/modchat ac');
	ggssRoom.send('/declare HRMC!');
}

function _postGGSSEvent(this: Client) {
	const ggssRoom = this.getRoom('galligallisimsim');
	if (!ggssRoom) return;

	ggssRoom.send('Khelne ke liye shukriya!'); // TODO: Use i18n instead
	ggssRoom.send('/modchat +');
	if (Math.random() < 0.1) {
		const randomAuth = ggssRoom.users.filter(user => ![' ', '*'].includes(user.charAt(0))).random();
		if (!randomAuth) return;
		ggssRoom.send(`${randomAuth.slice(1)} hi nerd`);
	}
}

async function AnimeQuiz(this: Client) {
	const room = this.getRoom('galligallisimsim');
	if (!room) return;

	_preGGSSEvent.call(this, 'Anime Quiz');
	room.send('Anime Quiz ek minute mei shuru hoga!');

	await sleep('1 min');
	room.send(']trivia start 15 -cx ecchi -s 20 -d 5');
}

async function Hangman(this: Client) {
	const room = this.getRoom('galligallisimsim');
	if (!room) return;

	_preGGSSEvent.call(this, 'Hangman');

	const HANGMAN_GAMES_COUNT = 20;
	room.send('Hangman ek minute mei shuru hoga!');
	await sleep('1 min');

	let gamesDone = 0;
	while (gamesDone < HANGMAN_GAMES_COUNT) {
		// TODO: Add a hangman command
		const randMon = Object.values(pokedex)
			.filter(mon => mon.num > 0 && !mon.forme)
			.random();
		room.send(`/hangman create ${randMon.name}, A Pokémon!`);

		gamesDone++;
		await sleep('20s');
	}

	_postGGSSEvent.call(this);
}

export function register(this: Client, Jobs: PSCronJobManager): void {
	// Main room
	Jobs.register('hindi-automodchat-enable', '0 0 * * *', TimeZone.IST, () => {
		this.getRoom('hindi')?.send('/automodchat 10, +');
	});
	Jobs.register('hindi-automodchat-disable', '0 7 * * *', TimeZone.IST, () => {
		const room = this.getRoom('hindi');
		room?.send('/modchat ac');
		room?.send('/automodchat off');
	});

	// TODO: RkR, DkR

	// Galli Galli Sim Sim
	const preGGSSEvent = _preGGSSEvent.bind(this);
	const postGGSSEvent = _postGGSSEvent.bind(this);

	Jobs.register('ggss-day-animequiz', '0 17 * * Wed', TimeZone.IST, AnimeQuiz.bind(this));

	Jobs.register('ggss-day-hangman', '0 17 * * Sat', TimeZone.IST, Hangman.bind(this));

	Jobs.register('ggss-randblitz', '0 19 * * *', TimeZone.IST, () => {
		const room = this.getRoom('galligallisimsim');
		if (!room) return;

		const currentGen = 9;
		const gen = sample(currentGen) + 1;
		const base = `[Gen ${gen}] Random Battle`;

		preGGSSEvent('Blitz tournament');
		room.send(`/tour create ${base}, elim\n/tour rules Blitz\n/tour name ${base} Blitz`);
		room.send(`/tour forcetimer on`);
		room.send(`/tour autostart 7`);
		room.send(`/tour autodq 2`);
		// TODO: End when tour end is received
	});

	Jobs.register('ggss-night-uno', '30 21 * * Sun,Tue', TimeZone.IST, async () => {
		const room = this.getRoom('galligallisimsim');
		if (!room) return;
		preGGSSEvent('Uno');
		room.send('/uno create');
		room.send('/uno autostart 60');

		await sleep('10 min'); // TODO: Hook to Uno raw events
		postGGSSEvent();
	});

	Jobs.register('ggss-night-hangman', '30 21 * * Mon,Thu', TimeZone.IST, Hangman.bind(this));

	Jobs.register('ggss-night-kunc', '30 21 * * Wed,Sat', TimeZone.IST, async () => {
		const room = this.getRoom('galligallisimsim');
		if (!room) return;
		const kuncCommand = PSCommands.kunc;
		if (!kuncCommand) room.send('Unable to start Kunc! Someone ping PartMan.');

		const $T = i18n(); // TODO: Use Hindi
		const partialMessage: RecursivePartial<PSMessage> = {
			type: 'chat',
			target: room,
			parent: this,
			reply: room.send.bind(room),
		};
		const partialContext: Partial<PSCommandContext> = { arg: '', message: partialMessage as PSMessage, $T };

		const rounds = 10;

		preGGSSEvent('Kunc');
		room.send(`Kunc starting in 1 minute!`); // TODO i18n this
		await sleep('1 min');
		room.send('Starting kunc!');

		const gamePoints: Record<string, { user: User; points: number }> = {};

		for (let i = 0; i < rounds; i++) {
			const winners = (await kuncCommand.run(partialContext as PSCommandContext)) as User[] | null;
			if (winners) {
				winners.forEach(user => {
					gamePoints[user.id] ??= { user, points: 0 };
					gamePoints[user.id].points++;
				});
			}
			if (i !== rounds - 1) await sleep('5 sec');
		}

		const top = Object.values(gamePoints)
			.sortBy(entry => entry.points, 'desc')
			.slice(0, 3);

		room.send(`Winners: ${top.map(({ user }) => user.name).list()}`); // TODO add points based on... PL?

		postGGSSEvent();
	});

	Jobs.register('ggss-night-animequiz', '30 21 * * Fri', TimeZone.IST, AnimeQuiz.bind(this));
}
