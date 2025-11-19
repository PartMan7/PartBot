import { StringToHex } from '@/utils/color';

export const TOKEN_COLORS = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9e00ff', '#ff00ff'].map(
	color => StringToHex(color)!
);
