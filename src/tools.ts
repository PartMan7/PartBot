export function toId (str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function uploadToPastie (text: string): Promise<string> {
	const res = await axios.post(`https://pastie.io/documents`, text);
	return `https://pastie.io/raw/${res.data.key as string}`;
}

export function toHumanTime (timeInMs: number, format: 'f2s' | 'hhmmss' | 'abs' = 'f2s'): string {
	const timeList: ({
		abbr: string,
		name: string,
		plur: string
	} | [number, number?])[] = [{
		abbr: 'ms',
		name: 'millisecond',
		plur: 'milliseconds'
	}, [1000], {
		abbr: 'sec',
		name: 'second',
		plur: 'seconds'
	}, [60], {
		abbr: 'min',
		name: 'minute',
		plur: 'minutes'
	}, [60], {
		abbr: 'hr',
		name: 'hour',
		plur: 'hours'
	}, [24], {
		abbr: 'day',
		name: 'day',
		plur: 'days'
	}, [7], {
		abbr: 'wk',
		name: 'week',
		plur: 'weeks'
	}, [365, 7], {
		abbr: 'yr',
		name: 'year',
		plur: 'years'
	}, [10], {
		abbr: 'dec',
		name: 'decade',
		plur: 'decades'
	}];
	const { entries: timeEntries }: {
		scale: number,
		entries: {
			abbr: string,
			name: string,
			plur: string,
			time: number,
			count?: number
		}[]
	} = timeList.reduce((acc, current) => {
		if (Array.isArray(current)) {
			const [mult, div = 1] = current;
			acc.scale *= mult / div;
		} else acc.entries.push({ ...current, time: acc.scale });
		return acc;
	}, { entries: [], scale: 1 });
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
			const firstIndex = timeEntries.findIndex(entry => entry.count > 0);
			if (firstIndex === -1) return '0 ms';
			return timeEntries
				.slice(firstIndex, firstIndex + 2)
				.filter(entry => entry.count)
				.map(entry => `${entry.count} ${entry.count === 1 ? entry.name : entry.plur}`)
				.join(' and ');
		}
		case 'hhmmss': {
			const [ms, s, m, h, d] = timeEntries.map(entry => entry.count);
			return `${d ? `${d}:` : ''}${d || h ? `${h}:` : ''}${m}:${s}${ms ? `.${ms}` : ''}`;
		}
		case 'f2s': default: {
			return timeEntries
				.filter(entry => entry.count)
				.reverse()
				.slice(0, 2)
				.map(entry => `${entry.count} ${entry.count === 1 ? entry.name : entry.plur}`)
				.join(' and ') || '0 ms';
		}
	}
}

export function fromHumanTime (text: string): number {
	text = text.replace(/(?:^| )an? /ig, '1');
	text = text.toLowerCase().replace(/[^a-z0-9.:]/g, '');
	const digital = text.match(/^(?:(\d+):)?(\d+):(\d+):(\d+)$/);
	if (digital) {
		const [, day, hrs, min, sec]: string[] = digital;
		return (parseInt(day) || 0) * 24 * 60 * 60 * 1000 +
			(parseInt(hrs) || 0) * 60 * 60 * 1000 +
			(parseInt(min) || 0) * 60 * 1000 +
			(parseInt(sec) || 0)  * 1000;
	} else text = text.replace(/:/g, '');
	let time = 0;
	const units = {
		mis: {
			regex: /\d+(?:\.\d+)?m(?:illi)?s(?:ec(?:ond?)?s?)?/,
			length: 1
		},
		sec: {
			regex: /\d+(?:\.\d+)?(?:s(?:ec(?:onds?)?)?)/,
			length: 1000
		},
		min: {
			regex: /\d+(?:\.\d+)?m(?:in(?:ute?)?s?)?/,
			length: 60 * 1000
		},
		hrs: {
			regex: /\d+(?:\.\d+)?(?:h(?:(?:ou)?r)?)s?/,
			length: 60 * 60 * 1000
		},
		day: {
			regex: /\d+(?:\.\d+)?d(?:ays?)?/,
			length: 24 * 60 * 60 * 1000
		},
		wks: {
			regex: /\d+(?:\.\d+)?(?:w(?:(?:ee)?k)?)s?/,
			length: 7 * 24 * 60 * 60 * 1000
		}
	};
	Object.values(units).forEach(unit => {
		const match = text.match(unit.regex);
		if (!match) return;
		text = text.replace(match[0], '');
		time += parseFloat(match[0]) * unit.length;
	});
	return time;
}
