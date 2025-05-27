import type { ThemeColours } from '@/ps/games/chess/types';
import type { Theme } from '@/ps/games/common';

export const defaultTheme = 'default';

export const CHESS_THEMES: Record<string, Theme<ThemeColours>> = {
	default: {
		id: 'default',
		name: 'Default',
		aliases: ['standard'],
		colors: {
			W: '#fff',
			B: '#9c5624',
			sel: '#87cefa',
			hl: '#adff2fa5',
			last: '#ff330019',
		},
	},
	snow: {
		id: 'snow',
		name: 'Snow',
		aliases: ['pristine', 'white'],
		colors: {
			W: '#fff',
			B: '#ddd',
			sel: '#99e6e6',
			hl: '#c2ff6666',
			last: '#ff330016',
		},
	},
	ocean: {
		id: 'ocean',
		name: 'Ocean',
		aliases: ['sea', 'deep', 'blue'],
		colors: {
			W: '#7DACC9',
			B: '#5486B0',
			sel: '#87CEFA',
			hl: '#00E6B8',
			last: null,
		},
	},
	spooky: {
		id: 'spooky',
		name: 'Spooky',
		aliases: ['halloween', 'ghost'],
		colors: {
			W: '#523f69',
			B: '#332849',
			sel: 'rgba(237,160,61)',
			hl: 'rgba(255,172,64,0.6)',
			last: 'rgba(160,160,225,0.4)',
		},
	},
	ii: {
		id: 'ii',
		name: 'II',
		aliases: ['audiino', 'candy', 'purple', 'ii88'],
		colors: {
			W: '#f08dcb',
			B: '#8e209f',
			sel: '#da8b37',
			hl: '#f1ca67d8',
			last: '#801c5fbf',
		},
	},
};
