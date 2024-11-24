import type { Request, Response } from 'express';
import type { ReactElement } from 'react';

export type UIRouteHandler = (
	req: Request,
	res: { [key in keyof Response as key extends 'render' ? never : key]: Response[key] } & { render: Render }
) => void;

// Note: This isn't the actual type that's imported, but since we override render to support JSX...
export type APIRoute = {
	handler: (req: Request, res: Response) => void;
	verb?: 'get' | 'post';
};

export type UIRoute = {
	handler: (req: Request, res: Response) => void;
};

export type Render = (jsx: ReactElement, title: string, hydrate: boolean) => Promise<Response>;
