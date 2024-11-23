import type { ReactNode } from 'react';

export function Button({
	name = 'send',
	value,
	children,
	...props
}: React.HTMLAttributes<HTMLButtonElement> & {
	name?: 'send' | 'parseCommand' | 'receive';
	value: string;
	children: ReactNode;
}): React.ReactElement {
	return (
		<button name={name} value={value} {...props}>
			{children}
		</button>
	);
}
