import '@/globals';

import { HexToOklch, StringToHex, normalizeHue } from '@/utils/color';

import type { Hex, Oklch } from '@/utils/color';

const TypeColors = {
	Colorless: { hex: StringToHex('#D2D0CF')!, image: 'colorless.png', name: 'Colorless' },
	Dark: { hex: StringToHex('#2E7077')!, image: 'dark.png', name: 'Dark' },
	Dragon: { hex: StringToHex('#9B9E8C')!, image: 'dragon.png', name: 'Dragon' },
	Electric: { hex: StringToHex('#FCD021')!, image: 'electric.png', name: 'Electric' },
	Fairy: { hex: StringToHex('#D6457E')!, image: 'fairy.png', name: 'Fairy' },
	Fighting: { hex: StringToHex('#B16232')!, image: 'fighting.png', name: 'Fighting' },
	Fire: { hex: StringToHex('#D8223B')!, image: 'fire.png', name: 'Fire' },
	Grass: { hex: StringToHex('#19A648')!, image: 'grass.png', name: 'Grass' },
	Psychic: { hex: StringToHex('#957DAB')!, image: 'psychic.png', name: 'Psychic' },
	Steel: { hex: StringToHex('#9B9E8C')!, image: 'steel.png', name: 'Steel' },
	Water: { hex: StringToHex('#05A8D9')!, image: 'water.png', name: 'Water' },
} satisfies Record<string, { hex: Hex; image: string; name: string }>;

function imageUrl(imagePath: string): string {
	return `${process.env.WEB_URL}/static/types/${imagePath}`;
}

export function oklchDiff({ H: H1, C: C1, L: L1 }: Oklch, { H: H2, C: C2, L: L2 }: Oklch): number {
	const dL = Math.abs(L1 - L2);
	let dH = Math.abs(normalizeHue(H1) - normalizeHue(H2));
	if (dH > 180) dH = 360 - dH;
	const hueTerm = 2 * Math.sqrt(C1 * C2) * Math.sin((dH * Math.PI) / 360);
	return Math.hypot(C1 - C2, hueTerm, dL);
}

export type TypeTokenStyle = { imageUrl: string; name: string; bgHex: Hex };

type User = { id: string; color: Hex };

function getPreferenceList(
	group1: User[] | Hex[],
	group2: Hex[] | User[],
	distance: (a: Hex, b: Hex) => number
): Map<string, (User | Hex)[]> {
	const prefs = new Map<string, (Hex | User)[]>();

	group1.forEach(entry1 => {
		const sorted = [...group2].sortBy(
			entry2 => distance(typeof entry1 === 'string' ? entry1 : entry1.color, typeof entry2 === 'string' ? entry2 : entry2.color),
			'asc'
		);
		prefs.set(typeof entry1 === 'string' ? entry1 : entry1.id, sorted);
	});

	return prefs;
}

export function colorSampler(
	users: User[],
	availableColors: Hex[],
	distance: (color1: Hex, color2: Hex) => number = (hex1, hex2) => oklchDiff(HexToOklch(hex1), HexToOklch(hex2))
): (User & { assigned: Hex })[] {
	const inputColors = Object.values(users);
	if (inputColors.length > availableColors.length)
		throw new Error(`Insufficient colours (needed ${inputColors.length} but had ${availableColors.length})!`);

	const userPrefs = getPreferenceList(users, availableColors, distance) as Map<string, Hex[]>;
	const itemPrefs = getPreferenceList(availableColors, users, (item, user) => distance(user, item)) as Map<Hex, User[]>;

	const userMatches = new Map<string, Hex | null>();
	const itemMatches = new Map<Hex, string | null>();
	const userNextProposalIndex = new Map<string, number>();

	users.forEach(user => {
		userMatches.set(user.id, null);
		userNextProposalIndex.set(user.id, 0);
	});
	availableColors.forEach(color => itemMatches.set(color, null));

	let freeUsers = users.filter(user => userMatches.get(user.id) === null);

	while (freeUsers.length > 0) {
		for (const user of freeUsers) {
			const prefs = userPrefs.get(user.id)!;
			const nextIndex = userNextProposalIndex.get(user.id)!;

			if (nextIndex >= prefs.length) continue;

			const itemId = prefs[nextIndex];
			userNextProposalIndex.set(user.id, nextIndex + 1);

			const currentMatch = itemMatches.get(itemId);
			if (!currentMatch) {
				itemMatches.set(itemId, user.id);
				userMatches.set(user.id, itemId);
			} else {
				const itemPrefList = itemPrefs.get(itemId)!;
				if (itemPrefList.findIndex(entry => entry.id === user.id) < itemPrefList.findIndex(entry => entry.id === currentMatch)) {
					userMatches.set(currentMatch, null);
					itemMatches.set(itemId, user.id);
					userMatches.set(user.id, itemId);
				}
			}
		}

		freeUsers = users.filter(
			user => userMatches.get(user.id) === null && userNextProposalIndex.get(user.id)! < (userPrefs.get(user.id)?.length ?? 0)
		);
	}

	return users.map(user => ({
		id: user.id,
		color: user.color,
		assigned: userMatches.get(user.id)!,
	}));
}

export function typeColorSampler(users: User[]): (User & { assigned: TypeTokenStyle })[] {
	const lookupTable = Object.fromEntries(Object.entries(TypeColors).map(([key, value]) => [value.hex, key])) as Record<
		Hex,
		keyof typeof TypeColors
	>;

	const hexes = Object.values(TypeColors).map(type => type.hex);
	const matches = colorSampler(users, hexes);

	return matches.map(match => ({
		id: match.id,
		color: match.color,
		assigned: {
			imageUrl: imageUrl(TypeColors[lookupTable[match.assigned]].image),
			name: TypeColors[lookupTable[match.assigned]].name,
			bgHex: match.assigned,
		},
	}));
}
