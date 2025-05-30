import type { CSSProperties } from 'react';

export const LB_STYLES: Record<string, { header?: CSSProperties; odd?: CSSProperties; even?: CSSProperties }> = {
	water: {
		header: { backgroundColor: '#0080ff' },
	},
	orange: {
		header: { backgroundColor: '#d30' },
	},
	purple: {
		header: { backgroundColor: '#a0d' },
		even: { backgroundColor: '#fce' },
	},
	cap: {
		header: { backgroundColor: '#62ebff', color: '#000' },
		even: { backgroundColor: '#eafcff' },
		odd: { backgroundColor: '#bcf6fe' },
	},
	dnd: {
		header: { borderColor: '#e5e4e2', color: '#e5e4e2', backgroundColor: '#bf1116' },
		even: { backgroundColor: '#a9a9a9' },
		odd: { backgroundColor: '#e3dac9' },
	},
};

export const LB_COMMON_STYLES: Record<'header' | 'row' | 'even' | 'odd', CSSProperties> = {
	header: {
		fontFamily: 'Arial, sans-serif',
		fontSize: '14px',
		fontWeight: 'bold',
		padding: '2px 5px',
		borderStyle: 'solid',
		borderWidth: '1px',
		overflow: 'hidden',
		wordBreak: 'normal',
		textAlign: 'center',
		verticalAlign: 'top',

		color: '#fff',
		borderColor: 'inherit',
	},

	row: {
		fontFamily: 'Arial, sans-serif',
		padding: '2px',
		borderStyle: 'solid',
		borderWidth: '1px',
		overflow: 'hidden',
		wordBreak: 'normal',
		textAlign: 'center',
		verticalAlign: 'top',
		fontWeight: 'bold',

		color: '#333',
		borderColor: 'inherit',
	},

	even: { backgroundColor: '#ccc' },
	odd: { backgroundColor: '#fff' },
};
