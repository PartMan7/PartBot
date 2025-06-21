import { Ships } from '@/ps/games/battleship/constants';
import { render } from '@/ps/games/battleship/render';
import { type BaseContext, BaseGame, createGrid } from '@/ps/games/game';
import { ChatError } from '@/utils/chatError';
import { type Point, parsePointA1, pointToA1, rangePoints, sameRowOrCol } from '@/utils/grid';

import type { ToTranslate, TranslatedText } from '@/i18n/types';
import type { ShipType } from '@/ps/games/battleship/constants';
import type { State, Turn } from '@/ps/games/battleship/types';
import type { ActionResponse, Player } from '@/ps/games/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/battleship/meta';

export class Battleship extends BaseGame<State> {
	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.ready = { A: false, B: false };
		this.state.board = {
			ships: { A: createGrid(10, 10, () => null), B: createGrid(10, 10, () => null) },
			attacks: { A: createGrid(10, 10, () => null), B: createGrid(10, 10, () => null) },
		};
	}

	onAddPlayer(user: User, ctx: string): ActionResponse<Record<string, unknown>> {
		// TODO: ship selection
	}

	onStart(): ActionResponse {
		this.turns.shuffle(this.prng);
		return { success: true, data: null };
	}

	action(user: User, input: string) {
		const [action, ctx] = input.lazySplit(' ', 1);
		// TODO: Pseudo start
		const player = this.getPlayer(user)! as Player & { turn: Turn };
		switch (action) {
			case 'set': {
				if (this.state.ready[player.turn] === true) throw new ChatError("Hi you've already set your ships!" as ToTranslate);
				const set = ctx.split('|').map(coords => coords.split('-').map(parsePointA1));
				this.validateShipPositions(set);
				// Ship positions are valid
				// TODO
				break;
			}
			case 'confirm-set': {
				if (this.state.ready[player.turn] === true) throw new ChatError("Hi you've already set your ships!" as ToTranslate);
				break;
			}
			case 'hit': {
				const targeted = parsePointA1(ctx);
				if (!targeted) this.throw();
				const [x, y] = targeted;
				if (player.turn !== this.turn) this.throw();
				const opponent = this.getNext();
				let hit: ShipType | null;
				try {
					hit = this.state.board.ships[opponent].access([x, y]);
				} catch {
					throw new ChatError('Invalid range given.' as ToTranslate);
				}
				this.state.board.attacks[player.turn][x][y] = hit;
				this.nextPlayer();
				this.update();
				// TODO: Check wincons
				break;
			}
			default:
				this.throw();
		}
	}

	render(side: string | null) {
		// TODO
		return render.bind(this.renderCtx)({ side, turn: this.turn });
	}

	update(user?: string): void {
		if (!this.started) {
			// TODO: Render ship selection screen / preview!
			return;
		}
		super.update(user);
	}

	onEnd() {
		return 'Done' as TranslatedText;
	}

	validateShipPositions(input: (Point | null)[][]) {
		if (input.length !== Ships.length) this.throw();
		if (!input.every(points => points.length === 2 && !points.some(point => point === null))) this.throw();
		const positions = Ships.map((ship, index) => ({ ship, from: input[index][0]!, to: input[index][1]! }));

		const occupied: Record<string, string> = {};

		positions.forEach(({ ship, from, to }) => {
			if (!sameRowOrCol(from, to)) {
				throw new ChatError(
					`Cannot place ${ship.name} between given points ${pointToA1(from)} and ${pointToA1(to)} (not in line)` as ToTranslate
				);
			}
			rangePoints(from, to).forEach(pointInRange => {
				const point = pointToA1(pointInRange);
				if (occupied[point]) {
					throw new ChatError(`${point} would be occupied by both ${ship.name} and ${occupied[point]}` as ToTranslate);
				} else {
					occupied[point] = ship.name;
				}
			});
		});

		// Ship positions should be valid now
	}
}
