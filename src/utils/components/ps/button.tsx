import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

export function Button({
	name = 'send',
	value,
	children,
	...props
}: HTMLAttributes<HTMLButtonElement> & {
	name?: 'send' | 'parseCommand' | 'receive';
	value: string;
	children: ReactNode;
}): ReactElement {
	return (
		<button name={name} value={value} {...props}>
			{children}
		</button>
	);
}
