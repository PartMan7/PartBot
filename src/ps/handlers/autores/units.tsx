export type UnitType = 'length' | 'weight' | 'volume' | 'temperature';
export type UnitSystem = 'metric' | 'imperial' | 'other';

export type UnitAtom = {
	count: number;
	unit: string;
	formatted: string;
};

export type UnitDef = {
	id: string;
	type: UnitType;
	system: UnitSystem;
	expressions: string[];
	regex: RegExp;
};

export type UnitCluster = {
	index: number;
	units: UnitAtom[];
};

export type UnitFormat = {
	full: string;
	short: string;
	data: UnitCluster;
};

// `base` converts to meters (length) or kilograms (weight).
type UnitInfo = { singular: string; plural: string; base?: number };

const unitInfo: Record<string, UnitInfo> = {
	ft: { singular: 'foot', plural: 'feet', base: 0.3048 },
	in: { singular: 'inch', plural: 'inches', base: 0.0254 },
	mi: { singular: 'mile', plural: 'miles', base: 1609.344 },
	km: { singular: 'kilometer', plural: 'kilometers', base: 1000 },
	m: { singular: 'meter', plural: 'meters', base: 1 },
	cm: { singular: 'centimeter', plural: 'centimeters', base: 0.01 },
	mm: { singular: 'millimeter', plural: 'millimeters', base: 0.001 },
	lb: { singular: 'pound', plural: 'pounds', base: 0.45359237 },
	kg: { singular: 'kilogram', plural: 'kilograms', base: 1 },
	g: { singular: 'gram', plural: 'grams', base: 0.001 },
	oz: { singular: 'ounce', plural: 'ounces', base: 0.028349523125 },
	C: { singular: '°C', plural: '°C' },
	F: { singular: '°F', plural: '°F' },
};

