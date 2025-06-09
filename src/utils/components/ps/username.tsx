import type { CSSProperties, ReactElement } from 'react';

export function Username({
	name,
	className,
	style,
	clickable,
}: {
	name: string;
	clickable?: boolean;
	className?: string;
	style?: CSSProperties;
}): ReactElement {
	return (
		<username className={`${clickable ? 'username' : ''} ${className ?? ''}`} style={style}>
			{name}
		</username>
	);
}
