import { describe, expect, it } from 'vitest';

import { HexToOklch, StringToHex, normalizeHue } from '@/utils/color';
import { colorSampler, oklchDiff, typeColorSampler } from '@/utils/colorSampler';

import type { Oklch } from '@/utils/color';

function expectedOklchDistance(a: Oklch, b: Oklch): number {
	const dL = Math.abs(a.L - b.L);
	let dH = Math.abs(normalizeHue(a.H) - normalizeHue(b.H));
	if (dH > 180) dH = 360 - dH;
	const hueTerm = 2 * Math.sqrt(a.C * b.C) * Math.sin((dH * Math.PI) / 360);
	return Math.hypot(a.C - b.C, hueTerm, dL);
}

describe('oklchDiff', () => {
	it('is zero for identical colours', () => {
		const fire = HexToOklch(StringToHex('#D8223B')!);
		expect(oklchDiff(fire, fire)).toBeCloseTo(0);
	});

	it('is symmetric', () => {
		const a = HexToOklch(StringToHex('#D8223B')!);
		const b = HexToOklch(StringToHex('#05A8D9')!);
		expect(oklchDiff(a, b)).toBe(oklchDiff(b, a));
	});

	it('combines chroma, hue, and lightness with hypot', () => {
		const a: Oklch = { L: 0.55, C: 0.18, H: 25, colorspace: 'oklch' };
		const b: Oklch = { L: 0.75, C: 0.18, H: 85, colorspace: 'oklch' };
		expect(oklchDiff(a, b)).toBeCloseTo(expectedOklchDistance(a, b));
	});

	it('includes chroma delta when either chroma is zero', () => {
		const a: Oklch = { L: 0.4, C: 0, H: 0, colorspace: 'oklch' };
		const b: Oklch = { L: 0.8, C: 0.12, H: 200, colorspace: 'oklch' };
		expect(oklchDiff(a, b)).toBeCloseTo(expectedOklchDistance(a, b));
	});
});

describe('colorSampler', () => {
	it('throws when there are more users than colours', () => {
		const red = StringToHex('#ff0000')!;
		const blue = StringToHex('#0000ff')!;
		expect(() =>
			colorSampler(
				[
					{ id: 'a', color: red },
					{ id: 'b', color: blue },
					{ id: 'c', color: red },
				],
				[red, blue]
			)
		).toThrow(/Insufficient colours/);
	});

	it('assigns each user a distinct colour', () => {
		const red = StringToHex('#ff0000')!;
		const blue = StringToHex('#0000ff')!;
		const green = StringToHex('#00ff00')!;
		const matches = colorSampler(
			[
				{ id: 'a', color: red },
				{ id: 'b', color: blue },
			],
			[red, blue, green],
			(a, b) => (a === b ? 0 : 1)
		);
		const assigned = matches.map(m => m.assigned);
		expect(new Set(assigned).size).toBe(2);
	});
});

describe('typeColorSampler', () => {
	it('maps assigned type hex to metadata', () => {
		const fire = StringToHex('#D8223B')!;
		const [match] = typeColorSampler([{ id: 'p1', color: fire }]);
		expect(match.assigned.name).toBe('Fire');
		expect(match.assigned.bgHex).toBe(fire);
		expect(match.assigned.imageUrl).toContain('fire.png');
	});

	it('assigns different types to two users with distinct colours', () => {
		const matches = typeColorSampler([
			{ id: 'p1', color: StringToHex('#D8223B')! },
			{ id: 'p2', color: StringToHex('#05A8D9')! },
		]);
		const names = matches.map(m => m.assigned.name);
		expect(names[0]).not.toBe(names[1]);
	});
});
