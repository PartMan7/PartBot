export function hasPoints<Points extends number[]>(user: Points, targetPoints: Points): boolean {
	for (const [index, targetPoint] of targetPoints.entries()) {
		if (user[index] > targetPoint) return true;
		if (user[index] === targetPoint) continue;
		return false;
	}
	return true;
}
