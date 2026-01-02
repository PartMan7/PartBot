import '@/globals';

import { i18n } from '@/i18n';
import { TOKEN_TYPE, VIEW_ACTION_TYPE } from '@/ps/games/splendor/constants';
import { ansiToHtml } from '@/utils/ansiToHtml';
import { cachebustDir } from '@/utils/cachebust';
import { fsPath } from '@/utils/fsPath';
import { jsxToHTML } from '@/utils/jsxToHTML';

import type { Metadata, RenderCtx } from '@/ps/games/splendor/types';

export const test: () => Promise<string> = async () => {
	try {
		cachebustDir(fsPath('ps', 'games'));
		const { render } = await import('@/ps/games/splendor/render');
		const { default: metadata } = (await import('@/ps/games/splendor/metadata.json')) as unknown as { default: Metadata };

		const MOCK_RENDER_CTX: RenderCtx = {
			id: '#TEMP',
			header: 'Your turn!',
			$T: i18n('english'),
			board: {
				cards: {
					'1': {
						wild: Object.values(metadata.pokemon)
							.filter(mon => mon.tier === 1)
							.sample(4, 1),
						deck: [],
					},
					'2': {
						wild: Object.values(metadata.pokemon)
							.filter(mon => mon.tier === 2)
							.sample(4, 2),
						deck: [metadata.pokemon.celebi],
					},
					'3': {
						wild: Object.values(metadata.pokemon)
							.filter(mon => mon.tier === 3)
							.sample(4, 6),
						deck: [metadata.pokemon.celebi, metadata.pokemon.eevee],
					},
				},
				trainers: Object.values(metadata.trainers).sample(5, 1),
				tokens: {
					[TOKEN_TYPE.FIRE]: 4,
					[TOKEN_TYPE.GRASS]: 5,
					[TOKEN_TYPE.DARK]: 7,
					[TOKEN_TYPE.DRAGON]: 1,
					[TOKEN_TYPE.WATER]: 0,
					[TOKEN_TYPE.COLORLESS]: 2,
				},
			},
			view: 1
				? {
						type: 'player',
						active: false,
						self: 'partman',
					}
				: {
						type: 'player',
						active: true,
						self: 'partman',
						action: VIEW_ACTION_TYPE.CLICK_WILD,
						id: 'klang',
						canBuy: true,
						preset: {
							[TOKEN_TYPE.GRASS]: 2,
							[TOKEN_TYPE.WATER]: 1,
							[TOKEN_TYPE.FIRE]: 0,
							[TOKEN_TYPE.COLORLESS]: 0,
							[TOKEN_TYPE.DARK]: 0,
							[TOKEN_TYPE.DRAGON]: 0,
						},
						canReserve: true,
						// preset: null,
					},
			turns: ['partbot', 'partman'],
			players: {
				partbot: {
					id: 'partbot',
					name: 'PartBot',
					points: 9,
					tokens: {
						[TOKEN_TYPE.FIRE]: 0,
						[TOKEN_TYPE.GRASS]: 0,
						[TOKEN_TYPE.DARK]: 0,
						[TOKEN_TYPE.DRAGON]: 1,
						[TOKEN_TYPE.WATER]: 3,
						[TOKEN_TYPE.COLORLESS]: 0,
					},
					cards: [metadata.pokemon.murkrow, metadata.pokemon.tapulele],
					trainers: [metadata.trainers.larry, metadata.trainers.siebold],
					reserved: [metadata.pokemon.klink],
				},
				partman: {
					id: 'partman',
					name: 'PartMan',
					points: 10,
					tokens: {
						[TOKEN_TYPE.FIRE]: 0,
						[TOKEN_TYPE.GRASS]: 0,
						[TOKEN_TYPE.DARK]: 0,
						[TOKEN_TYPE.DRAGON]: 1,
						[TOKEN_TYPE.WATER]: 3,
						[TOKEN_TYPE.COLORLESS]: 0,
					},
					cards: [
						metadata.pokemon.murkrow,
						metadata.pokemon.tapulele,
						metadata.pokemon.espeon,
						metadata.pokemon.vulpix,
						metadata.pokemon.marill,
						metadata.pokemon.pichu,
						metadata.pokemon.celebi,
					],
					trainers: [metadata.trainers.larry],
					reserved: [metadata.pokemon.klink],
				},
			},
		};

		return jsxToHTML(render.bind({ msg: 'test' })(MOCK_RENDER_CTX));
	} catch (err) {
		return err instanceof Error ? ansiToHtml(err.message) : 'Something went wrong!';
	}
};
