import type { ReactElement } from 'react';

export function render(data: unknown): ReactElement {
	return <div>{JSON.stringify(data)}</div>;
}
