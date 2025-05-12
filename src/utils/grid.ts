/**
 * All grid operations act on INVERSE Cartesian planes. [0] is the horizontal distance from the
 * original measured to the left, while [1] is the vertical distance measured downwards.
 */

import { range } from '@/utils/range';

export type Point = [number, number];

export function coincident(point1: Point, point2: Point): boolean {
	return point1[0] === point2[0] && point1[1] === point2[1];
}

export function taxicab(from: Point, to: Point): number {
	return Math.abs(to[0] - from[0]) + Math.abs(to[1] - from[1]);
}

export function rangePoints(from: Point, to: Point, length?: number): Point[] {
	let count: number | undefined = length;
	if (!length) {
		const xDist = to[0] - from[0];
		const yDist = to[1] - from[1];
		if (xDist && yDist) throw new TypeError(`length was not provided for a range between points ${from} -> ${to}`);
		count = xDist || yDist;
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
