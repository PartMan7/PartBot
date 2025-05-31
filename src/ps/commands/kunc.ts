import { pokedex } from 'ps-client/data';

import { PSKuncInProgress } from '@/cache';
import { ShowdownData } from '@/cache/showdown';
import { ShowdownDataKeys } from '@/cache/showdown/types';
import { prefix } from '@/config/ps';
import { fromHumanTime } from '@/tools';
import { ChatError } from '@/utils/chatError';
import { debounce } from '@/utils/debounce';
import { DeferredPromise } from '@/utils/deferredPromise';
import { levenshtein } from '@/utils/levenshtein';

import type { NoTranslate, ToTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';
import type { User } from 'ps-client';

export const command: PSCommand = {
	name: 'kunc',
	help: 'Creates a game of kunc! Guess the Pokémon by a randomly-generated set.',
	syntax: 'CMD [time?]',
	perms: (message, checkPermission) => (message.type === 'chat' ? checkPermission('driver') : true),
	categories: ['game'],
	async run({ message, arg, $T }): Promise<User[] | null> {
		const id = message.type === 'chat' ? message.target.id : `pm-${message.author.id}`;
		if (PSKuncInProgress[id]) {
			throw new ChatError(`Kunc in progress! Finish it first or end with \`\`${prefix}kunc end\`\`` as ToTranslate);
		}
		PSKuncInProgress[id] = true;
		const time = arg.trim() ? fromHumanTime(arg) : fromHumanTime('30 sec');
		if (!time || time < fromHumanTime('5 sec') || time > fromHumanTime('1 min')) {
			throw new ChatError('Set a reasonable time please (5s - 1min)' as ToTranslate);
		}

		const kuncData = ShowdownData[ShowdownDataKeys.RandomSetsGen9];

		const selectedMon = Object.keys(kuncData).random();
		const selectedMoves = kuncData[selectedMon].sets.random().movepool.sample(4);
		const matchingMons = Object.keys(kuncData).filter(m => {
			const mon = kuncData[m];
			return mon.sets.some(set => {
				return selectedMoves.every(move => set.movepool.includes(move));
			});
		});
		const matchingNames = matchingMons.map(mon => pokedex[mon].name);
		const matchingNamesLower = matchingNames.map(name => name.toLowerCase().replace(/[ -]/g, ''));

		message.reply(`**Kunc: ${selectedMoves.join(', ')}**` as NoTranslate);

		const solved: User[] = [];

		const closeKunc = new DeferredPromise();
		const markGuessed = debounce(() => {
			closeKunc.reject(new Error());
		}, fromHumanTime('1 sec'));

		return Promise.race([
			message.target.waitFor(chatMessage => {
				if (chatMessage.author.id === message.parent.status.userid) return false;
				const guess = chatMessage.content.toLowerCase().replace(/[ -]/g, '');
				if (matchingNamesLower.some(mon => levenshtein(mon, guess) <= 1)) {
					if (!solved.includes(chatMessage.author)) solved.push(chatMessage.author);
					markGuessed();
				}
				return false;
			}),
			closeKunc.promise,
		]).then(
			() => null,
			() => {
				delete PSKuncInProgress[id];

				if (solved.length > 0) {
					const guessers = solved.map(user => user.name).list($T);
					message.reply(`${guessers} guessed correctly! Solution: ${matchingNames.list($T('GRAMMAR.OR'))}.` as ToTranslate);
					return solved;
				} else {
					message.reply(`No one guessed ${matchingNames.list($T('GRAMMAR.OR'))} in time...` as ToTranslate);
					return null;
				}
			}
		);
	},
};
