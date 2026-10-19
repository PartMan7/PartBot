import { psHSL } from '@/ps/datacenters';
import { HslToRgb, HslToString, RgbToHex, RgbToString } from '@/utils/color';

import type { PSCommand } from '@/types/chat';
import type { Hsl } from '@/utils/color';

function convertedColors([H, S, L]: [number, number, number]): { hex: string; rgb: string; hsl: string } {
	const hsl: Hsl = { H, S, L, colorspace: 'hsla' };
	const rgb = HslToRgb(hsl);
	const hex = RgbToHex(rgb);
	return { hex, rgb: RgbToString(rgb), hsl: HslToString(hsl) };
}

export const command: PSCommand = {
	name: 'namecolour',
	help: "Displays a user's namecolour!",
	syntax: 'CMD [user?]',
	flags: { allowPMs: true },
	aliases: ['namecolor'],
	categories: ['utility'],
	async run({ message, arg, broadcastHTML }) {
		const target = arg || message.author.name;
		const data = psHSL(target);
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
