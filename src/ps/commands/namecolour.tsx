import { Tools as ClientTools } from 'ps-client';

import type { PSCommand } from '@/types/chat';

function hslToRgb(h: number, s: number, l: number): [r: number, g: number, b: number] {
	// input [[0, 360], [0, 100], [0, 100]]
	let r: number, g: number, b: number;

	h /= 360;
	s /= 100;
	l /= 100;

	if (s === 0) r = g = b = l;
	else {
		const hue2rgb = (p: number, q: number, t: number): number => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${('0' + r.toString(16)).slice(-2)}${('0' + g.toString(16)).slice(-2)}${('0' + b.toString(16)).slice(-2)}`;
}

function convertedColors(hsl: [number, number, number]): { hex: string; rgb: string; hsl: string } {
	const rgb = hslToRgb(...hsl);
	const hex = rgbToHex(...rgb);
	const [h, s, l] = hsl;
	return { hex, rgb: `rgb(${rgb.join(',')})`, hsl: `hsl(${h}, ${s}%, ${l}%)` };
}

export const command: PSCommand = {
	name: 'namecolour',
	help: "Displays a user's namecolour!",
	syntax: 'CMD [user?]',
	aliases: ['namecolor'],
	categories: ['utility'],
	async run({ message, arg, broadcastHTML }) {
		const target = arg || message.author.name;
		const data = ClientTools.HSL(target);
		const current = convertedColors(data.hsl);
		const original = data.base ? convertedColors(data.base.hsl) : null;

		return broadcastHTML(
			<div className="infobox">
				<b>Current</b>: <b style={{ color: current.hsl }}>{target}</b> | {current.hex} | {current.rgb} | {current.hsl}
				{original ? (
					<>
						{' '}
						(from <b style={{ color: current.hsl }}>{data.source}</b>)
						<br />
						<b>Original</b>: <b style={{ color: original.hsl }}>{target}</b> | {original.hex} | {original.rgb} | {original.hsl}
					</>
				) : null}
			</div>
		);
	},
};
