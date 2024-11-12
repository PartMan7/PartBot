export function Button({
	name = 'send',
	value,
	children,
	...props
}: React.HTMLAttributes<HTMLButtonElement> & {
	name?: 'send' | 'parseCommand' | 'receive';
	value?: string;
}): React.ReactElement {
	return (
		<button name={name} value={value} {...props}>
			{children}
		</button>
	);
}
