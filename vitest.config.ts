import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		setupFiles: ['src/globals/prototypes.ts', 'src/ps/__tests__/setup.ts'],
	},
});
