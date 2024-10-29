import type { Request, Response } from 'express';
import type { ReactElement } from 'react';

export type RouteHandler = (req: Request, res: Response & { render: Render }) => void;

export type APIRoute = {
	handler: RouteHandler;
	verb?: 'get' | 'post';
};

export type UIRoute = {
	handler: RouteHandler;
};

export type Render = (jsx: ReactElement, title: string, hydrate: boolean) => Promise<Response>;
