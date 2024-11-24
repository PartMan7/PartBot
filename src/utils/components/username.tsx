import { Tools as ClientTools } from 'ps-client';

import type { ReactElement } from 'react';

export function Username({
	name,
	useOriginalColor,
	children,
}: {
	name: string;
	useOriginalColor?: boolean;
	children?: string;
}): ReactElement {
	const namecolour = ClientTools.HSL(name);
	const [h, s, l] = useOriginalColor ? (namecolour.base?.hsl ?? namecolour.hsl) : namecolour.hsl;
	return <strong style={{ color: `hsl(${h},${s}%,${l}%)` }}>{children ?? name}</strong>;
}
