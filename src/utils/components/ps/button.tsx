import type { HTMLAttributes, ReactElement } from 'react';

export function Button({
	name = 'send',
	value,
	children,
	...props
}: HTMLAttributes<HTMLButtonElement> & {
	name?: 'send' | 'parseCommand' | 'receive';
	value: string;
}): ReactElement {
	return (
		<button name={name} value={value} {...props}>
			{children}
		</button>
	);
}
