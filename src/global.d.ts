import type * as axios from 'axios';
import type { promises as fs } from 'fs';

declare global {
	const axios: axios;
	const fs: fs;

	// const Tools: tools;
}

import /* type * as tools from */ 'tools';


export {};
