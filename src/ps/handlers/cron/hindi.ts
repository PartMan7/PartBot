import { PSCommands } from '@/cache';
import { bulkAddPoints } from '@/database/points';
import { i18n } from '@/i18n';
import { TimeZone } from '@/ps/handlers/cron/constants';
import { sleep } from '@/utils/sleep';

import type { PSCronJobManager } from '@/ps/handlers/cron/index';
import type { PSCommandContext } from '@/types/chat';
import type { RecursivePartial } from '@/types/common';
import type { PSMessage } from '@/types/ps';
import type { Client, User } from 'ps-client';

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

	const preGGSSEvent = (eventType: string) => {
		const hindiRoom = this.getRoom('hindi');
		const ggssRoom = this.getRoom('galligallisimsim');
		if (!hindiRoom || !ggssRoom) return;

		hindiRoom.send(`/wall ${eventType} in <<galligallisimsim>>!`);
		ggssRoom.send('/modchat ac');
		ggssRoom.send('/declare HRMC!');
	};

	const postGGSSEvent = () => {
		const ggssRoom = this.getRoom('galligallisimsim');
		if (!ggssRoom) return;

		ggssRoom.send('Khelne ke liye shukriya!'); // TODO: Use i18n instead
		ggssRoom.send('/modchat +');
		if (Math.random() < 0.1) {
			const randomAuth = ggssRoom.users.filter(user => ![' ', '*'].includes(user.charAt(0))).random();
			if (!randomAuth) return;
			ggssRoom.send(`${randomAuth.slice(1)} hi nerd`);
		}
	};

	// Galli Galli Sim Sim
	Jobs.register('ggss-kunc', '30 21 * * Wed,Sat', TimeZone.IST, () => {
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

		async function event(rounds: number) {
			preGGSSEvent('Kunc');
			room.send(`Kunc starting in 1 minute!`); // TODO i18n this
			await sleep('1 min');
			room.send('Starting kunc!');

			for (let i = 0; i < rounds; i++) {
				const winners = (await kuncCommand.run(partialContext as PSCommandContext)) as User[] | null;
				if (winners) {
					const pointsData = Object.fromEntries(
						winners.map(user => [
							user.id,
							{
								name: user.name,
								id: user.id,
								points: {
									points: 1,
									officialPoints: 1,
								},
							},
						])
					);
					bulkAddPoints(pointsData, room.id);
				}
				if (i !== rounds - 1) await sleep('5 sec');
			}

			postGGSSEvent();
		}

		event(10);
	});
}
