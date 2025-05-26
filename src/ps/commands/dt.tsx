import { GOData } from '@/cache/pokemonGo';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';
import { PSIcon } from '@/utils/components/ps/psicon';
import { getCP } from '@/utils/pokemonGo';

import type { PSCommand } from '@/types/chat';

function getPokemonGen(num: number): number {
	return [0, 152, 252, 387, 495, 650, 722, 810, 906, 1011].findIndex(firstOfGen => num < firstOfGen);
}

export const command: PSCommand[] = [
	{
		name: 'dt',
		help: 'Shows the data for a Pokémon.',
		syntax: 'CMD [mon/move]',
		// TODO: Keep this GO-only
		async run({ broadcastHTML, arg, $T }) {
			const query = toId(arg);
			if (query === 'constructor') throw new ChatError($T('SCREW_YOU'));
			if (query in GOData.pokedex) {
				const mon = GOData.pokedex[query];
				const stats = mon.baseStats;

				return broadcastHTML(
					<>
						<div className="message">
							<ul className="utilichart">
								<li className="result">
									<span className="col numcol">{mon.unreleased ? 'UR' : 'GO'}</span>{' '}
									<span className="col iconcol">
										<PSIcon pokemon={toId(mon.name)} />
									</span>{' '}
									<span className="col pokemonnamecol" style={{ whiteSpace: 'nowrap' }}>
										<a href={`https://dex.pokemonshowdown.com/pokemon/${toId(mon.name)}`} target="_blank">
											{mon.name}
										</a>
									</span>{' '}
									<span className="col typecol">
										{mon.types.map(type => (
											<img src={`https://play.pokemonshowdown.com/sprites/types/${type}.png`} alt={type} height="14" width="32" />
										))}
									</span>{' '}
									<span style={{ float: 'left', minHeight: 26 }}>
										<span className="col statcol">
											<em>Atk</em>
											<br />
											{stats.atk}
										</span>{' '}
										<span className="col statcol">
											<em>Def</em>
											<br />
											{stats.def}
										</span>{' '}
										<span className="col statcol">
											<em>Sta</em>
											<br />
											{stats.sta}
										</span>{' '}
										<span className="col bstcol" style={{ marginLeft: 10 }}>
											<em>40</em>
											<br />
											{getCP(stats, 40)}
										</span>{' '}
										<span className="col bstcol" style={{ marginLeft: 10 }}>
											<em>50</em>
											<br />
											{getCP(stats, 50)}
										</span>{' '}
										<span className="col bstcol" style={{ marginLeft: 10 }}>
											<em>MCP</em>
											<br />
											{getCP(stats, 51)}
										</span>{' '}
									</span>
								</li>
								<li style={{ clear: 'both' }}></li>
							</ul>
						</div>
						<font size={1}>
							<font color="#686868">Dex#:</font> {mon.num}&nbsp;|&#8287;<font color="#686868">Gen:</font> {getPokemonGen(mon.num)}
							&nbsp;|&#8287;
							<font color="#686868">Height:</font> {mon.heightm} m&nbsp;|&#8287;<font color="#686868">Weight:</font> {mon.weightkg} kg
							{mon.shiny ? <>&nbsp;|&#8287; ✓ Can be shiny</> : null}
							{mon.shinyLocked ? <>&nbsp;|&#8287;Shiny-locked</> : null}&nbsp;|&#8287;<font color="#686868">Evolution:</font>{' '}
							{mon.evos?.join(', ') || 'None'}
						</font>
						<br />
						<hr />
						<details style={{ marginBottom: -10 }}>
							<summary title={mon.unreleased ? 'Moves are for an unreleased Pokémon and may not be accurate' : undefined}>
								Moves{mon.unreleased ? '*' : ''}
							</summary>
							Fast: {[...mon.moves.fast, ...mon.moves.fast_elite.map(move => `${move}*`)].sort().join(', ')}
							<br />
							Charged: {[...mon.moves.charged, ...mon.moves.charged_elite.map(move => `${move}*`)].sort().join(', ')}
						</details>
					</>
				);
			}

			throw new ChatError($T('ENTRY_NOT_FOUND'));
		},
	},
];
