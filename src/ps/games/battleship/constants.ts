export enum ShipType {
	Patrol = 'patrol',
	Submarine = 'submarine',
	Destroyer = 'destroyer',
	Battleship = 'battleship',
	Carrier = 'carrier',
}

export const SHIP_DATA: Record<ShipType, { id: ShipType; name: string; symbol: string; size: number }> = {
	[ShipType.Patrol]: {
		id: ShipType.Patrol,
		name: 'Patrol',
		symbol: 'P',
		size: 2,
	},
	[ShipType.Submarine]: {
		id: ShipType.Submarine,
		name: 'Submarine',
		symbol: 'S',
		size: 3,
	},
	[ShipType.Destroyer]: {
		id: ShipType.Destroyer,
		name: 'Destroyer',
		symbol: 'D',
		size: 3,
	},
	[ShipType.Battleship]: {
		id: ShipType.Battleship,
		name: 'Battleship',
		symbol: 'B',
		size: 4,
	},
	[ShipType.Carrier]: {
		id: ShipType.Carrier,
		name: 'Carrier',
		symbol: 'C',
		size: 5,
	},
};

export const Ships = Object.values(SHIP_DATA);
