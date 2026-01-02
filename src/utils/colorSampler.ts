import '@/globals';

import { HexToOklch, normalizeHue } from '@/utils/color';

import type { Hex, Oklch } from '@/utils/color';

function oklchDiff({ H: H1, C: C1 }: Oklch, { H: H2, C: C2 }: Oklch): number {
	if (!C1 || !C2) return 0;
	const dH = Math.sin((((normalizeHue(H1) - normalizeHue(H2) + 360) / 2) * Math.PI) / 180);
	return Math.abs(2 * Math.sqrt(C1 * C2) * dH);
}

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

		const itemId = prefs[nextIndex]!;
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
