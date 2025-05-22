import { checkHunts } from '@/ps/handlers/raw/scavengers';

export function rawHandler(room: string, data: string, isIntro: boolean): void {
	if (isIntro) return;
	// Hunts
	checkHunts(room, data);
}
