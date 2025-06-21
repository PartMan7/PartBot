/**
 * All grid operations act on INVERSE Cartesian planes. [0] is the horizontal distance from the
 * original measured to the left, while [1] is the vertical distance measured downwards.
 */

import { range } from '@/utils/range';

export type Point = [number, number];

export function parsePoint(input: string): Point | null {
	const matched = input.match(/^(\d+)\s*(?:x|,|\s)*(\d+)$/);
	if (!matched) return null;
	return [+matched[1], +matched[2]];
}

/**
 * Assumes grid follows top-down A-Z, left-right 1-9
 * @param input
 * @example parsePointA1('B5'); // [1, 4]
 */
export function parsePointA1(input: string): Point | null {
	const matched = input.match(/^([a-z])(\d+)$/i);
	if (!matched) return null;
	return [matched[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0), +matched[2] - 1];
}

export function pointToA1(input: Point): string {
	return `${(input[0] + 1).toLetter()}${input[1] + 1}`;
}

export function coincident(point1: Point, point2: Point): boolean {
	return point1[0] === point2[0] && point1[1] === point2[1];
}

export function taxicab(from: Point, to: Point): number {
	return Math.abs(to[0] - from[0]) + Math.abs(to[1] - from[1]);
}

export function sameRowOrCol(point: Point, ref: Point): boolean {
	return point[0] === ref[0] || point[1] === ref[1];
}

export function rangePoints(from: Point, to: Point, length?: number): Point[] {
	let count: number | undefined = length;
	if (!length) {
		const xDist = to[0] - from[0];
		const yDist = to[1] - from[1];
		if (xDist && yDist) throw new TypeError(`length was not provided for a range between points ${from} -> ${to}`);
		if (xDist === 0 && yDist === 0) return [to];
		count = (xDist || yDist) + 1;
	}
	const xRange = range(from[0], to[0], count!);
	const yRange = range(from[1], to[1], count!);
	return Array.from({ length: count! }, (_, index) => [xRange[index], yRange[index]]);
}

export function stepPoint(point: Point, by: Point): Point {
	return [point[0] + by[0], point[1] + by[1]];
}

export function multiStepPoint(point: Point, by: Point, steps: number): Point {
	return [point[0] + by[0] * steps, point[1] + by[1] * steps];
}

export function flipPoint(point: Point): Point {
	return [-point[0], -point[1]];
}