const unitDefinitions: UnitDef[] = [
	{
		id: 'feet-inches',
		type: 'length',
		system: 'imperial',
		expressions: ['ft', 'in', 'in'],
		regex:
			// eslint-disable-next-line max-len -- @link /docs/REGEX.md
			/\b(?:(?:(\d{1,5}(?:[\.,]\d{1,5})?)(?: ?f(?:eet|oot|t)|(?<!(?:^|\s)'[^']*)'(?![a-z])))(?:(?:(?: and| &|,)?) ?((?:\d{1,5}(?:[\.,]\d{1,5})?))(?: ?inch(?:es)?|in|"|))?|((?:\d{1,5}(?:[\.,]\d{1,5})?))(?: ?inch(?:es)?|in|"))(?:\b| |$)/gi,
	},
	{
		id: 'miles',
		type: 'length',
		system: 'imperial',
		expressions: ['mi'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?mi(?:les?)?\b/gi,
	},
	{
		id: 'kilometers',
		type: 'length',
		system: 'metric',
		expressions: ['km'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?k(?:ilo)?m(?:et(?:er|re))?s?\b/gi,
	},
	{
		id: 'meters',
		type: 'length',
		system: 'metric',
		expressions: ['m'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?m(?:et(?:er|re)s?)?\b/gi,
	},
	{
		id: 'centimeters',
		type: 'length',
		system: 'metric',
		expressions: ['cm'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?c(?:enti)?m(?:et(?:er|re))?s?\b/gi,
	},
	{
		id: 'millimeters',
		type: 'length',
		system: 'metric',
		expressions: ['mm'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?m(?:illi)?m(?:et(?:er|re))?s?\b/gi,
	},
	{
		id: 'pounds',
		type: 'weight',
		system: 'imperial',
		expressions: ['lb'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?(?:lb|pound)s?\b/gi,
	},
	{
		id: 'kilograms',
		type: 'weight',
		system: 'metric',
		expressions: ['kg'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?k(?:ilo)?g(?:ram)?s?\b/gi,
	},
	{
		id: 'grams',
		type: 'weight',
		system: 'metric',
		expressions: ['g'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?g(?:rams?)?\b/gi,
	},
	{
		id: 'ounces',
		type: 'weight',
		system: 'imperial',
		expressions: ['oz'],
		regex: /\b(\d{1,5}(?:[\.,]\d{1,5})?) ?(?:oz|ounces?)\b/gi,
	},
	{
		id: 'celsius',
		type: 'temperature',
		system: 'metric',
		expressions: ['C'],
		regex: /(?<![\d.,])(-?\d{1,3}(?:[\.,]\d{1,2})?) ?°? ?C\b/g,
	},
	{
		id: 'fahrenheit',
		type: 'temperature',
		system: 'imperial',
		expressions: ['F'],
		regex: /(?<![\d.,])(-?\d{1,3}(?:[\.,]\d{1,2})?) ?°? ?F\b/g,
	},
];

const unitName = (unit: string, count: number) => (count === 1 ? unitInfo[unit].singular : unitInfo[unit].plural);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function parseUnits(message: string): UnitCluster[] {
	return unitDefinitions
		.flatMap(({ regex, expressions: unitKeys }) =>
			[...message.matchAll(regex)].map(match => ({
				index: match.index!,
				units: unitKeys.flatMap((unit, i) => {
					const captured = match[i + 1];
					if (!captured) return [];
					const count = Number(captured.replace(',', '.'));
					return [{ count, unit, formatted: `${count} ${unitName(unit, count)}` }];
				}),
			}))
		)
		.sortBy(c => c.index, 'asc');
}

export function formatUnits(clusters: UnitCluster[], targetSystem: UnitSystem | 'toggle' = 'toggle'): UnitFormat[] {
	// target should be imperial if metric, metric if imperial or other
	return clusters.map(({ units }) => {
		const def = unitDefinitions.find(e => e.expressions.includes(units[0].unit))!;
		const target = targetSystem === 'toggle' ? (def.system === 'metric' ? 'imperial' : 'metric') : targetSystem;

		if (def.system === target) {
			return {
				full: units.map(({ formatted }) => formatted).join(' '),
				short: units.map(({ count, unit }) => `${count} ${unit}`).join(' '),
				data: { index: clusters.findIndex(c => c.units.some(u => u.unit === units[0].unit))!, units },
			};
		}

		if (def.type === 'temperature') {
			const { count, unit } = units[0];
			const [target, value] = unit === 'C' ? ['F', (count * 9) / 5 + 32] : ['C', ((count - 32) * 5) / 9];
			const rounded = round2(value);
			return {
				full: `~${rounded} ${unitName(target, rounded)}`,
				short: `~${rounded}°${target}`,
				data: {
					index: clusters.findIndex(c => c.units.some(u => u.unit === units[0].unit))!,
					units: [{ count, unit: target, formatted: `~${rounded}°${target}` }],
				},
			};
		}

		const base = units.reduce((sum, { count, unit }) => sum + count * unitInfo[unit].base!, 0);

		if (def.type === 'length' && def.system === 'metric') {
			const inches = Math.round(base / unitInfo.in.base!);
			const feet = Math.floor(inches / 12);
			const rest = inches % 12;
			const showRest = rest / inches >= 0.01;
			return {
				full: `~${feet} ${unitName('ft', feet)}${showRest ? `, ${rest} ${unitName('in', rest)}` : ''}`,
				short: `~${feet} ft${showRest ? ` ${rest} in` : ''}`,
				data: {
					index: clusters.findIndex(c => c.units.some(u => u.unit === units[0].unit))!,
					units: [
						{ count: feet, unit: 'ft', formatted: `~${feet} feet${showRest ? `, ${rest} inches` : ''}` },
						{ count: rest, unit: 'in', formatted: `~${rest} inches` },
					],
				},
			};
		}

		const [unit, value] =
			def.type === 'length'
				? base < 2
					? ['cm', base * 100]
					: ['m', base]
				: def.system === 'imperial'
					? ['kg', base]
					: ['lb', base / unitInfo.lb.base!];
		const rounded = round2(value);
		return {
			full: `~${rounded} ${unitName(unit, rounded)}`,
			short: `~${rounded} ${unit}`,
			data: {
				index: clusters.findIndex(c => c.units.some(u => u.unit === units[0].unit))!,
				units: [{ count: rounded, unit, formatted: `~${rounded} ${unit}` }],
			},
		};
	});
}
