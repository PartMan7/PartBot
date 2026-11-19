import { describe, expect, it } from 'vitest';

import { formatUnits, parseUnits } from '@/ps/handlers/autores/units';

describe('parseUnits', () => {
	it('returns no clusters when there are no units', () => {
		expect(parseUnits('hello there')).toEqual([]);
	});

	it('parses metric length', () => {
		expect(parseUnits('I swam 100 meters today')).toEqual([{ index: 7, units: [{ count: 100, unit: 'm', formatted: '100 meters' }] }]);
	});

	it('parses decimals', () => {
		expect(parseUnits('I swam 0.5 meters today')).toEqual([{ index: 7, units: [{ count: 0.5, unit: 'm', formatted: '0.5 meters' }] }]);
	});

	it('parses feet and inches as one cluster', () => {
		expect(parseUnits(`I'm 5'10" tall`)).toEqual([
			{
				index: 4,
				units: [
					{ count: 5, unit: 'ft', formatted: '5 feet' },
					{ count: 10, unit: 'in', formatted: '10 inches' },
				],
			},
		]);
	});

	it('parses mass', () => {
		expect(parseUnits('it weighs 150 lbs')).toEqual([{ index: 10, units: [{ count: 150, unit: 'lb', formatted: '150 pounds' }] }]);
	});

	it('returns clusters sorted by index', () => {
		expect(parseUnits('I ran 5 km and 3 miles').map(c => c.index)).toEqual([6, 15]);
	});

	it('parses grams', () => {
		expect(parseUnits('I ate 500 g of rice')).toEqual([{ index: 6, units: [{ count: 500, unit: 'g', formatted: '500 grams' }] }]);
	});

	it('parses ounces', () => {
		expect(parseUnits('8 oz of milk')).toEqual([{ index: 0, units: [{ count: 8, unit: 'oz', formatted: '8 ounces' }] }]);
	});

	it('parses celsius', () => {
		expect(parseUnits('It is 20 C today')).toEqual([{ index: 6, units: [{ count: 20, unit: 'C', formatted: '20 °C' }] }]);
	});

	it('parses negative fahrenheit with degree sign', () => {
		expect(parseUnits('It is -5°F today')).toEqual([{ index: 6, units: [{ count: -5, unit: 'F', formatted: '-5 °F' }] }]);
	});

	it('does not parse lowercase c as celsius', () => {
		expect(parseUnits('I got a 5 c grade')).toEqual([]);
	});
});

describe('formatUnits', () => {
	it('converts metric length to imperial feet and inches', () => {
		expect(formatUnits([{ index: 7, units: [{ count: 100, unit: 'm', formatted: '100 meters' }] }])).toEqual([
			{ full: '~328 feet', short: '~328 ft' },
		]);
	});

	it('converts small imperial length to centimeters', () => {
		expect(formatUnits([{ index: 2, units: [{ count: 1, unit: 'ft', formatted: '1 foot' }] }])).toEqual([
			{ full: '~30.48 centimeters', short: '~30.48 cm' },
		]);
	});

	it('converts feet and inches to meters', () => {
		expect(
			formatUnits([
				{
					index: 4,
					units: [
						{ count: 5, unit: 'ft', formatted: '5 feet' },
						{ count: 10, unit: 'in', formatted: '10 inches' },
					],
				},
			])
		).toEqual([{ full: '~1.78 meters', short: '~1.78 m' }]);
	});

	it('converts pounds to kilograms', () => {
		expect(formatUnits([{ index: 0, units: [{ count: 150, unit: 'lb', formatted: '150 pounds' }] }])).toEqual([
			{ full: '~68.04 kilograms', short: '~68.04 kg' },
		]);
	});

	it('converts kilograms to pounds', () => {
		expect(formatUnits([{ index: 0, units: [{ count: 10, unit: 'kg', formatted: '10 kilograms' }] }])).toEqual([
			{ full: '~22.05 pounds', short: '~22.05 lb' },
		]);
	});

	it('converts grams to pounds', () => {
		expect(formatUnits([{ index: 0, units: [{ count: 500, unit: 'g', formatted: '500 grams' }] }])).toEqual([
			{ full: '~1.1 pounds', short: '~1.1 lb' },
		]);
	});

	it('converts ounces to kilograms', () => {
		expect(formatUnits([{ index: 0, units: [{ count: 8, unit: 'oz', formatted: '8 ounces' }] }])).toEqual([
			{ full: '~0.23 kilograms', short: '~0.23 kg' },
		]);
	});

	it('converts celsius to fahrenheit', () => {
		expect(formatUnits([{ index: 0, units: [{ count: 20, unit: 'C', formatted: '20 °C' }] }])).toEqual([
			{ full: '~68 °F', short: '~68°F' },
		]);
	});

	it('converts fahrenheit to celsius', () => {
		expect(formatUnits([{ index: 0, units: [{ count: 68, unit: 'F', formatted: '68 °F' }] }])).toEqual([
			{ full: '~20 °C', short: '~20°C' },
		]);
	});
});

describe('formatUnits(parseUnits())', () => {
	it('formats metric length from a message', () => {
		expect(formatUnits(parseUnits('I swam 100 meters today'))).toEqual([{ full: '~328 feet', short: '~328 ft' }]);
	});

	it('formats feet and inches from a message', () => {
		expect(formatUnits(parseUnits(`I'm 5'10" tall`))).toEqual([{ full: '~1.78 meters', short: '~1.78 m' }]);
	});

	it('formats pounds from a message', () => {
		expect(formatUnits(parseUnits('it weighs 150 lbs'))).toEqual([{ full: '~68.04 kilograms', short: '~68.04 kg' }]);
	});

	it('returns nothing when the message has no units', () => {
		expect(formatUnits(parseUnits('hello there'))).toEqual([]);
	});

	it("doesn't show secondary units when trivial for conversions", () => {
		expect(formatUnits(parseUnits('I swam 100 meters today'))).toEqual([{ full: '~328 feet', short: '~328 ft' }]);
	});
});

describe('parseUnits ambiguous stuff', () => {
	it(`does not parse 9's as feet when a letter follows the quote`, () => {
		expect(parseUnits(`9's my favorite number`)).toEqual([]);
	});

	it(`does not parse 9' as feet when the quote is a closing quote`, () => {
		expect(parseUnits(`And he said 'my favorite number is 9'`)).toEqual([]);
	});

	it('does not parse 9 in as inches when a space separates them', () => {
		expect(parseUnits('He put 9 in the pile')).toEqual([]);
	});

	it.each([`I'm 9 inches tall`, `I'm 9inches tall`, `I'm 9in tall`])('parses `%s` as 9 inches', message => {
		expect(parseUnits(message)).toEqual([{ index: 4, units: [{ count: 9, unit: 'in', formatted: '9 inches' }] }]);
	});
});
