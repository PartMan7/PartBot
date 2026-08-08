import { Small } from '@/ps/games/render';
import metadata from '@/ps/games/splendor/metadata.json';
import { PokemonCard } from '@/ps/games/splendor/render';

export const swadloonExample = (
	<Small>
		<PokemonCard data={metadata.pokemon.swadloon} />
	</Small>
);
