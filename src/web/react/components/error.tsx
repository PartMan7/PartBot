import { type ReactElement, memo } from 'react';

export const Error = memo(({ err }: { err: Error }): ReactElement => {
	console.error(err);
	return (
		<>
			<h1>Hi sorry something went wrong</h1>
			<h3>{err.message}</h3>
			<p>Check the browser console for more details...</p>
		</>
	);
});
