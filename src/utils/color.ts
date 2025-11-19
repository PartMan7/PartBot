// region Types
export type Hex = string & { __hex: true };

/**
 * rgba() colorspace.
 * @property R A number from 0-255 representing red.
 * @property G A number from 0-255 representing green.
 * @property B A number from 0-255 representing blue.
 * @property a A number from 0-1 representing alpha. Assumed 1 if not set.
 */
export type Rgb = {
	R: number;
	G: number;
	B: number;
	a?: number;
	colorspace: 'rgba';
};
export type RgbString = string & { __rgba: true };

/**
 * lrgb() colorspace.
 * @property R A number from 0-255 representing red.
 * @property G A number from 0-255 representing green.
 * @property B A number from 0-255 representing blue.
 * @property a A number from 0-1 representing alpha. Assumed 1 if not set.
 */
export type Lrgb = {
	R: number;
	G: number;
	B: number;
	a?: number;
	colorspace: 'lrgb';
};

/**
 * CIE XYZ D50 colorspace.
 * @property X No idea. I'm sorry.
 * @property Y No idea. I'm sorry.
 * @property Z No idea. I'm sorry.
 * @property a A number from 0-1 representing alpha. Assumed 1 if not set.
 */
export type Xyz50 = {
	X: number;
	Y: number;
	Z: number;
	a?: number;
	colorspace: 'xyz50';
};

/**
 * hsla() colorspace.
 * @property H A number from 0-360 representing hue.
 * @property S A number from 0-100 representing saturation.
 * @property L A number from 0-100 representing lightness.
 * @property a A number from 0-1 representing alpha. Assumed 1 if not set.
 */
export type Hsl = {
	H: number;
	S: number;
	L: number;
	a?: number;
	colorspace: 'hsla';
};
export type HslString = string & { __hsla: true };

/**
 * oklab() colorspace.
 * @property L A number from 0-1 representing perceived lightness.
 * @property A A number from ~-0.5-~0.5 representing green (negative) - red (positive).
 * @property B A number from ~-0.5-~0.5 representing blue (negative) - yellow (positive).
 * @property a A number from 0-1 representing alpha. Assumed 1 if not set.
 */
export type Oklab = {
	L: number;
	A: number;
	B: number;
	a?: number;
	colorspace: 'oklab';
};

/**
 * oklch() colorspace.
 * @property L A number from 0-1 representing perceived lightness.
 * @property C A number from 0-~0.5 representing chroma.
 * @property H A number from 0-360 representing hue angle.
 * @property a A number from 0-1 representing alpha. Assumed 1 if not set.
 */
export type Oklch = {
	L: number;
	C: number;
	H: number;
	a?: number;
	colorspace: 'oklch';
};
export type OklchString = string & { __oklch: string };

// endregion Types

export function normalizeHue(hue: number): number {
	const deg = hue % 360;
	return deg < 0 ? deg + 360 : deg;
}

// region Conversion Methods

