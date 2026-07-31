import '@/globals';

import { i18n } from '@/i18n';
import { Tile, VIEW_ACTION_TYPE } from '@/ps/games/azul/constants';
import { ansiToHtml } from '@/utils/ansiToHtml';
import { cachebustDir } from '@/utils/cachebust';
import { fsPath } from '@/utils/fsPath';
import { jsxToHTML } from '@/utils/jsxToHTML';

import type { PlayerBoard, RenderCtx } from '@/ps/games/azul/types';

function mockPlayer(id: string, name: string, partial: Partial<PlayerBoard> = {}): PlayerBoard {
	return {
		id,
		name,
		score: 0,
		pattern: [[null], [null, null], [null, null, null], [null, null, null, null], [null, null, null, null, null]],
		wall: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null)),
		floor: [],
		...partial,
	};
}

export const test: () => Promise<string> = async () => {
	try {
		cachebustDir(fsPath('ps', 'games'));
		const { render } = await import('@/ps/games/azul/render');

		const partman = mockPlayer('partman', 'PartMan', {
			score: 12,
			pattern: [
				[Tile.Water],
				[Tile.Fire, Tile.Fire],
				[Tile.Electric, null, null],
				[null, null, null, null],
				[Tile.Dark, Tile.Dark, Tile.Dark, null, null],
			],
			wall: [
				[Tile.Water, null, null, null, null],
				[null, Tile.Water, null, null, null],
				[null, null, null, null, null],
				[null, null, null, Tile.Water, null],
				[null, null, null, null, null],
			],
			floor: [Tile.Fire, 'first'],
		});

		const partbot = mockPlayer('partbot', 'PartBot', {
			score: 8,
			wall: [
				[null, Tile.Electric, null, null, null],
				[null, null, null, null, null],
				[Tile.Dark, null, Tile.Water, null, null],
				[null, null, null, null, null],
				[null, null, null, null, Tile.Fire],
			],
			pattern: [
				[null],
				[Tile.Grass, null],
				[null, null, null],
				[Tile.Electric, Tile.Electric, Tile.Electric, null],
				[null, null, null, null, null],
			],
		});

		const spectator = mockPlayer('partspec', 'PartSpec', { score: 3 });

		const MOCK_RENDER_CTX: RenderCtx = {
			id: '#TEMP',
			header: 'Your turn!',
			$T: i18n(),
			freeGrid: false,
			round: 2,
			bag: [
				...Array.from({ length: 8 }, () => Tile.Water),
				...Array.from({ length: 6 }, () => Tile.Electric),
				...Array.from({ length: 5 }, () => Tile.Fire),
				...Array.from({ length: 7 }, () => Tile.Grass),
				...Array.from({ length: 4 }, () => Tile.Dark),
			],
			board: {
				factories: [
					[Tile.Water, Tile.Fire, Tile.Water, Tile.Electric],
					[Tile.Dark, Tile.Grass, Tile.Dark, Tile.Grass],
					[Tile.Fire, Tile.Fire, Tile.Water, Tile.Fire],
					[Tile.Electric, Tile.Dark, Tile.Fire, Tile.Grass],
					[Tile.Water, Tile.Water, Tile.Water, Tile.Water],
					[Tile.Electric, Tile.Fire, Tile.Electric, Tile.Fire],
					[Tile.Grass, Tile.Dark, Tile.Dark, Tile.Dark],
				],
				center: {
					first: true,
					[Tile.Water]: 3,
					[Tile.Electric]: 2,
					[Tile.Fire]: 2,
					[Tile.Dark]: 2,
					[Tile.Grass]: 1,
				},
			},
			view: {
				type: 'player',
				active: true,
				self: 'partman',
				action: VIEW_ACTION_TYPE.PLACE,
				source: 0,
				color: Tile.Water,
				count: 2,
				tookFirst: false,
			},
			turns: ['partman', 'partbot', 'partspec'],
			players: {
				partman,
				partbot,
				partspec: spectator,
			},
		};

		return jsxToHTML(render.bind({ msg: 'test' })(MOCK_RENDER_CTX));
	} catch (err) {
		return err instanceof Error ? ansiToHtml(err.message) : 'Something went wrong!';
	}
};
