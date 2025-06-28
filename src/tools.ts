import type { TranslationFn } from '@/i18n/types';

// TODO: Move this all to @/utils

export function toId(str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

type Entry = {
	abbr: string;
	name: string;
	plur: string;
	time: number;
	count?: number;
};

export function toHumanTime(timeInMs: number, format: 'f2s' | 'hhmmss' | 'abs' = 'f2s', $T: TranslationFn): string {
	const timeList: (
		| {
				abbr: string;
				name: string;
				plur: string;
		  }
		| [number, number?]
	)[] = [
		{
			abbr: $T('COMMANDS.TIMER.MS.ABBR'),
			name: $T('COMMANDS.TIMER.MS.NAME'),
			plur: $T('COMMANDS.TIMER.MS.PLUR'),
		},
		[1000],
		{
			abbr: $T('COMMANDS.TIMER.SEC.ABBR'),
			name: $T('COMMANDS.TIMER.SEC.NAME'),
			plur: $T('COMMANDS.TIMER.SEC.PLUR'),
		},
		[60],
		{
			abbr: $T('COMMANDS.TIMER.MIN.ABBR'),
			name: $T('COMMANDS.TIMER.MIN.NAME'),
			plur: $T('COMMANDS.TIMER.MIN.PLUR'),
		},
		[60],
		{
			abbr: $T('COMMANDS.TIMER.HR.ABBR'),
			name: $T('COMMANDS.TIMER.HR.NAME'),
			plur: $T('COMMANDS.TIMER.HR.PLUR'),
		},
		[24],
		{
			abbr: $T('COMMANDS.TIMER.DAY.ABBR'),
			name: $T('COMMANDS.TIMER.DAY.NAME'),
			plur: $T('COMMANDS.TIMER.DAY.PLUR'),
		},
		[7],
		{
			abbr: $T('COMMANDS.TIMER.WK.ABBR'),
			name: $T('COMMANDS.TIMER.WK.NAME'),
			plur: $T('COMMANDS.TIMER.WK.PLUR'),
		},
		[365, 7],
		{
			abbr: $T('COMMANDS.TIMER.YR.ABBR'),
			name: $T('COMMANDS.TIMER.YR.NAME'),
			plur: $T('COMMANDS.TIMER.YR.PLUR'),
		},
		[10],
		{
			abbr: $T('COMMANDS.TIMER.DEC.ABBR'),
			name: $T('COMMANDS.TIMER.DEC.NAME'),
			plur: $T('COMMANDS.TIMER.DEC.PLUR'),
		},
	];
	const {
		entries: timeEntries,
	}: {
		scale: number;
		entries: Entry[];
	} = timeList.reduce(
		(acc, current) => {
			if (Array.isArray(current)) {
				const [mult, div = 1] = current;
				acc.scale *= mult / div;
			} else acc.entries.push({ ...current, time: acc.scale });
			return acc;
		},
		{ entries: [] as Entry[], scale: 1 }
	);
	if (format === 'hhmmss') timeEntries.splice(-3);
	let timeLeft = timeInMs;
	timeEntries.reverse().forEach(entry => {
		if (timeLeft >= entry.time) {
			const count = Math.floor(timeLeft / entry.time);
			entry.count = count;
			timeLeft -= count * entry.time;
		} else entry.count = 0;
	});
	timeEntries.reverse();
	switch (format) {
		case 'abs': {
			const firstIndex = timeEntries.findIndex(entry => entry.count! > 0);
			if (firstIndex === -1) return '0 ms';
			return timeEntries
				.slice(firstIndex, firstIndex + 2)
				.filter(entry => entry.count)
				.map(entry => `${entry.count} ${entry.count === 1 ? entry.name : entry.plur}`)
				.join(` ${$T('GRAMMAR.AND')} `);
		}
		case 'hhmmss': {
			const [ms, s, m, h, d] = timeEntries.map(entry => entry.count);
			return `${d ? `${d}:` : ''}${d || h ? `${h}:` : ''}${m}:${s}${ms ? `.${ms}` : ''}`;
		}
		case 'f2s':
		default: {
			return (
				timeEntries
					.filter(entry => entry.count)
					.reverse()
					.slice(0, 2)
					.map(entry => `${entry.count} ${entry.count === 1 ? entry.name : entry.plur}`)
					.join(` ${$T('GRAMMAR.AND')} `) || '0 ms'
			);
		}
	}
}

export function fromHumanTime(srcText: string): number {
	let text = srcText
		.toLowerCase()
		.replace(/(?:^| )an? /gi, '1')
		.replace(/[^a-z0-9.:]/g, '');
	const SEC_LENGTH = 1000;
	const MIN_LENGTH = 60 * SEC_LENGTH;
	const HOUR_LENGTH = 60 * MIN_LENGTH;
	const DAY_LENGTH = 24 * HOUR_LENGTH;
	const digital = text.match(/^(?:(\d+):)?(\d+):(\d+):(\d+)$/);
	if (digital) {
		const [, day, hrs, min, sec]: number[] = digital.map(str => parseInt(str));
		const dayTime = day * DAY_LENGTH;
		const hourTime = hrs * HOUR_LENGTH;
		const minTime = min * MIN_LENGTH;
		const secTime = sec * SEC_LENGTH;
		return dayTime + hourTime + minTime + secTime;
	} else text = text.replace(/:/g, '');
	let time = 0;
	const units = {
		mis: {
			regex: /\d+(?:\.\d+)?m(?:illi)?s(?:ec(?:ond?)?s?)?/,
			length: 1,
		},
		sec: {
			regex: /\d+(?:\.\d+)?s(?:ec(?:onds?)?)?/,
			length: SEC_LENGTH,
		},
		min: {
			regex: /\d+(?:\.\d+)?m(?:in(?:ute?)?s?)?/,
			length: MIN_LENGTH,
		},
		hrs: {
			regex: /\d+(?:\.\d+)?:h(?:(?:ou)?r)?s?/,
			length: HOUR_LENGTH,
		},
		day: {
			regex: /\d+(?:\.\d+)?d(?:ays?)?/,
			length: DAY_LENGTH,
		},
		wks: {
			regex: /\d+(?:\.\d+)?w(?:(?:ee)?k)?s?/,
			length: 7 * DAY_LENGTH,
		},
	};
	Object.values(units).forEach(({ regex, length }) => {
		const match = text.match(regex);
		if (!match) return;
		text = text.replace(match[0], '');
		time += parseFloat(match[0]) * length;
	});
	return time;
}
