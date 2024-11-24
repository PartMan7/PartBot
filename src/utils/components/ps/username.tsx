import type { ReactElement } from 'react';

export function Username({ name }: { name: string }): ReactElement {
	// @ts-expect-error -- Custom PS element
	return <username>{name}</username>;
}
