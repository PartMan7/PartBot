import { GOData } from '@/cache/pokemonGo';
import { ChatError } from '@/utils/chatError';
import { PSIcon } from '@/utils/components/ps/psicon';
import { getCP } from '@/utils/pokemonGo';
import { toId } from '@/utils/toId';

import type { PSCommand } from '@/types/chat';

function getPokemonGen(num: number): number {
	return [0, 152, 252, 387, 495, 650, 722, 810, 906, 1011].findIndex(firstOfGen => num < firstOfGen);
}

export const command: PSCommand[] = [
	{
		name: 'dt',
		help: {
			pokemongo: 'Shows Pokémon GO data for a Pokémon or move.',
			default: 'Shows the data for a Pokémon.',
		},
		syntax: 'CMD [mon/move]',
		flags: { allowPMs: true },
		categories: ['utility'],
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
						<details>
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

			if (query in GOData.fastMoves) {
				const move = GOData.fastMoves[query];
				return broadcastHTML(
					<>
						<ul className="utilichart">
							<li className="result">
								<span className="col movenamecol">
									&nbsp;
									<a
										href={`https://gamepress.gg/pokemongo/pokemon-move/${move.name.replace(/ /g, '-').toLowerCase()}`}
										target="_blank"
									>
										{move.name}
									</a>
								</span>
								<span className="col typecol">
									<img
										src={`https://play.pokemonshowdown.com/sprites/types/${move.type}.png`}
										alt={move.type}
										width="32"
										height="14"
									/>
									<img src={`https://play.pokemonshowdown.com/sprites/categories/Special.png`} alt="Fast" width="32" height="14" />
								</span>
							</li>

							<li className="result">
								<span className="col widelabelcol" style={{ marginTop: 10, color: '#999' }}>
									PvP
								</span>
								<span className="col widelabelcol">
									<em>Energy</em>
									<br />
									{move.pvp.energy}
								</span>
								<span className="col widelabelcol">
									<em>Power</em>
									<br />
									{move.pvp.power}
								</span>
								<span className="col widelabelcol">
									<em>Turns</em>
									<br />
									{move.pvp.turns}
								</span>
								<span className="col widelabelcol">
									<em>EPS</em>
									<br />
									{move.pvp.eps}
								</span>
								<span className="col widelabelcol">
									<em>DPS</em>
									<br />
									{move.pvp.dps}
								</span>
							</li>

							<li className="result">
								<span className="col widelabelcol" style={{ marginTop: 10, color: '#999' }}>
									PvE
								</span>
								<span className="col widelabelcol">
									<em>Energy</em>
									<br />
									{move.pve.energy}
								</span>
								<span className="col widelabelcol">
									<em>Power</em>
									<br />
									{move.pve.power}
								</span>
								<span className="col widelabelcol">
									<em>Time</em>
									<br />
									{move.pve.duration}s
								</span>
								<span className="col widelabelcol">
									<em>EPS</em>
									<br />
									{move.pve.eps}
								</span>
								<span className="col widelabelcol">
									<em>DPS</em>
									<br />
									{move.pve.dps}
								</span>
								<span className="col widelabelcol">
									<em>Delay</em>
									<br />
									{move.pve.delay}s
								</span>
							</li>
						</ul>
						<div style={{ height: 36 }} data-why="BECAUSE PS CSS SUCKS" />
					</>
				);
			}

			if (query in GOData.chargedMoves) {
				const move = GOData.chargedMoves[query];
				return broadcastHTML(
					<>
						<ul className="utilichart">
							<li className="result">
								<span className="col movenamecol">
									&nbsp;
									<a
										href={`https://gamepress.gg/pokemongo/pokemon-move/${move.name.replace(/ /g, '-').toLowerCase()}`}
										target="_blank"
									>
										{move.name}
									</a>
								</span>
								<span className="col typecol">
									<img
										src={`https://play.pokemonshowdown.com/sprites/types/${move.type}.png`}
										alt={move.type}
										width="32"
										height="14"
									/>
									<img src={`https://play.pokemonshowdown.com/sprites/categories/Physical.png`} alt="Charged" width="32" height="14" />
								</span>
							</li>
							<li className="result">
								<span className="col widelabelcol" style={{ marginTop: 10, color: '#999' }}>
									PvP
								</span>
								<span className="col widelabelcol">
									<em>Energy</em>
									<br />
									{move.pvp.energy}
								</span>
								<span className="col widelabelcol">
									<em>Power</em>
									<br />
									{move.pvp.power}
								</span>
								<span className="col labelcol">
									<em>DPE</em>
									<br />
									{move.pvp.dpe}
								</span>
								<span className="col movedesccol">&nbsp;&nbsp;{move.desc}</span>
							</li>
							<li className="result">
								<span className="col widelabelcol" style={{ marginTop: 10, color: '#999' }}>
									PvE
								</span>
								<span className="col widelabelcol">
									<em>Energy</em>
									<br />
									{move.pve.energy}
								</span>
								<span className="col widelabelcol">
									<em>Power</em>
									<br />
									{move.pve.power}
								</span>
								<span className="col labelcol">
									<em>Time</em>
									<br />
									{move.pve.duration}s
								</span>
								<span className="col labelcol">
									<em>DPE</em>
									<br />
									{move.pve.dpe}
								</span>
								<span className="col widelabelcol">
									<em>
										D<sup>2</sup>/ES
									</em>
									<br />
									{move.pve.d2pes}
								</span>
								<span className="col widelabelcol">
									<em>Delay</em>
									<br />
									{move.pve.delay}s
								</span>
							</li>
						</ul>
						<div style={{ height: 36 }} data-why="BECAUSE PS CSS SUCKS" />
					</>
				);
			}

			throw new ChatError($T('ENTRY_NOT_FOUND'));
		},
	},
];
