// Extends React/JSX types with PS-specific ones

import type { HTMLProps } from 'react';

type _PSIconProps = HTMLProps<HTMLSpanElement> & { pokemon?: string; type?: string; item?: string };

declare module 'react' {
	export type PSIconProps = _PSIconProps;
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace -- Used to augment IntrinsicElements
	namespace JSX {
		export interface IntrinsicElements {
			psicon: _PSIconProps;
			font: HTMLProps<HTMLSpanElement>;
		}
	}
}
