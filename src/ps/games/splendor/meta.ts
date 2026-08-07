import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Splendor',
	id: GamesList.Splendor,
	aliases: [],
	players: 'many',
	minSize: 2,
	maxSize: 4,

	autostart: false,
	pokeTimer: fromHumanTime('1 min'),
	timer: fromHumanTime('2 min'),

	htp: {
		goal: 'Be the first to get 15 points',
		sections: [
			{
				title: 'Cards',
				lines: [
					'Each Card consists of 3 components:',
					'- Cost (bottom-left): The amount of Gems needed to buy it.',
					'- Type (top-right): Each Card acts as a permanent gem of the Type indicated.',
					'- Point (top-left): The value each Card is worth.'
				]
			},
			{
				title: 'Gameplay',
				lines: ['On your turn choose 1 action:'],
				subsections: [
					{
						title: 'Pick up Gems',
						lines: [
							'- Take 3 different OR 2 of the same color (only if >=4 of that color available).',
							'- Max 10 Gems can be held at a time.',
							'- If >10, choose which to return.'
						]
					},
					{
						title: 'Buy a Card',
						lines: [
							'- Pay Gems equal to the cost to make it yours.',
							'- No game limit on number of Cards buyable.'
						]
					},
					{
						title: 'Reserve a Card',
						lines: [
							'- Take a card so only you can buy it.',
							'- Also gain a Dragon gem (if possible).',
							'- Can reserve up to 3 cards only.',
							'- Cannot win if you have an unbought reserved card.'
						]
					}
				]
			},
			{
				title: 'Trainers',
				lines: [
					'Each Trainer card consists of 2 components:',
					'- Point (top-right): The value each Trainer is worth',
					'- Requirement (bottom-left): Unlike normal Cards, these requires having Cards (not Gems) of that specific type. Additionally, you do not have to pay anything to get them: they come when you fulfill the reqeuirements'
				]
			},
			{
				title: 'Win conditions',
				lines: [
					'- Once a player reaches 15 points, everyone after them in turn order gets one last turn.',
					'- If points are tied, the one with fewer Cards wins.',
					'- If still tied, everyone wins!!!!'
				]
			}
		]
	},
	// UGO-CODE
	ugo: {
		cap: 8,
		points: {
			win: 25,
			loss: 18,
		},
	},
};
