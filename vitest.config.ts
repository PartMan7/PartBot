import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: 'node',
		setupFiles: ['src/globals/prototypes.ts', 'src/ps/__tests__/setup.ts'],
	},
});
