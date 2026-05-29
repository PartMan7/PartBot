import { createRoot } from 'react-dom/client';

import { Error as ErrorComponent } from '@/web/react/components/error';
import { GamesChart } from '@/web/react/components/games-chart';

import type { GamesChartResponse } from '@/database/games';

const container = document.getElementById('react-root')!;
const root = createRoot(container);

const room = window.location.pathname.split('/').at(-1)!;
fetch(`/api/games-chart/${room}`)
	.then(res => {
		if (!res.ok) throw new Error(`Failed to load chart data (${res.status})`);
		return res.json();
	})
	.then((data: GamesChartResponse) => {
		root.render(<GamesChart {...data} room={room} />);
	})
	.catch(err => root.render(<ErrorComponent err={err} />));