export function StringToHex(hex: string): Hex | null {
	const hexVal = hex.replace(/^#/, '');
	if (![3, 4, 6, 8].includes(hexVal.length)) return null;
	if (/^[0-9a-f]+$/i.test(hexVal)) return hexVal as Hex;
	return null;
}

export function HexToRgb(hex: Hex): Rgb {
	const hexVal = StringToHex(hex);
	if (!hexVal) return { R: 0, G: 0, B: 0, colorspace: 'rgba' };
	const isShortHand = hex.length === 3 || hex.length === 4;

	const R = parseInt(isShortHand ? hexVal.substring(0, 1).repeat(2) : hexVal.substring(0, 2), 16);
	const G = parseInt(isShortHand ? hexVal.substring(1, 2).repeat(2) : hexVal.substring(2, 4), 16);
	const B = parseInt(isShortHand ? hexVal.substring(2, 3).repeat(2) : hexVal.substring(4, 6), 16);
	const a = parseInt(isShortHand ? hexVal.substring(3, 4).repeat(2) : hexVal.substring(6, 8), 16);
	const rgba: Rgb = { colorspace: 'rgba', R, G, B };
	if (hex.length === 4 || hex.length === 8) rgba.a = a;
	return rgba;
}

export function RgbToHex({ R, G, B, a }: Rgb): Hex {
	return `${[R, G, B, ...(a! < 1 ? [Math.round(a! * 255)] : [])]
		.map(n => (Number.isNaN(n) ? 10 : Math.round(Math.min(Math.max(n, 0), 255))).toString(16).padStart(2, '0'))
		.join('')}` as Hex;
}

export function RgbToHsl({ R, G, B, a }: Rgb): Hsl {
	const [r, g, b] = [R / 255, G / 255, B / 255];
	const L = Math.max(r, g, b);
	const S = L - Math.min(r, g, b);
	const H = S ? (L === r ? (g - b) / S : L === G ? 2 + (b - r) / S : 4 + (r - g) / S) : 0;
	const hsl: Hsl = {
		H: Math.round(60 * H < 0 ? 60 * H + 360 : 60 * H),
		S: Math.round(100 * (S ? (L <= 0.5 ? S / (2 * L - S) : S / (2 - (2 * L - S))) : 0)),
		L: Math.round((100 * (2 * L - S)) / 2),
		colorspace: 'hsla',
	};
	if (typeof a === 'number') hsl.a = a;
	return hsl;
}

export function HslToRgb(hsl: Hsl): Rgb {
	const H = Math.round(hsl.H);
	const S = Math.round(hsl.S) / 100;
	const L = Math.round(hsl.L) / 100;
	const k = (n: number): number => (n + H / 30) % 12;
	const A = S * Math.min(L, 1 - L);
	const f = (n: number): number => L - A * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	const rgb: Rgb = {
		colorspace: 'rgba',
		R: Math.round(255 * f(0)),
		G: Math.round(255 * f(8)),
		B: Math.round(255 * f(4)),
	};
	if (typeof hsl.a === 'number') rgb.a = hsl.a;
	return rgb;
}

export function HslToHex(hsl: Hsl): Hex {
	return RgbToHex(HslToRgb(hsl));
}

export function HexToHsl(hex: Hex): Hsl {
	return RgbToHsl(HexToRgb(hex));
}

export function RgbToLrgb({ R, G, B, a }: Rgb): Lrgb {
	const mapper = (c = 0) => {
		const abs = Math.abs(c);
		if (abs <= 0.04045) {
			return c / 12.92;
		}
		return (Math.sign(c) || 1) * Math.pow((abs + 0.055) / 1.055, 2.4);
	};
	const lrgb: Lrgb = {
		colorspace: 'lrgb',
		R: mapper(R / 255),
		G: mapper(G / 255),
		B: mapper(B / 255),
	};
	if (typeof a === 'number') lrgb.a = a;
	return lrgb;
}

export function LrgbToRgb({ R, G, B, a }: Lrgb): Rgb {
	const mapper = (c: number): number => {
		const abs = Math.abs(c);
		if (abs > 0.0031308) {
			return Math.round((Math.sign(c) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055) * 255);
		}
		return Math.round(c * 12.92 * 255);
	};
	const rgb: Rgb = {
		colorspace: 'rgba',
		R: mapper(R),
		G: mapper(G),
		B: mapper(B),
	};
	if (typeof a === 'number') rgb.a = a;
	return rgb;
}

export function LrgbToOklab({ R, G, B, a }: Lrgb): Oklab {
	const L = Math.cbrt(0.412221469470763 * R + 0.5363325372617348 * G + 0.0514459932675022 * B);
	const M = Math.cbrt(0.2119034958178252 * R + 0.6806995506452344 * G + 0.1073969535369406 * B);
	const S = Math.cbrt(0.0883024591900564 * R + 0.2817188391361215 * G + 0.6299787016738222 * B);

	const oklab: Oklab = {
		colorspace: 'oklab',
		L: 0.210454268309314 * L + 0.7936177747023054 * M - 0.0040720430116193 * S,
		A: 1.9779985324311684 * L - 2.4285922420485799 * M + 0.450593709617411 * S,
		B: 0.0259040424655478 * L + 0.7827717124575296 * M - 0.8086757549230774 * S,
	};

	if (typeof a === 'number') oklab.a = a;
	return oklab;
}

export function OklabToLrgb({ L, A, B, a }: Oklab): Lrgb {
	const l = Math.pow(L + 0.3963377773761749 * A + 0.2158037573099136 * B, 3);
	const m = Math.pow(L - 0.1055613458156586 * A - 0.0638541728258133 * B, 3);
	const s = Math.pow(L - 0.0894841775298119 * A - 1.2914855480194092 * B, 3);

	const lrgb: Lrgb = {
		colorspace: 'lrgb',
		R: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		G: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		B: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	};

	if (typeof a === 'number') lrgb.a = a;
	return lrgb;
}

export function OklabToOklch({ L, A, B, a }: Oklab): Oklch {
	const C = Math.sqrt(A ** 2 + B ** 2);
	const oklch: Oklch = {
		colorspace: 'oklch',
		L,
		C,
		H: C ? normalizeHue((Math.atan2(B, A) * 180) / Math.PI) : 0,
	};
	if (typeof a === 'number') oklch.a = a;
	return oklch;
}

export function OklchToOklab({ L, C, H, a }: Oklch): Oklab {
	const oklab: Oklab = {
		colorspace: 'oklab',
		L,
		A: C ? C * Math.cos((H * Math.PI) / 180) : 0,
		B: C ? C * Math.sin((H * Math.PI) / 180) : 0,
	};
	if (typeof a === 'number') oklab.a = a;
	return oklab;
}

export function HexToOklab(hex: Hex): Oklab {
	return LrgbToOklab(RgbToLrgb(HexToRgb(hex)));
}

export function RgbToOklch(rgb: Rgb): Oklch {
	return OklabToOklch(LrgbToOklab(RgbToLrgb(rgb)));
}

export function HexToOklch(hex: Hex): Oklch {
	return RgbToOklch(HexToRgb(hex));
}

export function OklchToHex(oklch: Oklch): Hex {
	return RgbToHex(LrgbToRgb(OklabToLrgb(OklchToOklab(oklch))));
}

// endregion Conversion Methods

/**
 * Converts a number to a decimal as needed with default precision 4
 */
function n(num: number): string {
	return num.toFixed(4).replace(/(?<=\.\d+)0+$|\.0+/, '');
}

// region Stringifiers

export function RgbToString({ R, G, B, a }: Rgb): RgbString {
	const rgbString = `${n(R)}, ${n(G)}, ${n(B)}`;
	return (typeof a === 'number' ? `rgba(${rgbString}, ${n(a * 100)}%)` : `rgb(${rgbString})`) as RgbString;
}

export function HslToString({ H, S, L, a }: Hsl): HslString {
	const hslString = `${n(H)}, ${n(S)}%, ${n(L)}%`;
	return (typeof a === 'number' ? `hsla(${hslString}, ${n(a * 100)}%)` : `hsl(${hslString})`) as HslString;
}

export function OklchToString({ L, C, H, a }: Oklch): OklchString {
	return `oklch(${n(L)} ${n(C)} ${n(H)}${typeof a === 'number' ? ` ${n(a * 100)}%` : ''})` as OklchString;
}

// endregion Stringifiers
