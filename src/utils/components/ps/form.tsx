import type { HTMLAttributes, ReactElement } from 'react';

export function Form({ value, children, ...props }: HTMLAttributes<HTMLFormElement> & { value: string }): ReactElement {
	return (
		<form data-submitsend={value} {...props}>
			{children}
		</form>
	);
}
