import { createRoot } from 'react-dom/client';

import { Error as ErrorComponent } from '@/web/react/components/error';
import { Quotes } from '@/web/react/components/quotes';

import type { QuoteResponse } from '@/web/react/components/quotes';

const container = document.getElementById('react-root')!;
const root = createRoot(container);

const parts = window.location.pathname.split('/').filter(Boolean);
const random = parts.at(-1) === 'random';
const room = random ? parts.at(-2)! : parts.at(-1)!;
fetch(`/api/quotes/${room}${random ? '/random' : ''}`)
	.then(res => {
		if (!res.ok) throw new Error(`Failed to load quotes (${res.status})`);
		return res.json();
	})
	.then((data: QuoteResponse | QuoteResponse[]) => {
		root.render(<Quotes quotes={Array.isArray(data) ? data : [data]} room={room} random={random} />);
	})
	.catch(err => root.render(<ErrorComponent err={err} />));
