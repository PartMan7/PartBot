import { Tools as ClientTools } from 'ps-client';

export function Username({
	name,
	useOriginalColor,
	children,
}: {
	name: string;
	useOriginalColor?: boolean;
	children?: string;
}): React.ReactElement {
	const namecolour = ClientTools.HSL(name);
	const [h, s, l] = useOriginalColor ? (namecolour.base?.hsl ?? namecolour.hsl) : namecolour.hsl;
	return <strong style={{ color: `hsl(${h},${s}%,${l}%)` }}>{children ?? name}</strong>;
}
