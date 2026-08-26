import '@/globals';

import { i18n } from '@/i18n';
import { ALL_PIECE_IDS, PIECES } from '@/ps/games/blokus/constants';
import { ansiToHtml } from '@/utils/ansiToHtml';
import { cachebustDir } from '@/utils/cachebust';
import { fsPath } from '@/utils/fsPath';
import { jsxToHTML } from '@/utils/jsxToHTML';

import type { RenderCtx } from '@/ps/games/blokus/types';

export const test: () => Promise<string> = async () => {
	try {
		cachebustDir(fsPath('ps', 'games'));
		const { render } = await import('@/ps/games/blokus/render');

		const partman = 'partman';
		const partbot = 'partbot';
		const size = 20;
		const board = Array.from({ length: size }, () => Array.from({ length: size }, () => null as string | null));

		board[0][0] = partman;
		board[0][1] = partman;
		board[1][0] = partman;
		board[1][1] = partman;

		board[size - 1][0] = partbot;
		board[size - 2][0] = partbot;
		board[size - 1][1] = partbot;
		board[size - 2][1] = partbot;

		board[2][2] = partman;
		board[3][3] = partman;
		board[4][4] = partman;
		board[3][2] = partbot;
		board[4][3] = partbot;

		const remaining = ALL_PIECE_IDS.slice(4);
		const piece = PIECES['8'];

		const MOCK_RENDER_CTX: RenderCtx = {
			id: '#TEMP',
			$T: i18n(),
			header: 'Your turn!',
			board,
			size,
			turn: partman,
			side: partman,
			isActive: true,
			playerIndex: { [partman]: 0, [partbot]: 3 },
			pieces: {
				[partman]: remaining,
				[partbot]: ALL_PIECE_IDS.slice(5),
			},
			players: {
				[partman]: { id: 'partman', name: 'PartMan' },
				[partbot]: { id: 'partbot', name: 'PartBot' },
			},
			selectedPiece: '8',
			selectedOrient: 1,
			orientations: piece.orientations,
			validAnchors: [
				[2, 4],
				[3, 4],
				[4, 2],
				[5, 3],
			],
			colors: ['#1e88e5', '#fdd835', '#e53935', '#43a047'],
		};

		return jsxToHTML(render.bind({ msg: 'test' })(MOCK_RENDER_CTX));
	} catch (err) {
		return err instanceof Error ? ansiToHtml(err.message) : 'Something went wrong!';
	}
};
