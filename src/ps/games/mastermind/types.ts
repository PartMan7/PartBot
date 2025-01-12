export type Guess = [number, number, number, number];

export type GuessResult = { exact: number; moved: number };

export type State = {
	solution: Guess;
	board: { guess: Guess; result: GuessResult }[];
	cap: number;
	turn: '';
};
