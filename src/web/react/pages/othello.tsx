import { createRoot } from 'react-dom/client';

import { Error } from '@/web/react/components/error';
import { type GameModelAPI, ViewOnlyOthello } from '@/web/react/components/othello';

const container = document.getElementById('react-root')!;
const root = createRoot(container);

const gameId = window.location.pathname.split('/').at(-1)!;
fetch(`/api/othello/${gameId}`)
	.then(res => res.json())
	.then((data: GameModelAPI) => {
		root.render(<ViewOnlyOthello game={data} />);
	})
	.catch(err => root.render(<Error err={err} />));
