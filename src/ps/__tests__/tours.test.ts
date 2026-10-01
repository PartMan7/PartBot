import { describe, expect, it } from 'vitest';

import { type BracketTree, getTopFourFromBracketTree } from '@/ps/handlers/tours';

describe('tour points placements', () => {
	it('keeps the champion and semifinal placements for a four-player bracket', () => {
		const bracket: BracketTree = {
			format: '[Gen 9] OU',
			generator: 'Single Elimination',
			results: [['Armored Crow Music']],
			bracketData: {
				type: 'tree',
				rootNode: {
					children: [
						{
							children: [{ team: 'kochu_shak' }, { team: 'sitc' }],
							state: 'finished',
							team: 'kochu_shak',
							result: 'win',
							score: [1, 3],
						},
						{
							children: [{ team: 'Arpitraj1 ♪' }, { team: 'Armored Crow Music' }],
							state: 'finished',
							team: 'Armored Crow Music',
							result: 'loss',
							score: [0, 3],
						},
					],
					state: 'finished',
					team: 'Armored Crow Music',
					result: 'loss',
					score: [0, 4],
				},
			},
		};

		expect(getTopFourFromBracketTree(bracket)).toEqual(['Armored Crow Music', 'kochu_shak', 'sitc', 'Arpitraj1 ♪']);
	});

	it('keeps semifinal losers from nested bracket subtrees', () => {
		const bracket: BracketTree = {
			format: 'ChatBats (Official)',
			generator: 'Single Elimination',
			results: [['mrfootgod']],
			bracketData: {
				type: 'tree',
				rootNode: {
					children: [
						{
							children: [
								{
									children: [{ team: 'SlowedGG' }, { team: 'Yeet masters' }],
									state: 'finished',
									team: 'Yeet masters',
									result: 'loss',
									score: [0, 4],
								},
								{
									children: [{ team: 'doom2121' }, { team: 'zvbcv' }],
									state: 'finished',
									team: 'doom2121',
									result: 'win',
									score: [4, 4],
								},
							],
							state: 'finished',
							team: 'doom2121',
							result: 'loss',
							score: [0, 3],
						},
						{
							children: [
								{
									children: [{ team: 'mrfootgod' }, { team: 'Poipole rule' }],
									state: 'finished',
									team: 'mrfootgod',
									result: 'win',
									score: [6, 0],
								},
								{
									children: [{ team: 'Bjjkidcade' }, { team: 'Shade PieD' }],
									state: 'finished',
									team: 'Shade PieD',
									result: 'loss',
									score: [2, 5],
								},
							],
							state: 'finished',
							team: 'mrfootgod',
							result: 'win',
							score: [4, 0],
						},
					],
					state: 'finished',
					team: 'mrfootgod',
					result: 'loss',
					score: [0, 2],
				},
			},
		};

		expect(getTopFourFromBracketTree(bracket)).toEqual(['mrfootgod', 'doom2121', 'Yeet masters', 'Shade PieD']);
	});
});
