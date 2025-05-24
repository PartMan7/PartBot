import { fromHumanTime } from '@/tools';

export function sleep(timeInput: number | string): Promise<void> {
	const time = typeof timeInput === 'string' ? fromHumanTime(timeInput) : timeInput;
	return new Promise(resolve => setTimeout(() => resolve(), time));
}
