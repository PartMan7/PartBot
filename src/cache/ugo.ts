import { Temporal } from '@js-temporal/polyfill';
import { uploadToPastie } from 'ps-client/tools';

import { usePersistedCache } from '@/cache/persisted';
import { TimeZone } from '@/ps/handlers/cron/constants';
import { BG_STRUCHNI_MODIFIER, BOARD_GAMES_STRUCHNI_ORDER, UGO_2025_SPOTLIGHTS } from '@/ps/specialEvents/constants';
import { Logger } from '@/utils/logger';
import { mapValues } from '@/utils/map';
import { toId } from '@/utils/toId';

import type { UGOBoardGames } from '@/ps/specialEvents/constants';
import type { Client } from 'ps-client';

export const UGO_PLAYED = usePersistedCache('ugoCap');

export function getUGOPlayed(game: UGOBoardGames, player: string): number {
	const playerId = toId(player);
	return Math.max(UGO_PLAYED.get()[playerId]?.[game] ?? 0, 0);
}

export function setUGOPlayed(game: UGOBoardGames, player: string, count: number | ((prevCount: number) => number)): void {
	const playerId = toId(player);
	const current = UGO_PLAYED.get();
	const currentCount = Math.max(current[playerId]?.[game] ?? 0, 0);
	(current[playerId] ??= {})[game] = typeof count === 'function' ? count(currentCount) : count;
	UGO_PLAYED.set(current);
}

export async function resetUGOPlayed(): Promise<string> {
	const backup = UGO_PLAYED.get();
	const url = await uploadToPastie(JSON.stringify(backup));
	UGO_PLAYED.set({});
	return url;
}

function parsePoints(data: Partial<UGOPoints>): UGOUserPoints {
	const games = Object.fromEntries(BOARD_GAMES_STRUCHNI_ORDER.map(game => [game, data[game] ?? 0])) as Partial<
		Record<UGOBoardGames, number>
	>;
	// Struchni
	const points =
		Math.floor(
			Object.values(games)
				.sortBy(null, 'desc')
				.reduce((sum, gamePoints, index) => sum + gamePoints * (1 + index * BG_STRUCHNI_MODIFIER))
		) + (data.event ?? 0);
	return { total: points, breakdown: data };
}

export type UGOPoints = Record<UGOBoardGames | 'event', number>;
export type UGOUserPoints = { total: number; breakdown: Partial<UGOPoints> };
export const UGO_POINTS = usePersistedCache('ugoPoints');

export function getUGOPoints(player: string): UGOUserPoints {
	const data = (UGO_POINTS.get()[toId(player)] ?? { points: {} }).points;
	return parsePoints(data);
}

export function getAllUGOPoints(): Record<string, UGOUserPoints> {
	const data = UGO_POINTS.get();
	return Object.fromEntries(
		Object.values(data).map(({ name, points }) => {
			return [name, parsePoints(points)];
		})
	);
}

export function addUGOPoints(this: Client, pointsData: Record<string, number>, game: UGOBoardGames | 'event'): void {
	const bonus = game !== 'event' && UGO_2025_SPOTLIGHTS.some(date => Temporal.Now.plainDateISO(TimeZone.GMT).equals(date)) ? 1.5 : 1;
	const current = UGO_POINTS.get();

	const commit = mapValues(pointsData, (points, player) => {
		const playerId = toId(player);
		const updatedPoints = ((current[playerId] ??= { name: '', points: {} }).points?.[game] ?? 0) + Math.floor(points * bonus);

		current[playerId].name = player.trim();
		current[playerId].points[game] = updatedPoints;
		return parsePoints(current[playerId].points).total;
	});
	UGO_POINTS.set(current);

	uploadToPastie(JSON.stringify(commit, null, 2)).then(url => {
		const command = `;setpointsfromjson boardgames, ${url}`;
		if (process.env.NODE_ENV === 'development') Logger.log(command);
		else this.addUser('UGO').send(command);
	});
}
